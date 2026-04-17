/**
 * POST /api/render-video
 *
 * Renderiza um vídeo MP4 com Remotion e salva no Supabase Storage.
 * Chamado em fire-and-forget por /api/generate após criar o projeto.
 *
 * Body: {
 *   projectId: string
 *   content?:      VideoContent  (se não passado, busca do banco)
 *   format?:       ProjectFormat (se não passado, usa project.format)
 *   imageBuffers?: (string|null)[] — base64 das imagens Imagen 3
 * }
 *
 * REQUISITO DE PRODUÇÃO: Chromium instalado na máquina.
 * Dev: detectado automaticamente pelo @remotion/renderer.
 * Prod: Railway/Fly.io com Dockerfile que instala chromium,
 *       ou use Remotion Lambda para renders serverless.
 */

import { NextRequest, NextResponse } from 'next/server'
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer'
import { getDb } from '@/lib/db'
import { copyFile } from '@/lib/storage/local'
import type { VideoContent } from '@/types/content'
import type { ProjectFormat } from '@/types/database'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export const maxDuration = 300

// ─── Constants (mirrors remotion/animations.ts) ───────────────────────────────

const FPS            = 30
const INTRO_FRAMES   = 2 * FPS   // 60 — horizontal / 45 para vertical (VerticalVideo sobrescreve via calculateMetadata)
const OUTRO_FRAMES   = 3 * FPS   // 90

// ─── Bundle cache ─────────────────────────────────────────────────────────────

let bundlePathCache: string | null = null

