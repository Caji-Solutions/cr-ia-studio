# Tech Stack — ContentAI Studio

## Framework
- **Next.js 14** — App Router, Server Components, Route Handlers
- **TypeScript** — strict mode
- **Tailwind CSS** — CSS variables com tema escuro (`class` strategy)
- **shadcn/ui** — componentes em `src/components/ui/` (não modificar diretamente)

## IA & Geração de Conteúdo
- **@google/generative-ai** — SDK Gemini, modelo `gemini-2.0-flash`
- **Gemini API** — texto (Flash) + imagens (Imagen 3)
- **Prompts** — `src/lib/ai/prompts/` (system prompt + user message separados)
- **Generators** — `src/lib/ai/generators/` (um arquivo por formato)

## Banco de Dados
- **SQLite** via `better-sqlite3` — sincrono, sem ORM
- **Schema** — `src/lib/db/index.ts` (migrations manuais)
- **Tipos** — `src/types/database.ts`

## Renderização de Vídeo
- **Remotion** — `remotion/` para composições, `src/lib/render/` para engine
- **Slide Renderer** — `src/lib/render/slide-renderer.ts`
- **Armazenamento** — `public/renders/` (desenvolvimento local)

## Estado & UI
- **Zustand** — apenas para estado global de UI (`src/store/`)
- **React useState** — para estado local de componentes
- **Sonner** — toasts e notificações

## Utilitários
- `cn()` de `src/lib/utils.ts` para merge de classes
- `src/lib/rate-limit.ts` — rate limiting em memória
- `src/lib/api/` — wrappers de API para o cliente

## Idioma
- Toda a UI em **pt-BR** (Português Brasileiro)
- Mensagens de erro e validação em português
- Comentários de código podem ser em inglês
