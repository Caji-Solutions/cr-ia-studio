import { Audio, useCurrentFrame, useVideoConfig } from 'remotion'
import { interpolate } from 'remotion'
import { TRACK_CONFIG } from './tracks'
import type { MusicTrack } from '../types'

const FADE_OUT_FRAMES = 60  // últimos 2s

interface BackgroundAudioProps {
  track: MusicTrack
  /** Total de frames da composição — necessário para calcular fade-out */
  totalFrames: number
}

export function BackgroundAudio({ track, totalFrames }: BackgroundAudioProps) {
  const frame  = useCurrentFrame()
  const config = TRACK_CONFIG[track]

  if (!config) return null

  // Fade-out nos últimos 60 frames
  const fadeOutStart = Math.max(0, totalFrames - FADE_OUT_FRAMES)
  const volume = interpolate(
    frame,
    [0, 1, fadeOutStart, totalFrames],
    [0, config.volume, config.volume, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <Audio
      src={config.url}
      volume={volume}
      loop
    />
  )
}