async function getServeUrl(): Promise<string> {
  if (bundlePathCache) return bundlePathCache

  // 1. Tenta ler do arquivo gerado por `npm run bundle-remotion`
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), '.remotion-bundle.json'),
      'utf-8'
    )
    bundlePathCache = JSON.parse(raw).bundlePath as string
    return bundlePathCache!
  } catch {
    // 2. Fallback: bundle sob demanda (dev — requer @remotion/bundler instalado)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { bundle } = require('@remotion/bundler') as typeof import('@remotion/bundler')
      const entryPoint = path.join(process.cwd(), 'remotion', 'Root.tsx')
      bundlePathCache = await bundle({ entryPoint }) as string
      return bundlePathCache!
    } catch {
      throw new Error(
        'Bundle Remotion não encontrado. Execute: npm run bundle-remotion\n' +
        'Se @remotion/bundler não estiver instalado: npm install @remotion/bundler'
      )
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDurationToFrames(duration: string): number {
  const seconds = parseFloat(duration.replace('s', '').trim())
  return Math.max(FPS, Math.round(seconds * FPS))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateTotalFrames(scenes: { duration: string }[], introFrames = INTRO_FRAMES): number {
  const sceneFrames = scenes.reduce(
    (sum, s) => sum + parseDurationToFrames(s.duration),
    0
  )
  return introFrames + sceneFrames + OUTRO_FRAMES
}

// uploadToStorage agora usa filesystem local via copyFile

function fail(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: {
    projectId: string
    content?: VideoContent
    format?: ProjectFormat
    imageBuffers?: (string | null)[]
  }

  try {
    body = await request.json()
  } catch {
    return fail('Body JSON inválido', 400)
  }

  const { projectId, content: bodyContent, format: bodyFormat, imageBuffers } = body

  if (!projectId) return fail('projectId obrigatório', 400)

  const db = getDb()

  // ── 1. Busca projeto ────────────────────────────────────────────────────────
  const project = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as {
    id: string; brand_kit_id: string | null; content_data: string | null; format: string;
    title: string; caption_text: string | null; hashtags: string | null
  } | undefined

  if (!project) return fail('Projeto não encontrado', 404)

  let parsedContentData: VideoContent | null = null
  if (project.content_data) {
    try {
      parsedContentData = JSON.parse(project.content_data) as VideoContent
    } catch {
      return fail('Dados do projeto corrompidos (JSON inválido)', 422)
    }
  }
  const content = (bodyContent ?? parsedContentData) as VideoContent | null
  const format  = (bodyFormat ?? project.format) as ProjectFormat

  if (!content?.scenes?.length) return fail('Dados de vídeo não encontrados no projeto', 400)

  // ── 2. Determina composição ─────────────────────────────────────────────────
  const isVertical    = format === 'video_9_16'
  const compositionId = isVertical ? 'VideoVertical' : 'VideoHorizontal'

  // ── 3. Busca brand kit ──────────────────────────────────────────────────────
  let brandKit: {
    name: string; primary_color: string | null; secondary_color: string | null
    accent_color: string | null; font_title: string | null; font_body: string | null; logo_url: string | null
  } | null = null

  if (project.brand_kit_id) {
    brandKit = db.prepare(
      `SELECT name, primary_color, secondary_color, accent_color, font_title, font_body, logo_url FROM brand_kits WHERE id = ?`
    ).get(project.brand_kit_id) as typeof brandKit ?? null
  }

  // ── 4. Escreve imagens em arquivos temporários ──────────────────────────────
  const tempPaths: string[] = []
  const imageUrls: (string | null)[] = []

  try {
    if (imageBuffers?.length) {
      for (let i = 0; i < imageBuffers.length; i++) {
        const b64 = imageBuffers[i]
        if (b64) {
          const tmpPath = path.join(os.tmpdir(), `remotion-${projectId}-img-${i}.jpg`)
          await fs.writeFile(tmpPath, Buffer.from(b64, 'base64'))
          tempPaths.push(tmpPath)
          // file:// URI para o Remotion ler localmente
          imageUrls.push(`file://${tmpPath}`)
        } else {
          imageUrls.push(null)
        }
      }
    } else {
      // Sem imagens — preenche com null para cada cena
      content.scenes.forEach(() => imageUrls.push(null))
    }

    // ── 5. Prepara inputProps ─────────────────────────────────────────────────
    const inputProps = {
      scenes:     content.scenes,
      title:      project.title,
      brandKit:   brandKit ?? null,
      music:      content.music ?? 'energetic',
      imageUrls,
      isVertical,
    }

    // ── 6. Bundle / serve URL ─────────────────────────────────────────────────
    const serveUrl = await getServeUrl()

    // ── 7. Seleciona composição (executa calculateMetadata) ───────────────────
    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps,
    })

    // ── 8. Caminhos de saída temporários ─────────────────────────────────────
    const outputMp4   = path.join(os.tmpdir(), `remotion-${projectId}.mp4`)
    const outputThumb = path.join(os.tmpdir(), `remotion-${projectId}-thumb.jpg`)
    tempPaths.push(outputMp4, outputThumb)

    // ── 9. renderMedia ────────────────────────────────────────────────────────
    let lastReportedProgress = -1

    await renderMedia({
      composition,
      serveUrl,
      codec:          'h264',
      outputLocation: outputMp4,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100)
        if (pct - lastReportedProgress >= 5) {
          lastReportedProgress = pct
          // fire-and-forget — onProgress deve ser síncrono
          db.prepare(`UPDATE projects SET render_progress = ? WHERE id = ?`).run(pct, projectId)
        }
      },
    })

    // ── 10. Copia MP4 para public/renders ────────────────────────────────────
    const videoUrl = await copyFile(outputMp4, projectId, 'video.mp4')

    // ── 11. Thumbnail — frame logo após o intro ───────────────────────────────
    const thumbnailFrame = isVertical
      ? Math.round(1.5 * FPS)   // 45 frames (VerticalVideo intro)
      : INTRO_FRAMES             // 60 frames

    await renderStill({
      composition,
      serveUrl,
      output:      outputThumb,
      inputProps,
      frame:       thumbnailFrame,
      imageFormat: 'jpeg',
    })

    const thumbnailUrl = await copyFile(outputThumb, projectId, 'thumbnail.jpg')

    // ── 12. Atualiza projeto ──────────────────────────────────────────────────
    db.prepare(`
      UPDATE projects SET status = 'ready', render_progress = 100, video_url = ?, thumbnail_url = ?,
      caption_text = ?, hashtags = ?, updated_at = datetime('now') WHERE id = ?
    `).run(videoUrl, thumbnailUrl, content.caption ?? null, content.hashtags ? JSON.stringify(content.hashtags) : null, projectId)

    return NextResponse.json({ videoUrl, thumbnailUrl }, { status: 200 })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[render-video] Erro no projeto ${projectId}:`, msg)
    db.prepare(`UPDATE projects SET status = 'error', updated_at = datetime('now') WHERE id = ?`).run(projectId)

    return fail(`Render falhou: ${msg}`)

  } finally {
    // Limpa arquivos temporários
    await Promise.allSettled(
      tempPaths.map((p) => fs.rm(p, { force: true }))
    )
  }
}
