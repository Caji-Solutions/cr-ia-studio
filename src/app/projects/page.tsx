'use client'

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { useRouter } from 'next/navigation'
import type { ProjectFormat } from '@/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Search, Grid2X2, List, Play, Eye, Copy, Download, Trash2,
  Loader2, Folder, Plus, ChevronLeft, ChevronRight,
  Layers, LayoutTemplate, Smartphone, Video, PlaySquare, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const FORMAT_COLORS: Record<ProjectFormat, string> = {
  carousel:   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  post:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  story:      'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  video_16_9: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  video_9_16: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  caption:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Folder className="h-6 w-6 text-primary" />
            Projetos
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total > 0 ? `${total} projeto${total !== 1 ? 's' : ''}` : 'Seus projetos criados'}
          </p>
        </div>
        <Link href="/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar projetos..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Format filter */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <button
            onClick={() => setFormatFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              formatFilter === 'all'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
            )}
          >
            Todos
          </button>
          {ALL_FORMATS.map(f => (
            <button
              key={f}
              onClick={() => setFormatFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                formatFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
              )}
            >
              {FORMAT_LABELS[f]}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 sm:ml-auto">
          <button
            onClick={() => toggleView('grid')}
            className={cn(
              'size-8 flex items-center justify-center rounded-md border transition-colors',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
            title="Grade"
          >
            <Grid2X2 className="size-4" />
          </button>
          <button
            onClick={() => toggleView('list')}
            className={cn(
              'size-8 flex items-center justify-center rounded-md border transition-colors',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
            title="Lista"
          >
            <List className="size-4" />
          </button>
        </div>

      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-8 flex items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="size-8 flex items-center justify-center rounded-md border border-border disabled:opacity-40 hover:bg-muted transition-colors"
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

// ─── Project Card (Grid view) ─────────────────────────────────────────────────

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
  const thumb     = getThumbnail(p)
  const hasVideo  = isVideoFormat(p.format) && !!p.video_url
  const FormatIcon = FORMAT_ICONS[p.format]

  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">

      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FormatIcon className="h-10 w-10 text-muted-foreground/25" />
          </div>
        )}
        {/* Play overlay for videos */}
        {hasVideo && (
          <button
            onClick={() => onVideoPlay({ url: p.video_url!, title: p.title })}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="size-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Play className="size-5 fill-foreground text-foreground ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-2" title={p.title}>
          {p.title}
        </h3>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', FORMAT_COLORS[p.format])}>
            {FORMAT_LABELS[p.format]}
          </span>
          <span className="text-xs text-muted-foreground truncate">{relativeDate(p.updated_at)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(p)}
            className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Eye className="size-3" />
            Ver
          </button>
          <button
            onClick={() => onDuplicate(p)}
            disabled={isDuplicating}
            className="size-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Duplicar"
          >
            {isDuplicating ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
          </button>
          <button
            onClick={() => onDownload(p)}
            className="size-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Download"
          >
            <Download className="size-3" />
          </button>
          <button
            onClick={() => onDelete(p)}
            disabled={isDeleting}
            className="size-7 flex items-center justify-center rounded-md border border-destructive/40 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            title="Deletar"
          >
            {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
          </button>
        </div>
      </div>

    </div>
  )
})

// ─── Project Row (List view) ──────────────────────────────────────────────────

const ProjectRow = memo(function ProjectRow({
  project: p, onView, onVideoPlay, onDelete, onDuplicate, onDownload, isDeleting, isDuplicating,
}: CardProps) {
  const thumb     = getThumbnail(p)
  const hasVideo  = isVideoFormat(p.format) && !!p.video_url
  const FormatIcon = FORMAT_ICONS[p.format]

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm transition-shadow group">

      {/* Thumb */}
      <div className="relative w-20 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FormatIcon className="h-6 w-6 text-muted-foreground/25" />
          </div>
        )}
        {hasVideo && (
          <button
            onClick={() => onVideoPlay({ url: p.video_url!, title: p.title })}
            className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
          >
            <Play className="size-4 fill-white text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{p.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium shrink-0', FORMAT_COLORS[p.format])}>
            {FORMAT_LABELS[p.format]}
          </span>
          <span className="text-xs text-muted-foreground">{relativeDate(p.updated_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onView(p)}
          className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Eye className="size-3" />
          Ver
        </button>
        <button
          onClick={() => onDuplicate(p)}
          disabled={isDuplicating}
          className="size-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          title="Duplicar"
        >
          {isDuplicating ? <Loader2 className="size-3 animate-spin" /> : <Copy className="size-3" />}
        </button>
        <button
          onClick={() => onDownload(p)}
          className="size-7 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Download"
        >
          <Download className="size-3" />
        </button>
        <button
          onClick={() => onDelete(p)}
          disabled={isDeleting}
          className="size-7 flex items-center justify-center rounded-md border border-destructive/40 text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
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
    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl bg-muted/20">
      <Folder className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h2 className="text-lg font-semibold mb-2">
        {hasFilters ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
      </h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {hasFilters
          ? 'Tente ajustar os filtros ou a busca para encontrar seus projetos.'
          : 'Crie seu primeiro projeto e comece a produzir conteúdo com IA.'}
      </p>
      {!hasFilters && (
        <Link href="/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Criar Projeto
          </Button>
        </Link>
      )}
    </div>
  )
}
