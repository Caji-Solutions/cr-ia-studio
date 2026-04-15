import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { fadeIn, fadeOut } from '../animations'

interface SubtitlesProps {
  text: string
  durationInFrames: number
  fontFamily?: string
  fontSize?: number
}

export function Subtitles({
  text,
  durationInFrames,
  fontFamily = 'Inter, sans-serif',
  fontSize   = 34,
}: SubtitlesProps) {
  const frame = useCurrentFrame()

  const opacity = Math.min(
    fadeIn(frame, 0, 10),
    fadeOut(frame, durationInFrames, 10)
  )

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 80px 72px',
      }}
    >
      <div
        style={{
          opacity,
          background: 'rgba(0,0,0,0.65)',
          color: 'white',
          fontSize,
          fontFamily,
          fontWeight: 500,
          lineHeight: 1.5,
          textAlign: 'center',
          padding: '14px 32px',
          borderRadius: 10,
          maxWidth: '80%',
          backdropFilter: 'blur(4px)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  )
}
