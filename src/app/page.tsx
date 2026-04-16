import type { Metadata } from 'next'
import { HeroCommand } from '@/components/dashboard/hero-command'
import {
  Layers, LayoutTemplate, Smartphone, Video, PlaySquare, FileText,
  Sparkles, ArrowRight, Zap,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ProjectFormat } from '@/types/database'

export const metadata: Metadata = { title: 'ContentAI Studio — Crie conteúdo com IA' }

// ─── Format config ─────────────────────────────────────────────────────────────

type FormatEntry = {
  label:    string
  dims:     string
  desc:     string
  icon:     React.ElementType
  gradient: string
  iconBg:   string
}

const FORMAT_CONFIG: Record<ProjectFormat, FormatEntry> = {
  carousel:   { label: 'Carrossel',  dims: '1080×1350', desc: 'Sequência de slides',  icon: Layers,        gradient: 'from-violet-500 to-purple-600', iconBg: 'from-violet-500 to-purple-600'  },
  post:       { label: 'Post',       dims: '1080×1080', desc: 'Quadrado para feed',   icon: LayoutTemplate, gradient: 'from-purple-500 to-indigo-600', iconBg: 'from-purple-500 to-indigo-600' },
  story:      { label: 'Story',      dims: '1080×1920', desc: 'Vertical imersivo',    icon: Smartphone,    gradient: 'from-pink-500 to-rose-500',     iconBg: 'from-pink-500 to-rose-500'      },
  video_16_9: { label: 'Vídeo 16:9', dims: '1920×1080', desc: 'Horizontal YouTube',  icon: Video,         gradient: 'from-blue-500 to-cyan-500',     iconBg: 'from-blue-500 to-cyan-500'      },
  video_9_16: { label: 'Vídeo 9:16', dims: '1080×1920', desc: 'Reels e TikTok',      icon: PlaySquare,    gradient: 'from-teal-500 to-emerald-500',  iconBg: 'from-teal-500 to-emerald-500'   },
  caption:    { label: 'Legenda',    dims: 'Texto',     desc: 'Copy para posts',      icon: FileText,      gradient: 'from-amber-400 to-orange-500',  iconBg: 'from-amber-400 to-orange-500'   },
}

const ALL_FORMATS = Object.keys(FORMAT_CONFIG) as ProjectFormat[]

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative flex flex-col min-h-screen w-full overflow-x-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 lg:px-10 h-16 border-b border-border/40 backdrop-blur-sm bg-background/60">
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(258 55% 56%), hsl(27 90% 57%))',
              boxShadow: '0 3px 10px hsl(258 55% 56% / 0.40)',
            }}
          >
            <Zap className="h-3.5 w-3.5 text-white fill-white" />
          </div>
          <div className="leading-none">
            <span className="font-bold text-sm text-foreground tracking-tight">ContentAI</span>
            <span className="text-[11px] text-muted-foreground ml-1">Studio</span>
          </div>
        </div>

        <Link href="/dashboard">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#ec4899)', boxShadow: '0 4px 16px #8b5cf630' }}
          >
            Entrar
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </Link>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center flex-1 min-h-[calc(100vh-64px)] px-6 lg:px-10 py-20">

        {/* Glow decorativo */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none opacity-[0.07] blur-3xl"
          style={{ background: 'linear-gradient(135deg, hsl(270 80% 60%), hsl(330 80% 60%), hsl(27 90% 57%))' }}
        />

        <div className="relative flex flex-col items-center text-center gap-7 max-w-3xl w-full animate-section animate-section-1">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, hsl(270 80% 55%), hsl(330 75% 55%))' }}
          >
            <Sparkles className="h-3 w-3" />
            IA Generativa para criadores de conteúdo
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.08] font-display">
            <span className="bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              Crie conteúdo
            </span>
            <br />
            <span className="text-foreground">com inteligência</span>
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
            Gere posts, carrosseis, stories e vídeos para redes sociais em segundos —
            alimentado por IA generativa de ponta.
          </p>

          {/* HeroCommand */}
          <div className="max-w-2xl w-full">
            <HeroCommand />
          </div>

        </div>
      </section>

      {/* ── Formatos ─────────────────────────────────────────────────────────── */}
      <section className="px-6 lg:px-10 pb-24 max-w-[1200px] mx-auto w-full animate-section animate-section-2">

        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="flex-1 max-w-[120px] h-px bg-gradient-to-r from-transparent to-border" />
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3">
            6 formatos disponíveis
          </h2>
          <div className="flex-1 max-w-[120px] h-px bg-gradient-to-l from-transparent to-border" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ALL_FORMATS.map((fmt, i) => {
            const cfg  = FORMAT_CONFIG[fmt]
            const Icon = cfg.icon
            return (
              <div
                key={fmt}
                className={cn(
                  'rounded-2xl border border-border bg-card/60 backdrop-blur-sm',
                  'p-4 flex flex-col items-center text-center gap-3',
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br',
                  cfg.iconBg,
                  'shadow-sm',
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-none text-foreground">{cfg.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">{cfg.dims}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">{cfg.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
