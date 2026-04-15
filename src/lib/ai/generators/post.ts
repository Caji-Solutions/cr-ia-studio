import { BrandKit } from '@/lib/api/brand-kits'
import { composePrompt, ComposeOptions } from '@/lib/ai/prompts/composer'
import { PostContentSchema, PostContent } from '@/types/content'
import { callAndValidate } from './_shared'

export async function generatePost(
  command: string,
  brandKit: BrandKit | null,
  apiKey: string,
  options?: ComposeOptions
): Promise<PostContent> {
  const { systemPrompt, userMessage } = composePrompt('post', brandKit, command, options)
  return callAndValidate(PostContentSchema, systemPrompt, userMessage, apiKey)
}
