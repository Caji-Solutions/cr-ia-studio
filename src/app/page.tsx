import type { Metadata } from 'next'
import { getDb, parseProject } from '@/lib/db'
import { HeroCommand } from '@/components/dashboard/hero-command'
import { CatAnimation } from '@/components/dashboard/cat-animation'
import {
  Layers, LayoutTemplate, Smartphone, Video, PlaySquare, FileText,
  TrendingUp, CalendarDays, BarChart2, Plus, Play, ArrowRight, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ProjectFormat } from '@/types/database'

export const metadata: Metadata = { title: 'Dashboard' }

// ─── Format config ─────────────────────────────────────────────────────────────

type FormatEntry = {
  label:    string
  dims:     string
  icon:     React.ElementType
  gradient: string
  iconBg:   string
}

const FORMAT_CONFIG: Record<ProjectFormat, FormatEntry> = {
  carousel:   { label: 'Carrossel',  dims: '1080×1350', icon: Layers,        gradient: 'from-violet-500 to-purple-600',  iconBg: 'from-violet-500 to-purple-600'   },
  post:       { label: 'Post',       dims: '1080×1080', icon: LayoutTemplate, gradient: 'from-purple-500 to-indigo-600', iconBg: 'from-purple-500 to-indigo-600'   },
  story:      { label: 'Story',      dims: '1080×1920', icon: Smartphone,    gradient: 'from-pink-500 to-rose-500',      iconBg: 'from-pink-500 to-rose-500'       },
  video_16_9: { label: 'Vídeo 16:9', dims: '1920×1080', icon: Video,         gradient: 'from-blue-500 to-cyan-500',      iconBg: 'from-blue-500 to-cyan-500'       },
  video_9_16: { label: 'Vídeo 9:16', dims: '1080×1920', icon: PlaySquare,    gradient: 'from-teal-500 to-emerald-500',   iconBg: 'from-teal-500 to-emerald-500'    },
  caption:    { label: 'Legenda',    dims: 'Texto',     icon: FileText,      gradient: 'from-amber-400 to-orange-500',   iconBg: 'from-amber-400 to-orange-500'    },
}

const ALL_FORMATS = Object.keys(FORMAT_CONFIG) as ProjectFormat[]

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RecentProject {
  id:            string
  title:         string
  format:        ProjectFormat
  status:        string
  thumbnail_url: string | null
  slides_urls:   string[] | null
  video_url:     string | null
  updated_at:    string
}

// ─── Data helpers ──────────────────────────────────────────────────────────────

