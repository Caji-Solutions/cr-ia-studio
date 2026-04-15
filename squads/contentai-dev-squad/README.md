# contentai-dev-squad

Squad de desenvolvimento especializado para o **ContentAI Studio** — ferramenta interna de criação de conteúdo com IA para usuários brasileiros.

## Agentes

| Agente | Persona | Especialidade | Ativar com |
|--------|---------|--------------|------------|
| `content-dev` | Luma ✨ | Gemini API, generators, prompts | `@contentai:content-dev` |
| `frontend-dev` | Finn 🎨 | Next.js, React, Tailwind, shadcn/ui | `@contentai:frontend-dev` |
| `video-dev` | Vera 🎬 | Remotion, renderização de vídeo | `@contentai:video-dev` |

## Quando usar cada agente

```
Problema de geração de conteúdo / Gemini API / parsing JSON?
→ @content-dev (Luma)

Problema de interface / componente React / layout?
→ @frontend-dev (Finn)

Problema de vídeo / Remotion / renderização?
→ @video-dev (Vera)
```

## Tasks disponíveis

| Task | Agente | Descrição |
|------|--------|-----------|
| `add-content-format` | Luma | Adicionar novo formato de geração (thread, newsletter...) |
| `update-ai-prompt` | Luma | Atualizar/corrigir prompt de um formato existente |
| `build-ui-component` | Finn | Criar novo componente React |
| `create-video-scene` | Vera | Criar nova composição Remotion |

## Stack do projeto

- **Next.js 14** App Router + TypeScript
- **Gemini 2.0 Flash** (texto) + Imagen 3 (imagens)
- **SQLite** via better-sqlite3
- **Remotion** para renderização de vídeo
- **Tailwind CSS** + shadcn/ui
- **UI em pt-BR**

## Estrutura

```
squads/contentai-dev-squad/
├── squad.yaml          # Manifest do squad
├── README.md           # Este arquivo
├── config/
│   ├── tech-stack.md   # Stack técnica detalhada
│   └── coding-standards.md  # Padrões de código
├── agents/
│   ├── content-dev.md  # Luma — IA & Gemini
│   ├── frontend-dev.md # Finn — UI & Next.js
│   └── video-dev.md    # Vera — Remotion & Vídeo
└── tasks/
    ├── add-content-format.md
    ├── update-ai-prompt.md
    ├── build-ui-component.md
    └── create-video-scene.md
```
