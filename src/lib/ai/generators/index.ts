import { ProjectFormat } from '@/types/database'
import { BrandKit } from '@/lib/api/brand-kits'
import { ComposeOptions } from '@/lib/ai/prompts/composer'
import { CarouselContent, PostContent, StoryContent, VideoContent } from '@/types/content'
import { generateCarousel } from './carousel'
import { generatePost } from './post'
import { generateStory, StoryOptions } from './story'
import { generateVideoH } from './video-horizontal'
import { generateVideoV } from './video-vertical'

export type GeneratedContent = CarouselContent | PostContent | StoryContent | VideoContent

type GeneratorFn = (
  command: string,
  brandKit: BrandKit | null,
  apiKey: string,
  options?: ComposeOptions
) => Promise<GeneratedContent>

const GENERATORS: Record<ProjectFormat, GeneratorFn> = {
  carousel: generateCarousel,
  post: generatePost,
  story: (command, brandKit, apiKey, options) =>
    generateStory(command, brandKit, apiKey, options as StoryOptions),
  video_16_9: generateVideoH,
  video_9_16: generateVideoV,
  caption: async (command, brandKit, apiKey, options) => {
    // Caption uses post generator and returns only the caption fields
    const result = await generatePost(command, brandKit, apiKey, options)
    return result
  },
}

export function selectGenerator(format: ProjectFormat): GeneratorFn {
  return GENERATORS[format]
}

export {
  generateCarousel,
  generatePost,
  generateStory,
  generateVideoH,
  generateVideoV,
}
export type { StoryOptions }
