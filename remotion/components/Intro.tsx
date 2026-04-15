import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { fadeIn, fadeOut, slideUp, INTRO_FRAMES } from '../animations'
import type { VideoBrandKit } from '../types'

interface IntroProps {
  title: string
  brandKit: VideoBrandKit | null
}

export function Intro({ title, brandKit }: IntroProps) {
  const frame = useCurrentFrame()

  const primary   = brandKit?.primary_color   ?? '#6366f1'
  const secondary = brandKit?.secondary_color ?? '#a855f7'
  const fontTitle = brandKit?.font_title
    ? `'${brandKit.font_title}', Inter, sans-serif`
    : 'Inter, sans-serif'
  const logoUrl   = brandKit?.logo_url ?? null

  // Fade in do título + slide up
  const titleOpacity = fadeIn(frame, 0, 20)
  const titleSlide   = slideUp(frame, 0, 20, 40)

  // Logo aparece logo após o título
  const logoOpacity  = fadeIn(frame, 15, 15)

  // Fade-out geral nos últimos 10 frames
  const exitOpacity  = fadeOut(frame, INTRO_FRAMES, 10)

  return (
    <AbsoluteFill
      style={{
        background:     `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            0,
      }}
    >
      {/* Título centralizado com fadeIn */}
      <div
        style={{
          opacity:    Math.min(titleOpacity, exitOpacity),
          transform:  `translateY(${titleSlide}px)`,
          color:      'white',
          fontSize:   88,
          fontWeight: 800,
          fontFamily: fontTitle,
          textAlign:  'center',
          lineHeight: 1.1,
          padding:    '0 120px',
          textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {title}
      </div>

      {/* Logo abaixo do título, centralizado */}
      {logoUrl && (
        <div
          style={{
            opacity:   Math.min(logoOpacity, exitOpacity),
            marginTop: 48,
            display:   'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Img
            src={logoUrl}
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        </div>
      )}
    </AbsoluteFill>
  )
}
