import { ProjectFormat } from '@/types/database'
import { BrandKit } from '@/lib/api/brand-kits'
import { BASE_PROMPT } from './base'
import { CAROUSEL_PROMPT } from './carousel'
import { POST_PROMPT } from './post'
import { STORY_PROMPT } from './story'
import { VIDEO_PROMPT } from './video'
import { VIDEO_VERTICAL_PROMPT } from './video-vertical'

const FORMAT_PROMPTS: Record<ProjectFormat, string> = {
  carousel: CAROUSEL_PROMPT,
  post: POST_PROMPT,
  story: STORY_PROMPT,
  video_16_9: VIDEO_PROMPT,
  video_9_16: VIDEO_VERTICAL_PROMPT,
  caption: 'Legenda para post. Hook + corpo + CTA + hashtags. Schema: {"caption":string,"hashtags":string[]}',
}

function buildBrandContext(brandKit: BrandKit | null): string {
  if (!brandKit) return ''

  const parts: string[] = [`Marca: ${brandKit.name}.`]

  if (brandKit.tone_of_voice) parts.push(`Tom de voz: ${brandKit.tone_of_voice}.`)
  if (brandKit.primary_color) parts.push(`Cor primária: ${brandKit.primary_color}.`)
  if (brandKit.secondary_color) parts.push(`Cor secundária: ${brandKit.secondary_color}.`)
  if (brandKit.accent_color) parts.push(`Cor de destaque: ${brandKit.accent_color}.`)
  if (brandKit.font_title) parts.push(`Fonte título: ${brandKit.font_title}.`)
  if (brandKit.font_body) parts.push(`Fonte corpo: ${brandKit.font_body}.`)

  return parts.join(' ')
}

export interface ComposeOptions {
  language?:          string
  extraInstructions?: string
  slideCount?:        number   // carrossel: número exato de slides (3–10)
  frameCount?:        1 | 2 | 3 | 4 | 5  // story: número de frames
}

export function composePrompt(
  format: ProjectFormat,
  brandKit: BrandKit | null,
  command: string,
  options?: ComposeOptions
): { systemPrompt: string; userMessage: string } {
  const formatPrompt = FORMAT_PROMPTS[format]
  const brandContext = buildBrandContext(brandKit)

  const systemParts = [BASE_PROMPT, formatPrompt]
  if (brandContext) systemParts.push(brandContext)

  // Injetar contagem exata de slides/frames no prompt
  if (format === 'carousel' && options?.slideCount && options.slideCount >= 3) {
    systemParts.push(
      `REGRA OBRIGATÓRIA DE QUANTIDADE: Gere EXATAMENTE ${options.slideCount} slides no array "slides". Nem mais, nem menos. O array deve ter exatamente ${options.slideCount} itens.`
    )
  }
  if (format === 'story' && options?.frameCount) {
    systemParts.push(
      `REGRA OBRIGATÓRIA DE QUANTIDADE: Gere EXATAMENTE ${options.frameCount} frames no array "frames". O array deve ter exatamente ${options.frameCount} itens.`
    )
  }

  if (options?.extraInstructions) systemParts.push(options.extraInstructions)

  const systemPrompt = systemParts.join(' ')
  const userMessage = command.trim()

  return { systemPrompt, userMessage }
}
