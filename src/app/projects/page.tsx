'use client'

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectFormat } from '@/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Search, Grid2X2, List, Play, Eye, Copy, Download, Trash2,
  Loader2, Folder, Plus, ChevronLeft, ChevronRight,
  Layers, LayoutTemplate, Smartphone, Video, PlaySquare, FileText, Sparkles,
} from 'lucide-react'
import { StaggerGrid, StaggerItem } from '@/components/motion/stagger-grid'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id:            string
  title:         string
  format:        ProjectFormat
  status:        string
  thumbnail_url: string | null
  slides_urls:   string[] | null
  video_url:     string | null
  caption_text:  string | null
  created_at:    string
  updated_at:    string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<ProjectFormat, string> = {
  carousel:   'Carrossel',
  post:       'Post',
  story:      'Story',
  video_16_9: 'Vídeo 16:9',
  video_9_16: 'Vídeo 9:16',
  caption:    'Legenda',
}


const FORMAT_GRADIENTS: Record<ProjectFormat, string> = {
  carousel:   'from-violet-500 to-purple-600',
  post:       'from-purple-500 to-indigo-600',
  story:      'from-pink-500 to-rose-500',
  video_16_9: 'from-blue-500 to-cyan-500',
  video_9_16: 'from-teal-500 to-emerald-500',
  caption:    'from-amber-400 to-orange-500',
}

const FORMAT_ICONS: Record<ProjectFormat, React.ElementType> = {
  carousel:   Layers,
  post:       LayoutTemplate,
  story:      Smartphone,
  video_16_9: Video,
  video_9_16: PlaySquare,
  caption:    FileText,
}

const ALL_FORMATS: ProjectFormat[] = ['carousel', 'post', 'story', 'video_16_9', 'video_9_16', 'caption']
const PAGE_SIZE = 12

const FORMAT_PILL_GRADIENTS: Record<ProjectFormat, string> = {
  carousel:   'linear-gradient(135deg,#8b5cf6,#7c3aed)',
  post:       'linear-gradient(135deg,#6366f1,#4f46e5)',
  story:      'linear-gradient(135deg,#ec4899,#db2777)',
  video_16_9: 'linear-gradient(135deg,#3b82f6,#2563eb)',
  video_9_16: 'linear-gradient(135deg,#14b8a6,#0d9488)',
  caption:    'linear-gradient(135deg,#f59e0b,#d97706)',
}

