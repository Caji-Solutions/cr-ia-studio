# ContentAI Studio

Plataforma interna de criação de conteúdo com IA para redes sociais. Gera carrosseis, posts, stories, legendas e vídeos MP4 a partir de um briefing em linguagem natural.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth & DB | Supabase (Auth, Postgres, Storage) |
| AI — texto | Anthropic Claude (claude-sonnet-4-6) |
| AI — imagens | OpenAI DALL-E 3 |
| **Vídeo** | **Remotion** (renderização server-side em MP4) |
| Render estático | Satori + Sharp (PNG via JSX) |
| UI | shadcn/ui + TailwindCSS + Framer Motion |
| Estado | Zustand (sidebar) + React state |

## Pré-requisitos

- **Node.js 18+**
- **Supabase** — projeto criado em supabase.com
- **Chromium** — obrigatório para renderização de vídeo com Remotion
  - Desenvolvimento: detectado automaticamente pelo `@remotion/renderer`
  - Produção: Railway/Fly.io com Dockerfile instalando Chromium, ou Remotion Lambda

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencha as variáveis (ver seção abaixo)

# 3. Aplicar migrations do banco
npx supabase db push

# 4. (Opcional) Pré-compilar bundle do Remotion para dev mais rápido
npm run bundle-remotion

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em [http://localhost:3000](http://localhost:3000)

## Variáveis de Ambiente

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic — geração de texto (obrigatório)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI — geração de imagens DALL-E 3 (opcional)
OPENAI_API_KEY=sk-...

# Opcionais — modelos alternativos de texto
OPENROUTER_API_KEY=
DEEPSEEK_API_KEY=
```

> Cada usuário pode configurar suas próprias chaves em `/settings > API Keys`. As chaves do `.env.local` servem como fallback.

## Como Usar

1. **Criar conta** em `/register` e fazer login
2. **Configurar API Key** em `/settings > API Keys` (Anthropic obrigatório)
3. **Criar Brand Kit** em `/brand-kit` com cores, fontes e tom de voz da marca
4. **Gerar conteúdo** em `/create`:
   - Escolha o formato (carrossel, post, story, vídeo 16:9, vídeo 9:16 ou legenda)
   - Escreva o briefing em linguagem natural
   - Selecione o Brand Kit
   - Clique em **Criar com IA**
5. **Refinar** o resultado com instruções adicionais via chat
6. **Download** dos slides (ZIP) ou vídeo (MP4)
7. **Gerenciar** todos os projetos em `/projects`

## Formatos Suportados

| Formato | Dimensões | Saída |
|---------|-----------|-------|
| Carrossel | 1080×1350 | ZIP de PNGs |
| Post | 1080×1080 | PNG |
| Story | 1080×1920 | PNG |
| Vídeo 16:9 | 1920×1080 | MP4 |
| Vídeo 9:16 | 1080×1920 | MP4 |
| Legenda | — | Texto + hashtags |

## Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/          # Login e registro
│   ├── api/             # Route Handlers
│   │   ├── generate/    # POST — gera conteúdo (texto + imagens + render)
│   │   ├── refine/      # POST — refina projeto existente
│   │   ├── render-video/# POST — renderiza MP4 com Remotion (async)
│   │   ├── download/    # GET — download ZIP ou vídeo
│   │   ├── projects/    # GET/PUT/DELETE + duplicate
│   │   └── settings/    # POST test-key
│   ├── brand-kit/       # CRUD de Brand Kits
│   ├── create/          # Editor de conteúdo
│   ├── projects/        # Lista de projetos
│   ├── settings/        # Perfil, API Keys, Preferências
│   └── page.tsx         # Dashboard
├── components/
│   ├── ui/              # shadcn/ui (não modificar diretamente)
│   ├── layout/          # Sidebar + BottomNav
│   ├── dashboard/       # HeroCommand
│   ├── brand-kit/       # Cards e formulários
│   ├── motion/          # Animações Framer Motion
│   └── providers/       # ThemeProvider, NProgressBar
├── lib/
│   ├── ai/              # Claude client, DALL-E, generators por formato
│   ├── api/             # brand-kits.ts (client-side)
│   ├── render/          # Satori renderer
│   ├── supabase/        # client.ts, server.ts, admin.ts
│   └── rate-limit.ts    # Rate limiter in-memory
├── hooks/               # useAuth
├── store/               # Zustand (sidebar)
└── types/               # database.ts, content.ts

remotion/                # Composições de vídeo (HorizontalVideo, VerticalVideo)
supabase/migrations/     # Schema SQL
```

## Segurança

- API keys dos usuários armazenadas apenas no banco (nunca no frontend)
- Rate limit: 10 req/min por usuário nas rotas de geração e refinamento
- Security headers: X-Frame-Options, X-Content-Type-Options, HSTS
- RLS (Row Level Security) habilitado em todas as tabelas
- Inputs sanitizados antes de enviar ao Claude

## Roadmap

- [ ] Múltiplos idiomas (en-US, es-ES)
- [ ] Templates pré-definidos por nicho
- [ ] Agendamento de publicação (Instagram, LinkedIn)
- [ ] Remotion Lambda para render serverless escalável
- [ ] Histórico de versões por projeto
- [ ] Colaboração em equipe (workspaces)
- [ ] Analytics de performance dos conteúdos
