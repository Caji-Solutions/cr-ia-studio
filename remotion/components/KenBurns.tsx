import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { kenBurnsScale } from '../animations'

interface KenBurnsProps {
  src: string
  durationInFrames: number
  /**
   * Índice da cena (0-based). Cenas ímpares fazem zoom-out, pares fazem zoom-in.
   * Cria variedade visual sem aleatoriedade não-determinística.
   */
  sceneIndex?: number
  /** Ponto de origem do transform. Alterna entre cantos para mais dinamismo. */
  origin?: string
}

const ORIGINS = [
  'center center',
  'top left',
  'bottom right',
  'top right',
  'bottom left',
]

export function KenBurns({
  src,
  durationInFrames,
  sceneIndex = 0,
  origin,
}: KenBurnsProps) {
  const frame   = useCurrentFrame()
  const zoomOut = sceneIndex % 2 === 1                        // alterna por cena
  const anchor  = origin ?? ORIGINS[sceneIndex % ORIGINS.length]
  const scale   = kenBurnsScale(frame, durationInFrames, zoomOut)

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <Img
        src={src}
        style={{
          width:            '100%',
          height:           '100%',
          objectFit:        'cover',
          transform:        `scale(${scale})`,
          transformOrigin:  anchor,
        }}
      />
    </AbsoluteFill>
  )
}
