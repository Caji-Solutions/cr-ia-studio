'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Sparkles, ChevronLeft, ChevronRight, ChevronDown,
  Copy, Check, Download, RefreshCw, PlusCircle,
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Loader2, CheckCircle2, Circle, PenLine, ImageIcon,
  Film, Layers, Video, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ProjectFormat } from '@/types/database'

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface GenerateResult {
  project: {
    id:            string
    format:        ProjectFormat
    title:         string
    status:        string
    video_url:     string | null
    thumbnail_url: string | null
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content:   Record<string, any>
  slideUrls?: string[]
  format:    ProjectFormat
}

export interface PreviewPanelProps {
  format:         ProjectFormat
  isGenerating:   boolean
  stepperStep:    number
  renderProgress: number
  result:         GenerateResult | null
  onRefine:       () => void
  onNew:          () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toast.success('Copiado!')
      setTimeout(() => setCopied(false), timeout)
    })
  }, [timeout])
  return { copied, copy }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href     = url
  a.download = filename
  a.target   = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ format }: { format: ProjectFormat }) {
  const TIPS: Record<ProjectFormat, string[]> = {
    carousel:   ['Use 5–8 slides para melhor engajamento', 'Comece com uma pergunta impactante', 'Finalize com CTA claro'],
    post:       ['Mostre benefícios, não características', 'Use imagem de alta qualidade', 'Caption até 125 chars aparece sem "ver mais"'],
    story:      ['Primeiros 3s são decisivos', 'Use texto grande e legível', 'Elemento interativo aumenta retenção'],
    video_16_9: ['Ideal para YouTube e LinkedIn', 'Legendas aumentam 80% a retenção', 'Intro de 2s para apresentar a marca'],
    video_9_16: ['Formato nativo do TikTok e Reels', 'Hook nos primeiros 1.5s', 'Texto ocupa 70% da largura na tela'],
    caption:    ['Inclua emojis estrategicamente', 'Hashtags no comentário aumentam alcance', 'Pergunta no final gera mais comentários'],
  }
  const tips = TIPS[format]

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-8 text-center gap-6">
      <div className="size-20 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
        <Sparkles className="size-8 text-violet-500" />
      </div>
      <div>
        <h3 className="text-base font-semibold">Seu conteúdo aparecerá aqui</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha o briefing ao lado e clique em <strong>Criar com IA</strong>.
        </p>
      </div>
      <div className="w-full max-w-xs bg-muted/40 rounded-xl p-4 text-left">
        <p className="text-xs font-medium text-muted-foreground mb-2.5 uppercase tracking-wide">
          Dicas para {format.replace('_', ' ')}
        </p>
        <ul className="space-y-1.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── Loading Stepper ──────────────────────────────────────────────────────────

const STATIC_STEPS = [
  { label: 'Interpretando brief',  icon: Zap       },
  { label: 'Escrevendo conteúdo',  icon: PenLine   },
  { label: 'Gerando imagens',      icon: ImageIcon },
  { label: 'Montando resultado',   icon: Layers    },
]

const VIDEO_STEPS = [
  { label: 'Interpretando brief',   icon: Zap       },
  { label: 'Escrevendo roteiro',    icon: PenLine   },
  { label: 'Gerando cenas visuais', icon: Film      },
  { label: 'Renderizando vídeo',    icon: Video,  hasProgress: true },
  { label: 'Finalizando',           icon: Sparkles },
]

function LoadingStepper({
  format,
  step,
  renderProgress,
}: {
  format:         ProjectFormat
  step:           number
  renderProgress: number
}) {
  const isVideo = format === 'video_16_9' || format === 'video_9_16'
  const steps   = (isVideo ? VIDEO_STEPS : STATIC_STEPS) as Array<typeof VIDEO_STEPS[number]>

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] px-8 gap-10">
      {/* Animated icon */}
      <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center border border-violet-500/20">
        <Loader2 className="size-7 text-violet-500 animate-spin" />
      </div>

      {/* Steps */}
      <div className="w-full max-w-xs space-y-3">
        {steps.map(({ label, hasProgress }, i) => {
          const done    = i < step
          const current = i === step
          const pending = i > step

          return (
            <div key={i} className="flex items-start gap-3">
              {/* Icon/indicator */}
              <div className={cn(
                'mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                done    && 'bg-primary text-primary-foreground',
                current && 'bg-primary/20 text-primary',
                pending && 'bg-muted text-muted-foreground',
              )}>
                {done    ? <CheckCircle2 className="size-3.5" />
                : current ? <Loader2 className="size-3.5 animate-spin" />
                : <Circle className="size-3.5" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm transition-colors',
                  done    && 'text-muted-foreground line-through',
                  current && 'font-medium',
                  pending && 'text-muted-foreground',
                )}>
                  {label}
                </p>

                {/* Real progress bar for render step */}
                {current && hasProgress && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${renderProgress}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                      {renderProgress}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Action Bar ───────────────────────────────────────────────────────────────

function ActionBar({
  result,
  onRefine,
  onNew,
}: {
  result:   GenerateResult
  onRefine: () => void
  onNew:    () => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const { copied: copiedCaption,  copy: copyCaption  } = useCopy()
  const { copied: copiedHashtags, copy: copyHashtags } = useCopy()

  const caption  = result.content.caption  as string   | undefined
  const hashtags = result.content.hashtags as string[] | undefined

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/download/${result.project.id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Erro ao baixar')
        return
      }
      const blob        = await res.blob()
      const objectUrl   = URL.createObjectURL(blob)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const match       = disposition.match(/filename="([^"]+)"/)
      const filename    = match?.[1] ?? `${result.project.title}.zip`
      triggerDownload(objectUrl, filename)
      URL.revokeObjectURL(objectUrl)
      toast.success('Download iniciado!')
    } catch {
      toast.error('Falha no download')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-2 pt-4 border-t">
      {/* Copiar legenda / hashtags */}
      {(caption || hashtags?.length) && (
        <div className="flex gap-2">
          {caption && (
            <button
              onClick={() => copyCaption(caption)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium border',
                'border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              )}
            >
              {copiedCaption
                ? <Check className="size-3 text-emerald-500" />
                : <Copy  className="size-3" />}
              Copiar legenda
            </button>
          )}
          {hashtags?.length ? (
            <button
              onClick={() =>
                copyHashtags(
                  hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' '),
                )
              }
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium border',
                'border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              )}
            >
              {copiedHashtags
                ? <Check className="size-3 text-emerald-500" />
                : <Copy  className="size-3" />}
              Copiar hashtags
            </button>
          ) : null}
        </div>
      )}

      {/* Download / Refinar / Novo */}
      <div className="flex gap-2">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium',
            'bg-emerald-600 text-white hover:bg-emerald-500 transition-colors',
            isDownloading && 'opacity-70 cursor-not-allowed',
          )}
        >
          {isDownloading
            ? <Loader2  className="size-3.5 animate-spin" />
            : <Download className="size-3.5" />}
          {isDownloading ? 'Baixando…' : 'Download'}
        </button>

        {/* Refinar */}
        <button
          onClick={onRefine}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium border',
            'border-violet-500 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors',
          )}
        >
          <RefreshCw className="size-3.5" />
          Refinar
        </button>

        {/* Novo */}
        <button
          onClick={onNew}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium border',
            'border-border text-muted-foreground hover:bg-muted transition-colors',
          )}
        >
          <PlusCircle className="size-3.5" />
          Novo
        </button>
      </div>
    </div>
  )
}

