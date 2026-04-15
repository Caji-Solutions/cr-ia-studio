import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto'
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins'
import { fadeIn, slideUp, scaleIn } from '../animations'

// ─── Font registry — adicione famílias conforme necessário ────────────────────

const FONT_REGISTRY: Record<string, { fontFamily: string }> = {
  Inter:   loadInter(),
  Roboto:  loadRoboto(),
  Poppins: loadPoppins(),
}

/** Resolve o fontFamily carregado ou devolve fallback seguro */
function resolveFont(name: string | null | undefined): string {
  if (!name) return FONT_REGISTRY.Inter.fontFamily
  return FONT_REGISTRY[name]?.fontFamily ?? `'${name}', ${FONT_REGISTRY.Inter.fontFamily}`
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TextOverlayProps {
  text: string
  fontName?: string | null     // nome da família Google Font (ex: 'Poppins')
  fontSize?: number
  color?: string
  delay?: number               // frame de início das animações
  animDuration?: number
  /** Alinhamento vertical. 'center' (default) | 'top' | 'bottom' */
  align?: 'center' | 'top' | 'bottom'
  /** Largura máxima como % da tela (0–100). Default: 85 */
  maxWidthPercent?: number
  /**
   * Estilo badge TikTok: fundo preto arredondado atrás do texto.
   * Substitui textShadow por background real.
   */
  badge?: boolean
}

export function TextOverlay({
  text,
  fontName,
  fontSize        = 64,
  color           = 'white',
  delay           = 0,
  animDuration    = 15,
  align           = 'center',
  maxWidthPercent = 85,
  badge           = false,
}: TextOverlayProps) {
  const frame      = useCurrentFrame()
  const fontFamily = resolveFont(fontName)

  // Três animações combinadas: fadeIn + slideUp + scaleIn
  const opacity    = fadeIn(frame, delay, animDuration)
  const translateY = slideUp(frame, delay, animDuration, 30)
  const scale      = scaleIn(frame, delay, animDuration, 0.8)

  const justifyContent =
    align === 'top' ? 'flex-start' : align === 'bottom' ? 'flex-end' : 'center'

  const paddingMap = {
    top:    '80px 80px 0',
    bottom: '0 80px 80px',
    center: '0 80px',
  }

  return (
    <AbsoluteFill
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent,
        padding:        paddingMap[align],
      }}
    >
      <div
        style={{
          opacity,
          transform:        `translateY(${translateY}px) scale(${scale})`,
          color,
          fontSize,
          fontWeight:        700,
          fontFamily,
          textAlign:        'center',
          lineHeight:        1.2,
          maxWidth:          `${maxWidthPercent}%`,
          // Badge TikTok: fundo real arredondado; senão: textShadow clássico
          ...(badge
            ? {
                background:   'rgba(0,0,0,0.72)',
                padding:      '12px 24px',
                borderRadius: 16,
                backdropFilter: 'blur(4px)',
              }
            : {
                textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
              }),
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  )
}
