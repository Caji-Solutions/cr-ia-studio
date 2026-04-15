import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { fadeIn, slideUp } from '../animations'
import type { VideoBrandKit } from '../types'

interface OutroProps {
  title: string
  brandKit: VideoBrandKit | null
  /** CTA customizado do roteiro. Default: 'Gostou? Siga para mais!' */
  cta?: string
}

export function Outro({ title, brandKit, cta }: OutroProps) {
  const frame = useCurrentFrame()

  const primary   = brandKit?.primary_color   ?? '#6366f1'
  const secondary = brandKit?.secondary_color ?? '#a855f7'
  const accent    = brandKit?.accent_color    ?? '#f59e0b'
  const fontTitle = brandKit?.font_title
    ? `'${brandKit.font_title}', Inter, sans-serif`
    : 'Inter, sans-serif'
  const fontBody  = brandKit?.font_body
    ? `'${brandKit.font_body}', Inter, sans-serif`
    : 'Inter, sans-serif'
  const logoUrl   = brandKit?.logo_url ?? null

  const ctaText   = cta ?? 'Gostou? Siga para mais!'

  // Animações escalonadas
  const bgOpacity   = fadeIn(frame, 0, 15)
  const ctaOpacity  = fadeIn(frame, 10, 20)
  const ctaSlide    = slideUp(frame, 10, 20, 40)
  const subOpacity  = fadeIn(frame, 22, 15)
  const logoOpacity = fadeIn(frame, 32, 15)

  return (
    <AbsoluteFill
      style={{
        background:     `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        opacity:        bgOpacity,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      {/* CTA principal */}
      <div
        style={{
          opacity:    ctaOpacity,
          transform:  `translateY(${ctaSlide}px)`,
          color:      'white',
          fontSize:   68,
          fontWeight: 800,
          fontFamily: fontTitle,
          textAlign:  'center',
          lineHeight: 1.15,
          padding:    '0 100px',
          textShadow: '2px 2px 8px rgba(0,0,0,0.25)',
        }}
      >
        {ctaText}
      </div>

      {/* Sub-texto */}
      <div
        style={{
          opacity:    subOpacity,
          color:      'rgba(255,255,255,0.85)',
          fontSize:   34,
          fontFamily: fontBody,
          fontWeight: 400,
          marginTop:  20,
          textAlign:  'center',
        }}
      >
        {title}
      </div>

      {/* Logo centralizado abaixo */}
      {logoUrl && (
        <div
          style={{
            opacity:        logoOpacity,
            marginTop:      48,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
          }}
        >
          <Img
            src={logoUrl}
            style={{ width: 100, height: 100, objectFit: 'contain' }}
          />
        </div>
      )}

      {/* Pill accent — rodapé discreto */}
      <div
        style={{
          opacity:      fadeIn(frame, 38, 12),
          position:     'absolute',
          bottom:       60,
          background:   accent,
          color:        'white',
          fontSize:     26,
          fontFamily:   fontBody,
          fontWeight:   700,
          borderRadius: 50,
          padding:      '14px 44px',
        }}
      >
        Acesse agora
      </div>
    </AbsoluteFill>
  )
}
