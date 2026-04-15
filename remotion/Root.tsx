import { Composition, registerRoot } from 'remotion'
import {
  VideoComposition,
  calculateMetadata as calcHorizontal,
} from './compositions/VideoComposition'
import {
  VerticalVideo,
  calculateMetadata as calcVertical,
} from './compositions/VerticalVideo'
import type { VideoCompositionProps } from './types'

// ─── Default props for Remotion Studio preview ────────────────────────────────

const DEFAULT_PROPS: VideoCompositionProps = {
  scenes: [
    {
      sceneNumber:        1,
      duration:           '6s',
      narration:          'Bem-vindo ao ContentAI Studio.',
      visualDescription:  'Background corporativo com gradiente.',
      textOverlay:        'ContentAI Studio',
      transition:         'fade',
    },
    {
      sceneNumber:        2,
      duration:           '6s',
      narration:          'Crie conteúdo incrível com IA.',
      visualDescription:  'Pessoa usando computador, criando conteúdo.',
      textOverlay:        'IA para seu negócio',
      transition:         'slide',
    },
  ],
  title:    'ContentAI Studio',
  brandKit: {
    name:            'Demo Brand',
    primary_color:   '#6366f1',
    secondary_color: '#a855f7',
    accent_color:    '#ec4899',
    font_title:      'Poppins',
    font_body:       'Inter',
    logo_url:        null,
  },
  music:      'energetic',
  imageUrls:  [null, null],
  isVertical: false,
}

const RemotionRoot: React.FC = () => (
  <>
    {/* Horizontal 16:9 — YouTube, LinkedIn, feeds */}
    <Composition
      id="VideoHorizontal"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={VideoComposition as any}
      calculateMetadata={calcHorizontal}
      defaultProps={{ ...DEFAULT_PROPS, isVertical: false }}
      fps={30}
      durationInFrames={300}
      width={1920}
      height={1080}
    />

    {/* Vertical 9:16 — Reels, TikTok, Shorts */}
    <Composition
      id="VideoVertical"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      component={VerticalVideo as any}
      calculateMetadata={calcVertical}
      defaultProps={{ ...DEFAULT_PROPS, isVertical: true }}
      fps={30}
      durationInFrames={300}
      width={1080}
      height={1920}
    />
  </>
)

registerRoot(RemotionRoot)
