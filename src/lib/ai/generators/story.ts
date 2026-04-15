import { BrandKit } from '@/lib/api/brand-kits'
import { composePrompt, ComposeOptions } from '@/lib/ai/prompts/composer'
import { StoryContentSchema, StoryContent } from '@/types/content'
import { callAndValidate } from './_shared'

export interface StoryOptions extends ComposeOptions {
  frameCount?: 1 | 2 | 3 | 4 | 5
}

export async function generateStory(
  command: string,
  brandKit: BrandKit | null,
  apiKey: string,
  options?: StoryOptions
): Promise<StoryContent> {
  const { frameCount, ...composeOpts } = options ?? {}

  const extraInstruction = frameCount
    ? `Gere exatamente ${frameCount} frame(s).`
    : undefined

  const merged: ComposeOptions = {
    ...composeOpts,
    extraInstructions: [composeOpts.extraInstructions, extraInstruction]
      .filter(Boolean)
      .join(' ') || undefined,
  }

  const { systemPrompt, userMessage } = composePrompt('story', brandKit, command, merged)
  return callAndValidate(StoryContentSchema, systemPrompt, userMessage, apiKey)
}
