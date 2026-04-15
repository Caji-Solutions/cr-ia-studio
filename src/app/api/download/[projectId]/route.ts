/**
 * GET /api/download/[projectId]
 *
 * Faz download do projeto no formato adequado:
 *   carousel   → ZIP (01-slide.png … N-slide.png + legenda.txt)
 *   post       → PNG (direto)
 *   story      → PNG (1 frame) ou ZIP (múltiplos frames)
 *   video_16_9 → ZIP (video.mp4 + thumbnail.png + roteiro.txt + legenda.txt)
 *   video_9_16 → ZIP (video.mp4 + legenda.txt)
 *   caption    → TXT
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb, parseProject } from '@/lib/db'
import { readRenderFile } from '@/lib/storage/local'
import JSZip from 'jszip'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeName(title: string): string {
  return (title ?? 'projeto')
    .replace(/[^a-zA-Z0-9\-_\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'projeto'
}

async function fetchBuffer(url: string): Promise<Buffer> {
  // URLs locais /renders/... — lê do filesystem
  if (url.startsWith('/renders/') || url.startsWith('/logos/')) {
    return readRenderFile(url)
  }
  // URLs externas (fallback)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Falha ao baixar arquivo: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

function buildCaption(captionText: string | null, hashtags: string[] | null): string {
  const parts: string[] = []
  if (captionText) parts.push(captionText)
  if (hashtags?.length) {
    parts.push(hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '))
  }
  return parts.join('\n\n')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildRoteiro(contentData: Record<string, any> | null): string {
  const scenes = contentData?.scenes
  if (!Array.isArray(scenes) || !scenes.length) return ''
  return scenes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((scene: any, i: number) => {
      const lines = [`Cena ${i + 1} (${scene.duration ?? ''})`]
      if (scene.textOverlay)       lines.push(`Texto: ${scene.textOverlay}`)
      if (scene.narration)         lines.push(`Narração: ${scene.narration}`)
      if (scene.visualDescription) lines.push(`Visual: ${scene.visualDescription}`)
      if (scene.transition)        lines.push(`Transição: ${scene.transition}`)
      return lines.join('\n')
    })
    .join('\n\n')
}

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const db  = getDb()
  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(params.projectId)
  if (!row) return fail('Projeto não encontrado', 404)

  const project = parseProject(row as Parameters<typeof parseProject>[0])

  const {
    format,
    title,
    slides_urls,
    video_url,
    thumbnail_url,
    caption_text,
    hashtags,
    content_data,
  } = project

  const name       = safeName(title as string)
  const slideUrls  = (slides_urls  as string[] | null) ?? []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentObj = (content_data as Record<string, any> | null)

  try {
    // ── caption → TXT ──────────────────────────────────────────────────────────
    if (format === 'caption') {
      const text = buildCaption(caption_text as string | null, hashtags as string[] | null)
      return new NextResponse(text || '', {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${name}.txt"`,
        },
      })
    }

    // ── post → PNG direto ─────────────────────────────────────────────────────
    if (format === 'post') {
      if (!slideUrls[0]) return fail('Imagem não disponível', 404)
      const buf = await fetchBuffer(slideUrls[0])
      return new NextResponse(buf.buffer as ArrayBuffer, {
        headers: {
          'Content-Type':        'image/png',
          'Content-Disposition': `attachment; filename="${name}.png"`,
        },
      })
    }

    // ── story → PNG (1 frame) ou ZIP (múltiplos) ──────────────────────────────
    if (format === 'story') {
      if (!slideUrls.length) return fail('Frames não disponíveis', 404)

      if (slideUrls.length === 1) {
        const buf = await fetchBuffer(slideUrls[0])
        return new NextResponse(buf.buffer as ArrayBuffer, {
          headers: {
            'Content-Type':        'image/png',
            'Content-Disposition': `attachment; filename="${name}.png"`,
          },
        })
      }

      const zip = new JSZip()
      await Promise.all(
        slideUrls.map(async (url, i) => {
          const buf = await fetchBuffer(url)
          zip.file(`${String(i + 1).padStart(2, '0')}-frame.png`, buf)
        }),
      )
      if (caption_text) zip.file('legenda.txt', buildCaption(caption_text as string, hashtags as string[] | null))

      const zipBuf = await zip.generateAsync({ type: 'arraybuffer' }) as ArrayBuffer
      return new NextResponse(zipBuf, {
        headers: {
          'Content-Type':        'application/zip',
          'Content-Disposition': `attachment; filename="${name}.zip"`,
        },
      })
    }

    // ── carousel → ZIP ────────────────────────────────────────────────────────
    if (format === 'carousel') {
      if (!slideUrls.length) return fail('Slides não disponíveis', 404)

      const zip = new JSZip()
      await Promise.all(
        slideUrls.map(async (url, i) => {
          const buf = await fetchBuffer(url)
          zip.file(`${String(i + 1).padStart(2, '0')}-slide.png`, buf)
        }),
      )
      zip.file('legenda.txt', buildCaption(caption_text as string | null, hashtags as string[] | null))

      const zipBuf = await zip.generateAsync({ type: 'arraybuffer' }) as ArrayBuffer
      return new NextResponse(zipBuf, {
        headers: {
          'Content-Type':        'application/zip',
          'Content-Disposition': `attachment; filename="${name}.zip"`,
        },
      })
    }

    // ── video_16_9 → ZIP (video + thumbnail + roteiro + legenda) ─────────────
    if (format === 'video_16_9') {
      if (!video_url) return fail('Vídeo não disponível — renderização em andamento', 404)

      const zip = new JSZip()
      zip.file('video.mp4', await fetchBuffer(video_url as string))

      if (thumbnail_url) {
        zip.file('thumbnail.jpg', await fetchBuffer(thumbnail_url as string))
      }

      const roteiro = buildRoteiro(contentObj)
      if (roteiro) zip.file('roteiro.txt', roteiro)

      zip.file('legenda.txt', buildCaption(caption_text as string | null, hashtags as string[] | null))

      const zipBuf = await zip.generateAsync({ type: 'arraybuffer' }) as ArrayBuffer
      return new NextResponse(zipBuf, {
        headers: {
          'Content-Type':        'application/zip',
          'Content-Disposition': `attachment; filename="${name}.zip"`,
        },
      })
    }

    // ── video_9_16 → ZIP (video + legenda) ───────────────────────────────────
    if (format === 'video_9_16') {
      if (!video_url) return fail('Vídeo não disponível — renderização em andamento', 404)

      const zip = new JSZip()
      zip.file('video.mp4', await fetchBuffer(video_url as string))
      zip.file('legenda.txt', buildCaption(caption_text as string | null, hashtags as string[] | null))

      const zipBuf = await zip.generateAsync({ type: 'arraybuffer' }) as ArrayBuffer
      return new NextResponse(zipBuf, {
        headers: {
          'Content-Type':        'application/zip',
          'Content-Disposition': `attachment; filename="${name}.zip"`,
        },
      })
    }

    return fail('Formato não suportado', 400)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[download] Erro projeto ${params.projectId}:`, msg)
    return fail(`Falha no download: ${msg}`)
  }
}
