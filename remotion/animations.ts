import { interpolate, spring as remotionSpring } from 'remotion'

// ─── Core helpers — assinatura limpa: (frame, delay?, duration?) ───────────────

export function fadeIn(frame: number, delay = 0, duration = 15): number {
  return interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function fadeOut(frame: number, endFrame: number, duration = 15): number {
  return interpolate(frame, [endFrame - duration, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function slideUp(frame: number, delay = 0, duration = 15, distance = 30): number {
  return interpolate(frame, [delay, delay + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function slideLeft(frame: number, delay = 0, duration = 15, distance = 60): number {
  return interpolate(frame, [delay, delay + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

export function scaleIn(frame: number, delay = 0, duration = 15, from = 0.8): number {
  return interpolate(frame, [delay, delay + duration], [from, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

/** Wrapper sobre remotion spring com config sensível para UI */
export function springAnim(
  frame: number,
  fps: number,
  delay = 0,
  config?: { damping?: number; stiffness?: number; mass?: number },
): number {
  return remotionSpring({
    frame: Math.max(0, frame - delay),
    fps,
    config: {
      damping:   config?.damping   ?? 200,
      stiffness: config?.stiffness ?? 200,
      mass:      config?.mass      ?? 0.5,
    },
    from: 0,
    to: 1,
  })
}

// ─── Ken Burns ────────────────────────────────────────────────────────────────

/**
 * Retorna scale para Ken Burns.
 * @param zoomOut Se true: zoom de 1.15 → 1.0 (zoom-out). Default: false (zoom-in 1.0→1.15)
 */
export function kenBurnsScale(
  frame: number,
  durationInFrames: number,
  zoomOut = false,
): number {
  const [from, to] = zoomOut ? [1.15, 1.0] : [1.0, 1.15]
  return interpolate(frame, [0, durationInFrames], [from, to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function parseDurationToFrames(duration: string, fps = 30): number {
  const seconds = parseFloat(duration.replace('s', '').trim())
  return Math.max(fps, Math.round(seconds * fps))
}

export const FPS               = 30
export const INTRO_FRAMES      = 2 * FPS   // 60 frames
export const OUTRO_FRAMES      = 3 * FPS   // 90 frames
export const TRANSITION_FRAMES = 15

export function calculateTotalFrames(scenes: { duration: string }[]): number {
  const sceneFrames = scenes.reduce(
    (sum, s) => sum + parseDurationToFrames(s.duration, FPS),
    0,
  )
  return INTRO_FRAMES + sceneFrames + OUTRO_FRAMES
}
