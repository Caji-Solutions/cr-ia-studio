import { NextRequest, NextResponse } from 'next/server'
import { getDb, uuid, parseProject } from '@/lib/db'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { selectGenerator, type GeneratedContent } from '@/lib/ai/generators'
import { generateMultipleImages, getSizeForFormat } from '@/lib/ai/image-generator'
import { renderContent, uploadRendered } from '@/lib/render/slide-renderer'
import { GeminiError } from '@/lib/ai/claude-client'
import type { ProjectFormat } from '@/types/database'
import type { BrandKit } from '@/lib/api/brand-kits'
import type { CarouselContent, PostContent, StoryContent, VideoContent } from '@/types/content'

export const maxDuration = 300

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateBody {
  command:        string
  format:         ProjectFormat
  brandKitId?:    string
  generateImages: boolean
  options?: {
    language?:          string
    extraInstructions?: string
    slideCount?:        number        // carousel: exact slide count
    frameCount?:        1 | 2 | 3 | 4 | 5  // story: frame count
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATIC_FORMATS: ProjectFormat[] = ['carousel', 'post', 'story', 'caption']
const VIDEO_FORMATS:  ProjectFormat[] = ['video_16_9', 'video_9_16']

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
    ),
  ])
}

function extractImagePrompts(content: GeneratedContent, format: ProjectFormat): string[] {
  switch (format) {
    case 'carousel': return (content as CarouselContent).slides.map((s) => s.imagePrompt)
    case 'story':    return (content as StoryContent).frames.map((f) => f.imagePrompt)
    case 'video_16_9':
    case 'video_9_16': return (content as VideoContent).scenes.map((s) => s.visualDescription)
    case 'post':
    case 'caption':
    default: return [(content as PostContent).imagePrompt].filter(Boolean)
  }
}

function extractTitle(content: GeneratedContent, command: string): string {
  if ('title'    in content && typeof content.title    === 'string') return content.title
  if ('headline' in content && typeof content.headline === 'string') return (content as PostContent).headline.slice(0, 80)
  return command.slice(0, 80)
}

function extractCaption(content: GeneratedContent): string | null {
  if ('caption' in content && typeof content.caption === 'string') return content.caption
  return null
}

function extractHashtags(content: GeneratedContent): string[] | null {
  if ('hashtags' in content && Array.isArray(content.hashtags)) return content.hashtags as string[]
  return null
}

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: GenerateBody
  try { body = await request.json() } catch { return fail('Body JSON inválido', 400) }

  const { command, format, brandKitId, generateImages, options } = body
  if (!command?.trim()) return fail('command é obrigatório', 400)
  if (!format)          return fail('format é obrigatório', 400)

  // Rate limit por IP
  const ip = request.headers.get('x-forwarded-for') ?? 'local'
  const rl = checkRateLimit(`generate:${ip}`, 10, 60_000)
  if (!rl.ok) return rateLimitResponse(rl.resetAt)

  // API keys do .env.local
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return fail('GEMINI_API_KEY não configurada no .env.local', 400)

  // Brand kit
  const db = getDb()
  let brandKit: BrandKit | null = null
  if (brandKitId) {
    brandKit = db.prepare(`SELECT * FROM brand_kits WHERE id = ?`).get(brandKitId) as BrandKit ?? null
  }

  // Geração de texto
  let content: GeneratedContent
  try {
    const generator = selectGenerator(format)
    content = await generator(command, brandKit, geminiKey, options)
  } catch (e) {
    if (e instanceof GeminiError && e.code === 'RATE_LIMIT') {
      return fail(e.message, 429)
    }
    if (e instanceof GeminiError && e.code === 'INVALID_API_KEY') {
      return fail('GEMINI_API_KEY inválida. Verifique a chave no .env.local.', 401)
    }
    return fail(`Geração de texto falhou: ${e instanceof Error ? e.message : String(e)}`, 502)
  }

  // ─── Formatos estáticos ────────────────────────────────────────────────────

  if (STATIC_FORMATS.includes(format)) {
    const id = uuid()
    db.prepare(`
      INSERT INTO projects (id, brand_kit_id, title, format, status, command, content_data)
      VALUES (?, ?, ?, ?, 'generating', ?, ?)
    `).run(id, brandKitId ?? null, extractTitle(content, command), format, command, JSON.stringify(content))

    let imageBuffers: (ArrayBuffer | null)[] = []
    if (generateImages) {
      try {
        const prompts = extractImagePrompts(content, format)
        const size    = getSizeForFormat(format)
        imageBuffers  = await withTimeout(generateMultipleImages(prompts, size, geminiKey), 120_000)
      } catch { imageBuffers = [] }
    }

    let slideUrls: string[]
    try {
      const pngBuffers = await renderContent(content, brandKit, format, imageBuffers)
      slideUrls        = await uploadRendered(pngBuffers, id)
    } catch (e) {
      db.prepare(`UPDATE projects SET status = 'error' WHERE id = ?`).run(id)
      return fail(`Render falhou: ${e instanceof Error ? e.message : String(e)}`, 500)
    }

    const caption  = extractCaption(content)
    const hashtags = extractHashtags(content)
    db.prepare(`
      UPDATE projects SET status = 'ready', slides_urls = ?, thumbnail_url = ?, caption_text = ?, hashtags = ?, updated_at = datetime('now') WHERE id = ?
    `).run(JSON.stringify(slideUrls), slideUrls[0] ?? null, caption, hashtags ? JSON.stringify(hashtags) : null, id)

    const project = parseProject(db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Parameters<typeof parseProject>[0])
    return NextResponse.json({ project, content, slideUrls }, { status: 201 })
  }

  // ─── Formatos de vídeo ─────────────────────────────────────────────────────

  if (VIDEO_FORMATS.includes(format)) {
    let imageBuffers: (ArrayBuffer | null)[] = []
    if (generateImages) {
      try {
        const prompts = extractImagePrompts(content, format)
        const size    = getSizeForFormat(format)
        imageBuffers  = await withTimeout(generateMultipleImages(prompts, size, geminiKey), 120_000)
      } catch { imageBuffers = [] }
    }

    const id = uuid()
    db.prepare(`
      INSERT INTO projects (id, brand_kit_id, title, format, status, command, content_data)
      VALUES (?, ?, ?, ?, 'rendering', ?, ?)
    `).run(id, brandKitId ?? null, extractTitle(content, command), format, command, JSON.stringify(content))

    const renderPayload = {
      projectId: id,
      content,
      format,
      imageBuffers: imageBuffers.map((b) => b ? Buffer.from(b).toString('base64') : null),
    }

    withTimeout(
      fetch(new URL('/api/render-video', request.nextUrl.origin).toString(), {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(renderPayload),
      }),
      300_000
    ).catch(() => {
      db.prepare(`UPDATE projects SET status = 'error' WHERE id = ?`).run(id)
    })

    const project = parseProject(db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Parameters<typeof parseProject>[0])
    return NextResponse.json({ project, content }, { status: 202 })
  }

  return fail(`Formato não suportado: ${format}`, 400)
}
