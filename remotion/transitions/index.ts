import { linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { slide } from '@remotion/transitions/slide'
import { wipe } from '@remotion/transitions/wipe'
import type { TransitionType } from '../types'

/** Duração de transição: 15f (0.5s) horizontal | 10f (0.3s) vertical */
export function getTransitionFrames(isVertical: boolean): number {
  return isVertical ? 10 : 15
}

/** Timing para TransitionSeries.Transition */
export function getTransitionTiming(isVertical: boolean) {
  return linearTiming({ durationInFrames: getTransitionFrames(isVertical) })
}

/**
 * Mapping: 'fade' → fade() | 'slide' → slide({direction:'from-right'}) | 'wipe' → wipe()
 * Retorna `any` para contornar incompatibilidade de genéricos do @remotion/transitions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPresentation(type: TransitionType): any {
  switch (type) {
    case 'slide': return slide({ direction: 'from-right' })
    case 'wipe':  return wipe()
    case 'fade':
    default:      return fade()
  }
}
