// Standalone types for the Remotion bundle.
// Mirrors src/types/content.ts VideoContent but avoids @/ alias imports.

export type MusicTrack = 'energetic' | 'calm' | 'corporate' | 'fun' | 'inspiring' | 'minimal'
export type TransitionType = 'fade' | 'slide' | 'wipe'

export interface VideoScene {
  sceneNumber: number
  duration: string        // e.g. "8s", "3.5s"
  narration: string
  visualDescription: string
  textOverlay: string
  transition: TransitionType
}

export interface VideoBrandKit {
  name: string
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  font_title: string | null
  font_body: string | null
  logo_url: string | null
}

export interface VideoCompositionProps {
  scenes: VideoScene[]
  title: string
  brandKit: VideoBrandKit | null
  music: MusicTrack
  imageUrls: (string | null)[]
  isVertical: boolean
}

export interface SceneProps {
  scene: VideoScene
  imageUrl: string | null
  brandKit: VideoBrandKit | null
  isVertical: boolean
}
