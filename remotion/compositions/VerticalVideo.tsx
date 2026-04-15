/**
 * VerticalVideo — composição 1080×1920 otimizada para Reels / TikTok / Shorts.
 *
 * Diferenças em relação ao VideoComposition horizontal:
 *  - Dimensões fixas 1080×1920 (sem cálculo dinâmico)
 *  - Intro mais curto: 1.5s (45 frames)
 *  - Transições: 10 frames (~0.33s)
 *  - TextOverlay badge TikTok + maxWidth 70%
 *  - Narração suprimida quando textOverlay já preenche o hook
 */

import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion'
import { TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { Scene } from '../components/Scene'
import { Outro } from '../components/Outro'
import { BackgroundAudio } from '../audio/BackgroundAudio'
import { parseDurationToFrames, fadeIn, fadeOut, slideUp, OUTRO_FRAMES, FPS } from '../animations'
import { getPresentation, getTransitionTiming } from '../transitions'
import type { VideoCompositionProps } from '../types'

// ─── Vertical-specific constants ──────────────────────────────────────────────

const VERTICAL_INTRO_FRAMES = Math.round(1.5 * FPS) // 45 frames — 1.5s
const VERTICAL_TRANS_FRAMES = 10                     // 0.33s

function calculateVerticalTotalFrames(scenes: { duration: string }[]): number {
  const sceneFrames = scenes.reduce(
    (sum, s) => sum + parseDurationToFrames(s.duration, FPS),
    0,
  )
  return VERTICAL_INTRO_FRAMES + sceneFrames + OUTRO_FRAMES
}

// ─── Intro vertical compacto (1.5s) ───────────────────────────────────────────

interface VerticalIntroProps {
  title:    string
  primary:  string
  secondary: string
  fontTitle: string
  logoUrl:  string | null
}

function VerticalIntro({ title, primary, secondary, fontTitle, logoUrl }: VerticalIntroProps) {
  const frame = useCurrentFrame()

  const opacity    = fadeIn(frame, 0, 20)
  const translateY = slideUp(frame, 0, 20, 50)
  const exitOpacity = fadeOut(frame, VERTICAL_INTRO_FRAMES, 10)
  const logoOpacity = fadeIn(frame, 12, 15)

  return (
    <AbsoluteFill
      style={{
        background:     `linear-gradient(160deg, ${primary} 0%, ${secondary} 100%)`,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      {/* Título */}
      <div
        style={{
          opacity:    Math.min(opacity, exitOpacity),
          transform:  `translateY(${translateY}px)`,
          color:      'white',
          fontSize:   96,
          fontWeight: 900,
          fontFamily: fontTitle,
          textAlign:  'center',
          lineHeight: 1.1,
          padding:    '0 80px',
          textShadow: '2px 4px 12px rgba(0,0,0,0.35)',
        }}
      >
        {title}
      </div>

      {/* Logo abaixo */}
      {logoUrl && (
        <div style={{ opacity: Math.min(logoOpacity, exitOpacity), marginTop: 48 }}>
          <Img
            src={logoUrl}
            style={{ width: 90, height: 90, objectFit: 'contain' }}
          />
        </div>
      )}
    </AbsoluteFill>
  )
}

// ─── calculateMetadata ────────────────────────────────────────────────────────

export const calculateMetadata = ({
  props,
}: {
  props: VideoCompositionProps
}) => ({
  fps:             FPS,
  durationInFrames: calculateVerticalTotalFrames(props.scenes),
  width:  1080,
  height: 1920,
})

// ─── Composition ──────────────────────────────────────────────────────────────

export function VerticalVideo({
  scenes,
  title,
  brandKit,
  music,
  imageUrls,
}: VideoCompositionProps) {
  const { fps } = useVideoConfig()

  const primary    = brandKit?.primary_color   ?? '#6366f1'
  const secondary  = brandKit?.secondary_color ?? '#a855f7'
  const fontTitle  = brandKit?.font_title
    ? `'${brandKit.font_title}', Inter, sans-serif`
    : 'Inter, sans-serif'
  const logoUrl    = brandKit?.logo_url ?? null
  const totalFrames = calculateVerticalTotalFrames(scenes)

  // isVertical=true força badge TikTok + 70% maxWidth em Scene
  const isVertical = true

  type SeriesChild = React.ReactElement
  const children: SeriesChild[] = []

  // ── Intro 1.5s ──────────────────────────────────────────────────────────────
  children.push(
    <TransitionSeries.Sequence key="intro" durationInFrames={VERTICAL_INTRO_FRAMES}>
      <VerticalIntro
        title={title}
        primary={primary}
        secondary={secondary}
        fontTitle={fontTitle}
        logoUrl={logoUrl}
      />
    </TransitionSeries.Sequence>
  )
  children.push(
    <TransitionSeries.Transition
      key="t-intro"
      presentation={fade()}
      timing={getTransitionTiming(true)}
    />
  )

  // ── Cenas ────────────────────────────────────────────────────────────────────
  scenes.forEach((scene, i) => {
    const durationInFrames = parseDurationToFrames(scene.duration, fps)
    const imageUrl         = imageUrls[i] ?? null

    children.push(
      <TransitionSeries.Sequence key={`scene-${i}`} durationInFrames={durationInFrames}>
        <Scene
          scene={scene}
          imageUrl={imageUrl}
          brandKit={brandKit}
          isVertical={isVertical}
        />
      </TransitionSeries.Sequence>
    )

    if (i < scenes.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${i}`}
          presentation={getPresentation(scene.transition)}
          timing={getTransitionTiming(true)}
        />
      )
    }
  })

  // ── Outro 3s ─────────────────────────────────────────────────────────────────
  children.push(
    <TransitionSeries.Transition
      key="t-outro"
      presentation={fade()}
      timing={getTransitionTiming(true)}
    />
  )
  children.push(
    <TransitionSeries.Sequence key="outro" durationInFrames={OUTRO_FRAMES}>
      <Outro title={title} brandKit={brandKit} />
    </TransitionSeries.Sequence>
  )

  return (
    <AbsoluteFill>
      <TransitionSeries>{children}</TransitionSeries>
      <BackgroundAudio track={music} totalFrames={totalFrames} />
    </AbsoluteFill>
  )
}
