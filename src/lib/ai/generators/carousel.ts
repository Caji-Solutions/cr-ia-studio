import { BrandKit } from '@/lib/api/brand-kits'
import { composePrompt, ComposeOptions } from '@/lib/ai/prompts/composer'
import { CarouselContentSchema, CarouselContent } from '@/types/content'
import { callAndValidate } from './_shared'

export async function generateCarousel(
  command: string,
  brandKit: BrandKit | null,
  apiKey: string,
  options?: ComposeOptions
): Promise<CarouselContent> {
  const { systemPrompt, userMessage } = composePrompt('carousel', brandKit, command, options)
  return callAndValidate(CarouselContentSchema, systemPrompt, userMessage, apiKey)
}
