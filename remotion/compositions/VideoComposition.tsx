import { AbsoluteFill, useVideoConfig } from 'remotion'
import { TransitionSeries } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { Intro } from '../components/Intro'
import { Outro } from '../components/Outro'
import { Scene } from '../components/Scene'
import { BackgroundAudio } from '../audio/BackgroundAudio'
import {
  parseDurationToFrames,
  calculateTotalFrames,
  INTRO_FRAMES,
  OUTRO_FRAMES,
  FPS,
} from '../animations'
import {
  getPresentation,
  getTransitionFrames,
  getTransitionTiming,
} from '../transitions'
import type { VideoCompositionProps } from '../types'

// ─── calculateMetadata (dynamic duration + dimensions) ───────────────────────

export const calculateMetadata = ({
  props,
}: {
  props: VideoCompositionProps
}) => {
  const durationInFrames = calculateTotalFrames(props.scenes)
  return {
    fps:             FPS,
    durationInFrames,
    width:  props.isVertical ? 1080 : 1920,
    height: props.isVertical ? 1920 : 1080,
  }
}

// ─── Composition ──────────────────────────────────────────────────────────────

export function VideoComposition({
  scenes,
  title,
  brandKit,
  music,
  imageUrls,
  isVertical,
}: VideoCompositionProps) {
  const { fps } = useVideoConfig()
  const totalFrames    = calculateTotalFrames(scenes)
  const transFrames    = getTransitionFrames(isVertical)

  // Build the alternating Sequence / Transition children array
  type SeriesChild = React.ReactElement
  const children: SeriesChild[] = []

  // ── Intro (2s) ──────────────────────────────────────────────────────────────
  children.push(
    <TransitionSeries.Sequence key="intro" durationInFrames={INTRO_FRAMES}>
      <Intro title={title} brandKit={brandKit} />
    </TransitionSeries.Sequence>
  )
  children.push(
    <TransitionSeries.Transition
      key="t-intro"
      presentation={fade()}
      timing={getTransitionTiming(isVertical)}
    />
  )

  // ── Scenes with transitions between them ────────────────────────────────────
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
          timing={getTransitionTiming(isVertical)}
        />
      )
    }
  })

  // ── Outro (3s) ──────────────────────────────────────────────────────────────
  children.push(
    <TransitionSeries.Transition
      key="t-outro"
      presentation={fade()}
      timing={getTransitionTiming(isVertical)}
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