function relativeDate(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)   return 'agora'
  if (mins < 60)  return `${mins}m atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days  = Math.floor(hours / 24)
  if (days < 30)  return `${days}d atrás`
  return `${Math.floor(days / 30)}mo atrás`
}

function getThumbnail(p: RecentProject): string | null {
  return p.thumbnail_url ?? (p.slides_urls?.[0] ?? null)
}

function isVideoFormat(fmt: ProjectFormat) {
  return fmt === 'video_16_9' || fmt === 'video_9_16'
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const db = getDb()

  // ── Metrics via SQL — evita carregar todos os projetos na memória ──────────
  const { total: totalCreated } = db.prepare(`SELECT COUNT(*) as total FROM projects`).get() as { total: number }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  const { total: thisMonth } = db.prepare(
    `SELECT COUNT(*) as total FROM projects WHERE created_at >= ?`
  ).get(startOfMonth.toISOString()) as { total: number }

  const formatRows = db.prepare(
    `SELECT format, COUNT(*) as cnt FROM projects GROUP BY format`
  ).all() as { format: ProjectFormat; cnt: number }[]
  const formatCounts = Object.fromEntries(formatRows.map(r => [r.format, r.cnt]))
  const favoriteFormat = (formatRows.sort((a, b) => b.cnt - a.cnt)[0]?.format ?? null) as ProjectFormat | null

  const recentRows = db.prepare(
    `SELECT id, title, format, status, thumbnail_url, slides_urls, video_url, updated_at FROM projects ORDER BY updated_at DESC LIMIT 6`
  ).all() as Parameters<typeof parseProject>[0][]
  const recentProjects = recentRows.map(r => parseProject(r)) as RecentProject[]

  const hasProjects = totalCreated > 0

  return (
    <div className="relative flex flex-col flex-1 p-6 lg:p-10 max-w-[1400px] mx-auto w-full overflow-y-auto">

      {/* Gatinho interativo — canto superior direito */}
      <div className="absolute top-2 right-2 lg:top-6 lg:right-4 xl:right-8 w-44 lg:w-52 xl:w-56 pointer-events-none hidden md:block">
        <CatAnimation />
      </div>

      {/* Header */}
      <header className="mb-8 hidden md:flex items-start justify-between">
        <div className="relative">
          <div
            className="absolute -top-4 -left-4 w-48 h-20 rounded-full pointer-events-none opacity-[0.12] blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(258 55% 56%), hsl(27 90% 57%))' }}
          />
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary opacity-70" />
            <span className="text-xs font-medium text-primary/70 uppercase tracking-widest">Estúdio de Conteúdo</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Bom dia, vamos criar!
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Gere conteúdo para redes sociais com inteligência artificial.
          </p>
        </div>
      </header>

      {/* Hero command */}
      <HeroCommand />

      {/* ── Métricas ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <GradientMetricCard
          icon={<TrendingUp className="h-5 w-5 text-white/70" />}
          label="Total criados"
          value={totalCreated}
          gradient="from-violet-600 via-purple-500 to-indigo-500"
          shadow="shadow-[0_8px_28px_hsl(258_55%_50%/0.35)]"
        />
        <GradientMetricCard
          icon={<CalendarDays className="h-5 w-5 text-white/70" />}
          label="Este mês"
          value={thisMonth}
          gradient="from-orange-400 via-amber-400 to-yellow-400"
          shadow="shadow-[0_8px_28px_hsl(27_90%_57%/0.35)]"
        />
        <GradientMetricCard
          icon={<BarChart2 className="h-5 w-5 text-white/70" />}
          label="Formato favorito"
          value={favoriteFormat ? FORMAT_CONFIG[favoriteFormat].label : '—'}
          gradient="from-teal-500 via-cyan-500 to-sky-400"
          shadow="shadow-[0_8px_28px_hsl(174_72%_46%/0.35)]"
          isText
        />
      </div>

      {/* ── Formatos ─────────────────────────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Formatos
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ALL_FORMATS.map(fmt => {
            const cfg   = FORMAT_CONFIG[fmt]
            const count = formatCounts[fmt] ?? 0
            const Icon  = cfg.icon
            return (
              <div key={fmt}>
                <Link href={`/create?format=${fmt}`}>
                  <div className={cn(
                    'group rounded-2xl border border-border bg-card',
                    'hover:border-primary/20 hover:shadow-[0_6px_24px_hsl(var(--primary)/0.10)]',
                    'transition-all duration-200 cursor-pointer p-4',
                    'flex flex-col items-center text-center gap-3',
                  )}>
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br', cfg.iconBg,
                      'shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200',
                    )}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-none text-foreground">{cfg.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">{cfg.dims}</p>
                      {count > 0 && (
                        <p className="text-[11px] text-primary/60 mt-1">
                          {count}× criado{count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Projetos Recentes ─────────────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Projetos Recentes
            </h2>
            <div className="flex-1 h-px bg-border w-8" />
          </div>
          {hasProjects && (
            <Link
              href="/projects"
              className="flex items-center gap-1 text-xs font-medium text-primary/70 hover:text-primary transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {hasProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map(p => {
              const thumb   = getThumbnail(p)
              const isVid   = isVideoFormat(p.format)
              const cfg     = FORMAT_CONFIG[p.format]
              const Icon    = cfg.icon

              return (
                <div key={p.id}>
                  <Link href={`/create?projectId=${p.id}`}>
                    <div className={cn(
                      'group rounded-2xl border border-border bg-card overflow-hidden',
                      'hover:border-primary/20 hover:shadow-[0_6px_28px_hsl(var(--primary)/0.10)]',
                      'transition-all duration-200 cursor-pointer',
                    )}>
                      {/* Thumbnail */}
                      <div className="relative h-36 bg-muted overflow-hidden">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className={cn(
                            'w-full h-full flex items-center justify-center',
                            'bg-gradient-to-br', cfg.gradient,
                          )}>
                            <Icon className="h-10 w-10 text-white opacity-40" />
                          </div>
                        )}
                        {isVid && p.video_url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="size-10 rounded-full bg-white/90 flex items-center justify-center shadow">
                              <Play className="size-4 fill-foreground text-foreground ml-0.5" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/90 text-foreground backdrop-blur-sm shadow-sm">
                            {cfg.label}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <p className="font-semibold text-sm line-clamp-1 text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{relativeDate(p.updated_at as string)}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-14 flex flex-col items-center text-center gap-4">
            <div
              className="size-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(258 55% 56% / 0.12), hsl(27 90% 57% / 0.08))' }}
            >
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Nenhum projeto ainda</h3>
              <p className="text-muted-foreground text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                Crie seu primeiro conteúdo com IA em menos de um minuto.
              </p>
            </div>
            <Link href="/create">
              <button className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl',
                'text-white text-xs font-semibold',
                'shadow-[0_4px_20px_hsl(258_55%_56%/0.35)]',
                'hover:opacity-90 transition-opacity',
              )}
              style={{ background: 'linear-gradient(135deg, hsl(258 55% 56%), hsl(258 55% 48%))' }}
              >
                <Plus className="h-3.5 w-3.5" />
                Criar primeiro projeto
              </button>
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}

// ─── GradientMetricCard ───────────────────────────────────────────────────────

function GradientMetricCard({
  icon, label, value, gradient, shadow, isText = false,
}: {
  icon:      React.ReactNode
  label:     string
  value:     number | string
  gradient:  string
  shadow:    string
  isText?:   boolean
}) {
  return (
    <div className={cn(
      'rounded-2xl p-6 relative overflow-hidden',
      'bg-gradient-to-br', gradient, shadow,
    )}>
      {/* Decorative blobs */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-black/10 blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-white/80 uppercase tracking-widest">{label}</p>
          <div className="p-1.5 rounded-lg bg-white/15">
            {icon}
          </div>
        </div>
        <p className={cn(
          'font-bold text-white tracking-tight',
          isText ? 'text-2xl' : 'text-4xl',
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}