const FORMAT_PILL_SHADOWS: Record<ProjectFormat, string> = {
  carousel:   '0 2px 12px #8b5cf640',
  post:       '0 2px 12px #6366f140',
  story:      '0 2px 12px #ec489940',
  video_16_9: '0 2px 12px #3b82f640',
  video_9_16: '0 2px 12px #14b8a640',
  caption:    '0 2px 12px #f59e0b40',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function isVideoFormat(fmt: ProjectFormat) {
  return fmt === 'video_16_9' || fmt === 'video_9_16'
}

function getThumbnail(p: Project): string | null {
  return p.thumbnail_url ?? (p.slides_urls?.[0] ?? null)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router     = useRouter()

  const [projects,     setProjects]     = useState<Project[]>([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(true)
  const [viewMode,     setViewMode]     = useState<'grid' | 'list'>('grid')
  const [formatFilter, setFormatFilter] = useState<ProjectFormat | 'all'>('all')
  const [searchInput,  setSearchInput]  = useState('')
  const [search,       setSearch]       = useState('')
  const [videoModal,   setVideoModal]   = useState<{ url: string; title: string } | null>(null)
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const [duplicating,  setDuplicating]  = useState<string | null>(null)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // ── Persist view mode ────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('projects-view')
    if (stored === 'list' || stored === 'grid') setViewMode(stored)
  }, [])

  const toggleView = (v: 'grid' | 'list') => {
    setViewMode(v)
    localStorage.setItem('projects-view', v)
  }

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [formatFilter])

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (formatFilter !== 'all') params.set('format', formatFilter)
      if (search.trim())          params.set('search', search.trim())

      const res  = await fetch(`/api/projects?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar projetos')
      const data = await res.json() as { projects: Project[]; total: number }
      setProjects(data.projects)
      setTotal(data.total)
    } catch {
      toast.error('Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [page, formatFilter, search])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleView = (p: Project) => router.push(`/create?projectId=${p.id}`)

  const handleDelete = async (p: Project) => {
    if (!confirm(`Deletar "${p.title}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(p.id)
    try {
      const res = await fetch(`/api/projects/${p.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Erro ao deletar')
        return
      }
      toast.success('Projeto deletado')
      fetchProjects()
    } catch {
      toast.error('Erro ao deletar')
    } finally {
      setDeleting(null)
    }
  }

  const handleDuplicate = async (p: Project) => {
    setDuplicating(p.id)
    try {
      const res = await fetch(`/api/projects/${p.id}/duplicate`, { method: 'POST' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Erro ao duplicar')
        return
      }
      toast.success(`"${p.title}" duplicado`)
      setPage(1)
      fetchProjects()
    } catch {
      toast.error('Erro ao duplicar')
    } finally {
      setDuplicating(null)
    }
  }

  const handleDownload = async (p: Project) => {
    try {
      const res = await fetch(`/api/download/${p.id}`)
      if (!res.ok) { toast.error('Erro no download'); return }
      const blob = await res.blob()
      const cd   = res.headers.get('content-disposition') ?? ''
      const match = cd.match(/filename="?([^";\n]+)"?/)
      const filename = match?.[1] ?? `${p.title}.zip`
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href     = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download iniciado!')
    } catch {
      toast.error('Erro no download')
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-section animate-section-1">
        <div className="relative">
          <div
            className="absolute -top-4 -left-4 w-52 h-24 rounded-full pointer-events-none opacity-[0.14] blur-3xl"
            style={{ background: 'linear-gradient(135deg, hsl(258 55% 56%), hsl(200 75% 55%))' }}
          />
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary opacity-70" />
            <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">Biblioteca</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Projetos
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {total > 0
              ? `${total} projeto${total !== 1 ? 's' : ''} criado${total !== 1 ? 's' : ''}`
              : 'Seus projetos criados com IA'}
          </p>
        </div>

        <Link href="/create">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold shrink-0 hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', boxShadow: '0 4px 20px #8b5cf640' }}
          >
            <Plus className="h-4 w-4" />
            Criar novo
          </button>
        </Link>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap animate-section animate-section-2">

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar projetos..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9 h-9 border-border/70 bg-background/60 text-sm"
          />
        </div>

        {/* Format filter pills */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <button
            onClick={() => setFormatFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
              formatFilter === 'all'
                ? 'text-white border-transparent shadow-[0_2px_12px_#8b5cf640]'
                : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground bg-background/60',
            )}
            style={formatFilter === 'all' ? { background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' } : undefined}
          >
            Todos
          </button>
          {ALL_FORMATS.map(f => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200',
                formatFilter === f
                  ? 'text-white border-transparent'
                  : 'border-border/60 text-muted-foreground hover:border-primary/30 hover:text-foreground bg-background/60',
              )}
              style={formatFilter === f ? {
                background: FORMAT_PILL_GRADIENTS[f],
                boxShadow:  FORMAT_PILL_SHADOWS[f],
              } : undefined}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 sm:ml-auto items-center p-0.5 rounded-lg bg-muted/60 border border-border/50">
          <button
            onClick={() => toggleView('grid')}
            className={cn(
              'size-7 flex items-center justify-center rounded-md transition-all duration-150',
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Grade"
          >
            <Grid2X2 className="size-3.5" />
          </button>
          <button
            onClick={() => toggleView('list')}
            className={cn(
              'size-7 flex items-center justify-center rounded-md transition-all duration-150',
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            title="Lista"
          >
            <List className="size-3.5" />
          </button>
        </div>

      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState hasFilters={formatFilter !== 'all' || search !== ''} />
      ) : (
        <>
          {viewMode === 'grid' ? (
            <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map(p => (
                <StaggerItem key={p.id}>
                  <ProjectCard
                    project={p}
                    onView={handleView}
                    onVideoPlay={setVideoModal}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onDownload={handleDownload}
                    isDeleting={deleting === p.id}
                    isDuplicating={duplicating === p.id}
                  />
                </StaggerItem>
              ))}
            </StaggerGrid>
          ) : (
            <div className="flex flex-col gap-2">
              {projects.map(p => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  onView={handleView}
                  onVideoPlay={setVideoModal}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onDownload={handleDownload}
                  isDeleting={deleting === p.id}
                  isDuplicating={duplicating === p.id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-8 flex items-center justify-center rounded-lg border border-border/70 bg-background/60 disabled:opacity-40 hover:bg-muted hover:border-border transition-all"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <span className="text-sm font-semibold tabular-nums">{page}</span>
                <span className="text-sm text-muted-foreground">/</span>
                <span className="text-sm text-muted-foreground tabular-nums">{totalPages}</span>
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="size-8 flex items-center justify-center rounded-lg border border-border/70 bg-background/60 disabled:opacity-40 hover:bg-muted hover:border-border transition-all"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Video Modal */}
      <Dialog open={videoModal !== null} onOpenChange={() => setVideoModal(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-3">
          <DialogTitle className="sr-only">{videoModal?.title ?? 'Player de vídeo'}</DialogTitle>
          {videoModal && (
            <video
              src={videoModal.url}
              controls
              autoPlay
              className="w-full rounded-lg max-h-[80vh]"
            />
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}

// ─── Project Card (Grid) ──────────────────────────────────────────────────────

interface CardProps {
  project:       Project
  onView:        (p: Project) => void
  onVideoPlay:   (v: { url: string; title: string }) => void
  onDelete:      (p: Project) => void
  onDuplicate:   (p: Project) => void
  onDownload:    (p: Project) => void
  isDeleting:    boolean
  isDuplicating: boolean
}

const ProjectCard = memo(function ProjectCard({
  project: p, onView, onVideoPlay, onDelete, onDuplicate, onDownload, isDeleting, isDuplicating,
}: CardProps) {
  const thumb      = getThumbnail(p)
  const hasVideo   = isVideoFormat(p.format) && !!p.video_url
  const FormatIcon = FORMAT_ICONS[p.format]

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-250 hover:border-border hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] hover:-translate-y-0.5">

      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={p.title}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-400"
          />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br', FORMAT_GRADIENTS[p.format])}>
            <FormatIcon className="h-10 w-10 text-white opacity-30" />
          </div>
        )}

        {/* Format badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white backdrop-blur-sm border border-white/20"
            style={{ background: FORMAT_PILL_GRADIENTS[p.format] }}
          >
            {FORMAT_LABELS[p.format]}
          </span>
        </div>

        {/* Play overlay for videos */}
        {hasVideo && (
          <button
            onClick={() => onVideoPlay({ url: p.video_url!, title: p.title })}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="size-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm">
              <Play className="size-4 fill-foreground text-foreground ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-3" title={p.title}>
          {p.title}
        </h3>

        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs text-muted-foreground">{relativeDate(p.updated_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onView(p)}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-xs font-semibold text-white hover:opacity-90 transition-all active:scale-[0.97]"
            style={{ background: FORMAT_PILL_GRADIENTS[p.format], boxShadow: FORMAT_PILL_SHADOWS[p.format] }}
          >
            <Eye className="size-3" />
            Abrir
          </button>
          <button
            onClick={() => onDuplicate(p)}
            disabled={isDuplicating}
            className="size-8 flex items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all disabled:opacity-50"
            title="Duplicar"
          >
            {isDuplicating ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
          </button>
          <button
            onClick={() => onDownload(p)}
            className="size-8 flex items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border transition-all"
            title="Download"
          >
            <Download className="size-3" />
          </button>
          <button
            onClick={() => onDelete(p)}
            disabled={isDeleting}
            className="size-8 flex items-center justify-center rounded-xl border border-destructive/30 text-destructive/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all disabled:opacity-50"
            title="Deletar"
          >
            {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
          </button>
        </div>
      </div>
    </div>
  )
})

// ─── Project Row (List) ───────────────────────────────────────────────────────

const ProjectRow = memo(function ProjectRow({
  project: p, onView, onVideoPlay, onDelete, onDuplicate, onDownload, isDeleting, isDuplicating,
}: CardProps) {
  const thumb      = getThumbnail(p)
  const hasVideo   = isVideoFormat(p.format) && !!p.video_url
  const FormatIcon = FORMAT_ICONS[p.format]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-2.5 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.07)] transition-all duration-200 group">

      {/* Thumb */}
      <div className="relative w-20 h-[52px] rounded-lg bg-muted overflow-hidden shrink-0">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className={cn('w-full h-full flex items-center justify-center bg-gradient-to-br', FORMAT_GRADIENTS[p.format])}>
            <FormatIcon className="h-5 w-5 text-white opacity-40" />
          </div>
        )}
        {hasVideo && (
          <button
            onClick={() => onVideoPlay({ url: p.video_url!, title: p.title })}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
          >
            <Play className="size-3.5 fill-white text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{p.title}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="px-1.5 py-px rounded-full text-[10px] font-semibold text-white"
            style={{ background: FORMAT_PILL_GRADIENTS[p.format] }}
          >
            {FORMAT_LABELS[p.format]}
          </span>
          <span className="text-xs text-muted-foreground">{relativeDate(p.updated_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onView(p)}
          className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-all active:scale-[0.97]"
          style={{ background: FORMAT_PILL_GRADIENTS[p.format] }}
        >
          <Eye className="size-3" />
          Abrir
        </button>
        <button
          onClick={() => onDuplicate(p)}
          disabled={isDuplicating}
          className="size-7 flex items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-all disabled:opacity-50"
          title="Duplicar"
        >
          {isDuplicating ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
        </button>
        <button
          onClick={() => onDownload(p)}
          className="size-7 flex items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          title="Download"
        >
          <Download className="size-3" />
        </button>
        <button
          onClick={() => onDelete(p)}
          disabled={isDeleting}
          className="size-7 flex items-center justify-center rounded-lg border border-destructive/30 text-destructive/50 hover:bg-destructive/10 hover:text-destructive transition-all disabled:opacity-50"
          title="Deletar"
        >
          {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
        </button>
      </div>
    </div>
  )
})

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center rounded-2xl border border-dashed border-border/60 bg-card/40">
      <div
        className="size-20 rounded-2xl flex items-center justify-center mb-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        style={{ background: 'linear-gradient(135deg, hsl(258 55% 56% / 0.10), hsl(200 75% 55% / 0.06))' }}
      >
        <Folder className="h-9 w-9 text-primary/40" />
      </div>
      <h2 className="text-lg font-semibold mb-2 font-display">
        {hasFilters ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
      </h2>
      <p className="text-sm text-muted-foreground mb-7 max-w-sm leading-relaxed">
        {hasFilters
          ? 'Tente ajustar os filtros ou a busca para encontrar seus projetos.'
          : 'Crie seu primeiro projeto e comece a produzir conteúdo com IA em segundos.'}
      </p>
      {!hasFilters && (
        <Link href="/create">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 24px #8b5cf650' }}
          >
            <Plus className="h-4 w-4" />
            Criar Projeto
          </button>
        </Link>
      )}
    </div>
  )
}
