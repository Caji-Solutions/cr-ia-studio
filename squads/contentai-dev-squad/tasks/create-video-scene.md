---
task: Create Video Scene
responsavel: "@video-dev"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - scene_name: Nome da cena/composição (PascalCase)
  - format: video_16_9 | video_9_16
  - content_type: Tipo de conteúdo que a cena renderiza
  - duration_frames: Duração em frames (fps=30, ex: 90 = 3s)
Saida: |
  - composition_file: Arquivo da composição em remotion/
  - registered: Composição registrada em remotion/index.tsx
  - renderer_update: Integração com src/lib/render/slide-renderer.ts
Checklist:
  - "[ ] Definir dimensões (1920x1080 ou 1080x1920)"
  - "[ ] Criar arquivo de composição em remotion/"
  - "[ ] Definir props TypeScript da composição"
  - "[ ] Implementar animações com useCurrentFrame() e interpolate()"
  - "[ ] Registrar composição em remotion/index.tsx"
  - "[ ] Integrar com slide-renderer.ts se necessário"
  - "[ ] Verificar que externals do webpack estão configurados (next.config.mjs)"
---

# *create-scene — Criar Composição Remotion

Cria uma nova composição/cena Remotion para renderização de vídeo no ContentAI Studio.

## Elicitação

```
? Nome da composição (PascalCase):
> VideoSceneTitle

? Formato:
  1. video_16_9 (1920×1080 — Landscape)
  2. video_9_16 (1080×1920 — Portrait/Reels)
> 2

? O que essa cena deve exibir?
> Título do vídeo com entrada animada e background com cor da brand

? Duração (frames a 30fps):
> 60 (= 2 segundos)
```

## Dimensões por Formato

| Formato | Width | Height | Uso |
|---------|-------|--------|-----|
| video_16_9 | 1920 | 1080 | YouTube, LinkedIn |
| video_9_16 | 1080 | 1920 | Reels, TikTok, Stories |

## Template de Composição

```tsx
// remotion/VideoSceneTitle.tsx
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion'

interface VideoSceneTitleProps {
  title: string
  primaryColor?: string
}

export const VideoSceneTitle: React.FC<VideoSceneTitleProps> = ({
  title,
  primaryColor = '#6366f1',
}) => {
  const frame = useCurrentFrame()

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  })

  const translateY = interpolate(frame, [0, 20], [30, 0], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: primaryColor }}>
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '80px',
        }}
      >
        <h1 style={{ color: 'white', fontSize: 80, textAlign: 'center' }}>
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  )
}
```

## Registrar Composição (`remotion/index.tsx`)

```tsx
import { Composition } from 'remotion'
import { VideoSceneTitle } from './VideoSceneTitle'

export const RemotionRoot = () => (
  <>
    <Composition
      id="VideoSceneTitle"
      component={VideoSceneTitle}
      durationInFrames={60}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ title: 'Meu Vídeo' }}
    />
    {/* outras composições */}
  </>
)
```

## APIs Remotion Principais

| API | Uso |
|-----|-----|
| `useCurrentFrame()` | Frame atual (0 → N) |
| `interpolate(frame, [in], [out])` | Animar valor entre frames |
| `spring({ frame, fps, config })` | Animação com física |
| `<AbsoluteFill>` | Container 100% da composição |
| `<Sequence from={N}>` | Atrasar início de elemento |
| `<Audio src={...}>` | Adicionar áudio |

## Aviso de Webpack

Os pacotes Remotion são **externos ao bundle** do Next.js (configurado em `next.config.mjs`). Nunca importar `@remotion/renderer` em Client Components — apenas em Route Handlers e Server Components.

## Relacionado

- **Agent:** @video-dev (Vera)
- **Render engine:** `src/lib/render/slide-renderer.ts`
- **Route handler:** `src/app/api/render-video/route.ts`
- **Config:** `remotion.config.ts`, `next.config.mjs`
