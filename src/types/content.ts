import { z } from 'zod'

// ─── Shared ───────────────────────────────────────────────────────────────────

const SlideLayout = z.enum(['bold-center', 'text-left', 'text-overlay', 'split', 'minimal'])

// ─── Carousel ─────────────────────────────────────────────────────────────────

export const CarouselSlideSchema = z.object({
  slideNumber: z.number(),
  headline: z.string(),
  body: z.string(),
  imagePrompt: z.string(),
  layout: SlideLayout,
})

export const CarouselContentSchema = z.object({
  title: z.string(),
  slides: z.array(CarouselSlideSchema).min(1),
  caption: z.string(),
  hashtags: z.array(z.string()),
})

export type CarouselContent = z.infer<typeof CarouselContentSchema>

// ─── Post ─────────────────────────────────────────────────────────────────────

export const PostContentSchema = z.object({
  headline: z.string(),
  body: z.string(),
  imagePrompt: z.string(),
  layout: SlideLayout,
  caption: z.string(),
  hashtags: z.array(z.string()),
  altText: z.string(),
})

export type PostContent = z.infer<typeof PostContentSchema>

// ─── Story ────────────────────────────────────────────────────────────────────

export const StoryFrameSchema = z.object({
  frameNumber: z.number(),
  headline: z.string(),
  body: z.string(),
  imagePrompt: z.string(),
  layout: SlideLayout,
})

export const StoryContentSchema = z.object({
  frames: z.array(StoryFrameSchema).min(1).max(5),
  caption: z.string(),
})

export type StoryContent = z.infer<typeof StoryContentSchema>

// ─── Video ────────────────────────────────────────────────────────────────────

const VideoScene = z.object({
  sceneNumber: z.number(),
  duration: z.string(),
  narration: z.string(),
  visualDescription: z.string(),
  textOverlay: z.string(),
  transition: z.enum(['fade', 'slide', 'wipe']),
})

export const VideoContentSchema = z.object({
  title: z.string(),
  scenes: z.array(VideoScene).min(1),
  totalDuration: z.string(),
  music: z.enum(['energetic', 'calm', 'corporate', 'fun']),
  thumbnail: z.object({
    imagePrompt: z.string(),
    title: z.string(),
  }),
  caption: z.string(),
  hashtags: z.array(z.string()),
  vertical: z.boolean().optional(),
})

export type VideoContent = z.infer<typeof VideoContentSchema>