// ─── Hashtag Badges ───────────────────────────────────────────────────────────

function HashtagBadges({ tags }: { tags: string[] }) {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium"
        >
          {tag.startsWith('#') ? tag : `#${tag}`}
        </span>
      ))}
    </div>
  )
}

// ─── Copiable Caption ─────────────────────────────────────────────────────────

function CaptionBlock({ text, hashtags }: { text: string; hashtags?: string[] }) {
  const { copied, copy } = useCopy()
  const full = [text, ...(hashtags ?? []).map((h) => (h.startsWith('#') ? h : `#${h}`))].join('\n')

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap flex-1">{text}</p>
        <button
          onClick={() => copy(full)}
          className="shrink-0 size-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
          title="Copiar legenda"
        >
          {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      {hashtags?.length ? <HashtagBadges tags={hashtags} /> : null}
    </div>
  )
}

// ─── Video Player ─────────────────────────────────────────────────────────────

function VideoPlayer({ url, isVertical }: { url: string; isVertical: boolean }) {
  const videoRef     = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying,    setIsPlaying]    = useState(false)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [volume,       setVolume]       = useState(0.8)
  const [isMuted,      setIsMuted]      = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOverlay,  setShowOverlay]  = useState(true)

  // Sync volume / mute to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume
      videoRef.current.muted  = isMuted
    }
  }, [volume, isMuted])

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) videoRef.current.pause()
    else videoRef.current.play()
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen()
    else document.exitFullscreen()
  }

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    setCurrentTime(t)
    if (videoRef.current) videoRef.current.currentTime = t
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black rounded-xl overflow-hidden select-none',
        isVertical ? 'aspect-[9/16] max-w-[260px] mx-auto' : 'aspect-video w-full',
      )}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => isPlaying && setShowOverlay(false)}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => { setIsPlaying(true); setShowOverlay(false) }}
        onPause={() => { setIsPlaying(false); setShowOverlay(true) }}
        onEnded={() => { setIsPlaying(false); setShowOverlay(true) }}
        onClick={togglePlay}
      />

      {/* Center play/pause overlay */}
      {(showOverlay || !isPlaying) && (
        <button
          onClick={togglePlay}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            'bg-black/30 hover:bg-black/40 transition-colors cursor-pointer',
          )}
        >
          <div className="size-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            {isPlaying
              ? <Pause  className="size-6 text-white" />
              : <Play   className="size-6 text-white fill-white ml-0.5" />
            }
          </div>
        </button>
      )}

      {/* Bottom controls bar */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 px-3 pt-6 pb-2.5',
        'bg-gradient-to-t from-black/80 via-black/40 to-transparent',
        'transition-opacity duration-200',
        !showOverlay && isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100',
      )}>
        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="w-full h-1 cursor-pointer rounded-full appearance-none mb-2"
          style={{ accentColor: 'white' }}
        />

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Play/pause */}
          <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors">
            {isPlaying
              ? <Pause className="size-4" />
              : <Play  className="size-4 fill-white" />
            }
          </button>

          {/* Timer */}
          <span className="text-white text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Mute */}
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="text-white hover:text-white/80 transition-colors"
          >
            {isMuted || volume === 0
              ? <VolumeX className="size-3.5" />
              : <Volume2 className="size-3.5" />
            }
          </button>

          {/* Volume slider */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => { setVolume(Number(e.target.value)); setIsMuted(false) }}
            className="w-14 h-1 cursor-pointer rounded-full appearance-none"
            style={{ accentColor: 'white' }}
          />

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition-colors">
            {isFullscreen
              ? <Minimize className="size-3.5" />
              : <Maximize className="size-3.5" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Scene Accordion ──────────────────────────────────────────────────────────

interface VideoScene {
  sceneNumber:       number
  duration:          string
  narration:         string
  visualDescription: string
  textOverlay:       string
  transition:        string
}

function SceneAccordion({ scenes }: { scenes: VideoScene[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setOpenIdx(openIdx === -1 ? null : -1)}
      >
        <span>Roteiro ({scenes.length} cenas)</span>
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', openIdx === -1 && 'rotate-180')} />
      </button>

      {openIdx === -1 && (
        <div className="divide-y divide-border">
          {scenes.map((scene, i) => (
            <div key={i} className="text-sm">
              <button
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <span className="font-medium">
                  Cena {scene.sceneNumber} · <span className="text-muted-foreground font-normal">{scene.duration}</span>
                </span>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform shrink-0', openIdx === i && 'rotate-180')} />
              </button>

              {openIdx === i && (
                <div className="px-4 pb-3 space-y-2 bg-muted/10">
                  {scene.textOverlay && (
                    <p className="text-xs"><span className="font-medium text-muted-foreground">Texto:</span> {scene.textOverlay}</p>
                  )}
                  {scene.narration && (
                    <p className="text-xs"><span className="font-medium text-muted-foreground">Narração:</span> {scene.narration}</p>
                  )}
                  {scene.visualDescription && (
                    <p className="text-xs"><span className="font-medium text-muted-foreground">Visual:</span> {scene.visualDescription}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Transição: {scene.transition}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Format Previews ──────────────────────────────────────────────────────────

function CarouselPreview({ result }: { result: GenerateResult }) {
  const [slide, setSlide] = useState(0)
  const { content, slideUrls = [] } = result
  const slides = content.slides ?? []
  const total  = Math.max(slides.length, slideUrls.length, 1)

  const prev = () => setSlide((s) => (s - 1 + total) % total)
  const next = () => setSlide((s) => (s + 1) % total)

  return (
    <div className="space-y-4">
      {/* Image + nav */}
      <div className="relative rounded-xl overflow-hidden bg-muted aspect-square">
        {slideUrls[slide] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slideUrls[slide]} alt={`Slide ${slide + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center px-8">
              <p className="font-semibold text-sm">{slides[slide]?.headline}</p>
              <p className="text-xs text-muted-foreground mt-1">{slides[slide]?.body}</p>
            </div>
          </div>
        )}

        {/* Side arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full tabular-nums">
          Slide {slide + 1}/{total}
        </div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn(
                'rounded-full transition-all',
                slide === i ? 'size-2.5 bg-primary' : 'size-2 bg-muted-foreground/30 hover:bg-muted-foreground/50',
              )}
            />
          ))}
        </div>
      )}

      {/* Caption + hashtags */}
      {content.caption && (
        <CaptionBlock text={content.caption} hashtags={content.hashtags} />
      )}
    </div>
  )
}

function PostPreview({ result }: { result: GenerateResult }) {
  const { content, slideUrls = [] } = result
  const imageUrl = slideUrls[0] ?? null

  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-muted aspect-square">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={content.headline} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8 text-center">
            <div>
              <p className="font-semibold">{content.headline}</p>
              <p className="text-sm text-muted-foreground mt-2">{content.body}</p>
            </div>
          </div>
        )}
      </div>
      {content.caption && (
        <CaptionBlock text={content.caption} hashtags={content.hashtags} />
      )}
    </div>
  )
}

function StoryPreview({ result }: { result: GenerateResult }) {
  const [frame, setFrame] = useState(0)
  const { content, slideUrls = [] } = result
  const frames = content.frames ?? []
  const total  = Math.max(frames.length, slideUrls.length, 1)

  return (
    <div className="space-y-4">
      {/* Vertical frame */}
      <div className="relative mx-auto aspect-[9/16] max-w-[220px] rounded-2xl overflow-hidden bg-muted">
        {slideUrls[frame] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slideUrls[frame]} alt={`Frame ${frame + 1}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center">
            <p className="font-semibold text-sm">{frames[frame]?.headline}</p>
          </div>
        )}

        {total > 1 && (
          <div className="absolute top-2 left-2 right-2 flex gap-1">
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                onClick={() => setFrame(i)}
                className={cn(
                  'flex-1 h-0.5 rounded-full transition-all',
                  i <= frame ? 'bg-white' : 'bg-white/40',
                )}
              />
            ))}
          </div>
        )}

        {total > 1 && (
          <div className="absolute inset-0 flex">
            <button className="flex-1" onClick={() => setFrame((f) => Math.max(0, f - 1))} />
            <button className="flex-1" onClick={() => setFrame((f) => Math.min(total - 1, f + 1))} />
          </div>
        )}
      </div>

      {content.caption && (
        <CaptionBlock text={content.caption} />
      )}
    </div>
  )
}

function VideoPreview({ result }: { result: GenerateResult }) {
  const { content, project } = result
  const isVertical = project.format === 'video_9_16'
  const videoUrl   = project.video_url
  const scenes     = content.scenes ?? []

  return (
    <div className="space-y-4">
      {videoUrl ? (
        <VideoPlayer url={videoUrl} isVertical={isVertical} />
      ) : (
        <div className={cn(
          'rounded-xl bg-muted/60 flex items-center justify-center border border-border',
          isVertical ? 'aspect-[9/16] max-w-[260px] mx-auto' : 'aspect-video',
        )}>
          <div className="text-center p-4">
            <Loader2 className="size-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Vídeo sendo renderizado…</p>
            <p className="text-xs text-muted-foreground mt-1">Aguarde ou confira em Projetos</p>
          </div>
        </div>
      )}

      {/* Roteiro expandível */}
      {scenes.length > 0 && <SceneAccordion scenes={scenes} />}

      {/* Caption + hashtags */}
      {content.caption && (
        <CaptionBlock text={content.caption} hashtags={content.hashtags} />
      )}
    </div>
  )
}

function CaptionPreview({ result }: { result: GenerateResult }) {
  const { content } = result
  const text = content.caption || content.body || content.text || ''
  const { copied, copy } = useCopy()
  const full = [text, ...(content.hashtags ?? []).map((h: string) => h.startsWith('#') ? h : `#${h}`)].join('\n')

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/20 p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-base leading-relaxed whitespace-pre-wrap flex-1">{text}</p>
          <button
            onClick={() => copy(full)}
            className="shrink-0 size-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
          </button>
        </div>

        {content.hashtags?.length > 0 && (
          <HashtagBadges tags={content.hashtags} />
        )}
      </div>

      <button
        onClick={() => copy(full)}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
        Copiar tudo
      </button>
    </div>
  )
}

// ─── Content Switcher ─────────────────────────────────────────────────────────

function ContentPreview({
  result,
  onRefine,
  onNew,
}: {
  result:   GenerateResult
  onRefine: () => void
  onNew:    () => void
}) {
  return (
    <div className="w-full max-w-lg mx-auto space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-base truncate max-w-[240px]" title={result.project.title}>
          {result.project.title}
        </h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium capitalize">
          {result.format.replace('_', ' ')}
        </span>
      </div>

      {result.format === 'carousel'   && <CarouselPreview result={result} />}
      {result.format === 'post'       && <PostPreview     result={result} />}
      {result.format === 'story'      && <StoryPreview    result={result} />}
      {(result.format === 'video_16_9' || result.format === 'video_9_16') && (
        <VideoPreview result={result} />
      )}
      {result.format === 'caption'    && <CaptionPreview  result={result} />}

      <ActionBar result={result} onRefine={onRefine} onNew={onNew} />
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PreviewPanel({
  format,
  isGenerating,
  stepperStep,
  renderProgress,
  result,
  onRefine,
  onNew,
}: PreviewPanelProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-muted/10 flex items-start justify-center min-h-screen">
      {!isGenerating && !result && (
        <EmptyState format={format} />
      )}

      {isGenerating && (
        <LoadingStepper
          format={format}
          step={stepperStep}
          renderProgress={renderProgress}
        />
      )}

      {!isGenerating && result && (
        <ContentPreview result={result} onRefine={onRefine} onNew={onNew} />
      )}
    </main>
  )
}
