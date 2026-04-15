/**
 * POST /api/refine
 *
 * Refina um projeto existente aplicando uma instrução via Claude.
 *
 * Body: { projectId: string; instruction: string }
 *
 * Formatos estáticos (carousel, post, story): re-renderiza slides com Satori, retorna 200.
 * Caption: atualiza apenas o texto, retorna 200.
 * Vídeo (video_16_9, video_9_16): fire-and-forget para /api/render-video, retorna 202.
 *   - Mudança grande (cenas adicionadas/removidas ou visual alterado): gera novas imagens com Imagen 3.
 *   - Mudança de texto apenas: re-renderiza sem novas imagens.
 *
 * Salva snapshot anterior em previous_content_data para suporte ao botão Desfazer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb, parseProject } from '@/lib/db'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { renderContent, uploadRendered } from '@/lib/render/slide-renderer'
import {
  generateMultipleImages,
  getSizeForFormat,
} from '@/lib/ai/image-generator'
import type { BrandKit } from '@/lib/api/brand-kits'
import type { ProjectFormat } from '@/types/database'

export const maxDuration = 300

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefineBody {
  projectId:   string
  instruction: string
}

interface PreviousSnapshot {
  content_data:  Record<string, unknown>
  slides_urls:   string[] | null
  video_url:     string | null
  thumbnail_url: string | null
  caption_text:  string | null
  hashtags:      string[] | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
    ),
  ])
}

function buildPrompt(
  instruction: string,
  content:     Record<string, unknown>,
  format:      ProjectFormat,
): string {
  return `Você está refinando um conteúdo existente para o formato "${format}".

INSTRUÇÃO DO USUÁRIO: "${instruction}"

Conteúdo atual (JSON):
${JSON.stringify(content, null, 2)}

REGRAS OBRIGATÓRIAS:
1. Aplique APENAS a mudança solicitada — não altere campos não mencionados
2. Mantenha a estrutura JSON idêntica (mesmos campos, mesmo número de slides/frames/cenas, salvo se o usuário pediu explicitamente adicionar/remover)
3. NÃO invente informações além do solicitado
4. Retorne SOMENTE um JSON válido com exatamente dois campos:
   - "summary": string em pt-BR descrevendo o que foi alterado (máx 120 chars)
   - "content": o JSON completo e atualizado (estrutura idêntica ao original)

Responda APENAS com JSON válido. Sem markdown, sem código, sem explicações fora do JSON.`
}

function isVideoBigChange(
  oldContent: Record<string, unknown>,
  newContent: Record<string, unknown>,
): boolean {
  const oldScenes = (oldContent.scenes as unknown[]) ?? []
  const newScenes = (newContent.scenes as unknown[]) ?? []
  if (oldScenes.length !== newScenes.length) return true
  return newScenes.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (scene: any, i: number) => scene.visualDescription !== (oldScenes[i] as any)?.visualDescription,
  )
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: RefineBody
  try {
    body = await request.json()
  } catch {
    return fail('Body JSON inválido', 400)
  }

  const { projectId, instruction } = body
  if (!projectId)           return fail('projectId obrigatório', 400)
  if (!instruction?.trim()) return fail('instruction obrigatória', 400)

  // Rate limit por IP
  const ip = request.headers.get('x-forwarded-for') ?? 'local'
  const rl = checkRateLimit(`refine:${ip}`, 10, 60_000)
  if (!rl.ok) return rateLimitResponse(rl.resetAt)

  const db = getDb()

  // ── Fetch project ───────────────────────────────────────────────────────────
  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as Parameters<typeof parseProject>[0] | undefined
  if (!row) return fail('Projeto não encontrado', 404)

  const project = parseProject(row)
  if (project.status !== 'ready') return fail('Projeto não está pronto para refinamento', 400)

  // ── API keys ────────────────────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return fail('GEMINI_API_KEY não configurada no .env.local', 400)


  // ── Brand kit ───────────────────────────────────────────────────────────────
  let brandKit: BrandKit | null = null
  if (row.brand_kit_id) {
    brandKit = db.prepare(`SELECT * FROM brand_kits WHERE id = ?`).get(row.brand_kit_id) as BrandKit ?? null
  }

  const currentContent = project.content_data as Record<string, unknown>
  const format         = project.format as ProjectFormat

  // ── Snapshot anterior (para Desfazer) ───────────────────────────────────────
  const previousSnapshot: PreviousSnapshot = {
    content_data:  currentContent,
    slides_urls:   project.slides_urls   as string[] | null,
    video_url:     project.video_url     as string | null,
    thumbnail_url: project.thumbnail_url as string | null,
    caption_text:  project.caption_text  as string | null,
    hashtags:      project.hashtags      as string[] | null,
  }

  // ── Gemini — aplica refinamento ─────────────────────────────────────────────
  const genAI = new GoogleGenerativeAI(geminiKey)
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  let refinedContent: Record<string, unknown>
  let summary: string

  try {
    const result = await withTimeout(
      geminiModel.generateContent({
        contents:         [{ role: 'user', parts: [{ text: buildPrompt(instruction.trim(), currentContent, format) }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
      }),
      60_000,
    )

    const raw     = result.response.text().trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const parsed  = JSON.parse(cleaned)

    refinedContent = parsed.content
    summary        = String(parsed.summary ?? 'Conteúdo atualizado.').slice(0, 150)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return fail(`Refinamento Gemini falhou: ${msg}`, 502)
  }

  // ── Caption — apenas atualiza texto ─────────────────────────────────────────
  if (format === 'caption') {
    db.prepare(`
      UPDATE projects SET
        content_data = ?, caption_text = ?, hashtags = ?,
        previous_content_data = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(refinedContent),
      (refinedContent.caption  as string   | null) ?? project.caption_text ?? null,
      (refinedContent.hashtags as string[] | null) ? JSON.stringify(refinedContent.hashtags) : (row.hashtags ?? null),
      JSON.stringify(previousSnapshot),
      projectId,
    )

    return NextResponse.json({
      project:   { ...project, content_data: refinedContent },
      content:   refinedContent,
      slideUrls: project.slides_urls ?? [],
      summary,
    })
  }

  // ── Formatos estáticos — re-renderiza com Satori ────────────────────────────
  if (format === 'carousel' || format === 'post' || format === 'story') {
    let pngBuffers: Buffer[]
    try {
      pngBuffers = await renderContent(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        refinedContent as any,
        brandKit,
        format,
        [], // sem novas imagens Imagen 3 no refinamento
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return fail(`Re-render falhou: ${msg}`, 500)
    }

    let slideUrls: string[]
    try {
      slideUrls = await uploadRendered(pngBuffers, projectId)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return fail(`Upload falhou: ${msg}`, 500)
    }

    db.prepare(`
      UPDATE projects SET
        content_data = ?, slides_urls = ?, thumbnail_url = ?,
        caption_text = ?, hashtags = ?,
        previous_content_data = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(refinedContent),
      JSON.stringify(slideUrls),
      slideUrls[0] ?? project.thumbnail_url ?? null,
      (refinedContent.caption  as string   | null) ?? project.caption_text ?? null,
      (refinedContent.hashtags as string[] | null) ? JSON.stringify(refinedContent.hashtags) : (row.hashtags ?? null),
      JSON.stringify(previousSnapshot),
      projectId,
    )

    return NextResponse.json({
      project:   { ...project, content_data: refinedContent, slides_urls: slideUrls, thumbnail_url: slideUrls[0] ?? project.thumbnail_url },
      content:   refinedContent,
      slideUrls,
      summary,
    })
  }

  // ── Formatos de vídeo — re-render assíncrono ────────────────────────────────
  if (format === 'video_16_9' || format === 'video_9_16') {
    const bigChange = isVideoBigChange(currentContent, refinedContent)

    let imageBase64: (string | null)[] = []

    if (bigChange) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scenes  = (refinedContent.scenes as any[]) ?? []
        const prompts = scenes.map((s) => s.visualDescription as string)
        const size    = getSizeForFormat(format)
        const buffers = await withTimeout(generateMultipleImages(prompts, size, geminiKey), 120_000)
        imageBase64   = buffers.map((b) => b ? Buffer.from(b).toString('base64') : null)
      } catch {
        imageBase64 = []
      }
    }

    db.prepare(`
      UPDATE projects SET
        status = 'rendering', render_progress = 0,
        content_data = ?, caption_text = ?, hashtags = ?,
        previous_content_data = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      JSON.stringify(refinedContent),
      (refinedContent.caption  as string   | null) ?? project.caption_text ?? null,
      (refinedContent.hashtags as string[] | null) ? JSON.stringify(refinedContent.hashtags) : (row.hashtags ?? null),
      JSON.stringify(previousSnapshot),
      projectId,
    )

    // Fire-and-forget → /api/render-video
    fetch(new URL('/api/render-video', request.nextUrl.origin).toString(), {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        projectId,
        content:      refinedContent,
        format,
        imageBuffers: imageBase64,
      }),
    }).catch(() => {
      db.prepare(`UPDATE projects SET status = 'error', updated_at = datetime('now') WHERE id = ?`).run(projectId)
    })

    return NextResponse.json({
      project:     { ...project, status: 'rendering', render_progress: 0, content_data: refinedContent },
      content:     refinedContent,
      summary,
      isBigChange: bigChange,
    }, { status: 202 })
  }

  return fail('Formato não suportado', 400)
}
