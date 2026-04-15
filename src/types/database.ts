export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectFormat = 'carousel' | 'post' | 'story' | 'video_16_9' | 'video_9_16' | 'caption'
export type ProjectStatus = 'draft' | 'generating' | 'rendering' | 'ready' | 'error'
