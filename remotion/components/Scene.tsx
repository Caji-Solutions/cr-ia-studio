import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { KenBurns } from './KenBurns'
import { TextOverlay } from './TextOverlay'
import { parseDurationToFrames, fadeIn } from '../animations'
import type { SceneProps } from '../types'

export function Scene({ scene, imageUrl, brandKit, isVertical }: SceneProps) {
  const frame            = useCurrentFrame()
  const { fps }          = useVideoConfig()
  const durationInFrames = parseDurationToFrames(scene.duration, fps)

  const primary   = brandKit?.primary_color   ?? '#6366f1'
  const secondary = brandKit?.secondary_color ?? '#a855f7'
  const titleFont = brandKit?.font_title ?? null
  const bodyFont  = brandKit?.font_body  ?? null

  // vertical: 72px  |  horizontal: 48px  (conforme spec)
  const overlayFontSize = isVertical ? 72 : 48

  // Narration subtitle
  const narrationOpacity = fadeIn(frame, 0, 15)

  return (
    <AbsoluteFill>
      {/* ── Background: KenBurns image OR brand gradient ──────────────────── */}
      {imageUrl ? (
        <KenBurns
          src={imageUrl}
          durationInFrames={durationInFrames}
          sceneIndex={scene.sceneNumber - 1}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
          }}
        />
      )}

      {/* ── Dark scrim sobre imagem para legibilidade ──────────────────────── */}
      {imageUrl && (
        <AbsoluteFill style={{ background: 'rgba(0,0,0,0.40)' }} />
      )}

      {/* ── TextOverlay centralizado: fadeIn + slideUp + scaleIn em 15f ────── */}
      {scene.textOverlay && (
        <TextOverlay
          text={scene.textOverlay}
          fontName={titleFont}
          fontSize={overlayFontSize}
          delay={0}
          animDuration={15}
          align="center"
          badge={isVertical}
          maxWidthPercent={isVertical ? 70 : 85}
        />
      )}

      {/* ── Narration: legenda inferior, fundo preto 70%, texto branco ──────── */}
      {scene.narration && (
        <AbsoluteFill
          style={{
            display:        'flex',
            alignItems:     'flex-end',
            justifyContent: 'center',
            padding:        '0 80px 72px',
          }}
        >
          <div
            style={{
              opacity:         narrationOpacity,
              background:      'rgba(0,0,0,0.70)',
              color:           'white',
              fontSize:        isVertical ? 36 : 30,
              fontFamily:      bodyFont
                ? `'${bodyFont}', Inter, sans-serif`
                : 'Inter, sans-serif',
              fontWeight:      500,
              lineHeight:      1.5,
              textAlign:       'center',
              padding:         '14px 28px',
              borderRadius:    8,
              maxWidth:        '80%',
            }}
          >
            {scene.narration}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
