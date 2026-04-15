# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

No test runner is configured yet.

## Architecture

**ContentAI Studio** is an internal AI-powered content creation tool built for Brazilian Portuguese users. It uses Next.js 14 App Router, Supabase for auth/database/storage, and the Anthropic SDK for AI content generation.

### Route Structure

- `/` — Dashboard (protected)
- `/login`, `/register` — Auth pages (grouped under `(auth)/` layout)
- `/brand-kit` — Brand Kit CRUD management
- `/create`, `/projects`, `/settings` — Referenced in nav but not yet implemented

### Authentication Flow

`src/middleware.ts` runs on every request (except static assets). It uses `@supabase/ssr` to read the session from cookies, redirects unauthenticated users to `/login`, and redirects authenticated users away from auth pages to `/`. Supabase has two client variants:

- `src/lib/supabase/client.ts` — Browser client (use in Client Components)
- `src/lib/supabase/server.ts` — Server client with cookie handling (use in Server Components/Route Handlers)

### Database Schema

Defined in `src/types/database.ts` and migrated via `supabase/migrations/001_initial_schema.sql`. All tables use Row Level Security — users can only access their own rows.

- `profiles` — extends Supabase auth users; stores `api_key_anthropic`, `api_key_openai`
- `brand_kits` — brand identity (colors, fonts, tone_of_voice, logo_url, is_default)
- `projects` — content projects with `format` (carousel/post/story/video_16_9/video_9_16/caption) and `status` (draft/generating/rendering/ready/error)

All brand kit API calls are in `src/lib/api/brand-kits.ts`.

### Component Structure

- `src/components/ui/` — shadcn/ui components (do not modify, add new ones via `npx shadcn-ui add <component>`)
- `src/components/layout/` — `sidebar.tsx` (collapsible, 64px→240px on hover) and `bottom-nav.tsx` (mobile)
- `src/components/dashboard/` — `hero-command.tsx` (animated prompt input)
- `src/components/brand-kit/` — brand kit card, dialog form, and live preview

### State Management

Zustand is used minimally — currently only `src/store/useSidebar.ts` for sidebar hover state. Prefer Zustand for UI state that spans multiple components; prefer local `useState` for component-internal state.

### Styling

TailwindCSS with CSS variables for theming (dark mode via `class` strategy). Colors use `hsl(var(--...))` tokens defined in `src/app/globals.css`. Use `cn()` from `src/lib/utils.ts` to merge class names.

### AI Integration

`@anthropic-ai/sdk` is installed but not yet wired to any feature. Per the schema, per-user API keys are stored in `profiles`. Content generation UI shell is in `hero-command.tsx`.

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (or use per-user key from profiles)

See `ContentAI Studio/.env.example` for the full list including optional integrations (OpenAI, DeepSeek, OpenRouter, Exa, Sentry, etc.).

## Language

All UI copy is in **Brazilian Portuguese**. Keep new user-facing strings in pt-BR.
