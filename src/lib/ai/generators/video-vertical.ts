import { BrandKit } from '@/lib/api/brand-kits'
import { composePrompt, ComposeOptions } from '@/lib/ai/prompts/composer'
import { VideoContentSchema, VideoContent } from '@/types/content'
import { callAndValidate } from './_shared'

export async function generateVideoV(
  command: string,
  brandKit: BrandKit | null,
  apiKey: string,
  options?: ComposeOptions
): Promise<VideoContent> {
  const { systemPrompt, userMessage } = composePrompt('video_9_16', brandKit, command, options)
  const content = await callAndValidate(VideoContentSchema, systemPrompt, userMessage, apiKey)
  return { ...content, vertical: true }
}
