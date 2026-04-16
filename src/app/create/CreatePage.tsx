'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  LayoutGrid, ImageIcon, Smartphone, Monitor,
  Type, Loader2, ChevronDown, Music, Film, RefreshCw, Sparkles, Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { getBrandKits, type BrandKit } from '@/lib/api/brand-kits'
import type { ProjectFormat } from '@/types/database'
import { PreviewPanel, type GenerateResult } from './PreviewPanel'

const RefinementPanel = dynamic(
  () => import('./RefinementPanel').then((m) => ({ default: m.RefinementPanel })),
  { ssr: false },
)

// ─── Types ────────────────────────────────────────────────────────────────────

type MusicMood = 'energetic' | 'calm' | 'corporate' | 'fun'

interface AdvancedOptions {
  count:    number
  audience: string
  tone:     string
}

interface CreatePageProps {
  initialFormat?:  ProjectFormat
  initialCommand?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: {
  value:    ProjectFormat
  label:    string
  icon:     React.ElementType
  isVideo:  boolean
  gradient: string
  shadow:   string
}[] = [
  { value: 'carousel',   label: 'Carrossel',  icon: LayoutGrid, isVideo: false, gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', shadow: '0 4px 14px #8b5cf644' },
  { value: 'post',       label: 'Post',        icon: ImageIcon,  isVideo: false, gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', shadow: '0 4px 14px #6366f144' },
  { value: 'story',      label: 'Story',       icon: Film,       isVideo: false, gradient: 'linear-gradient(135deg,#ec4899,#db2777)', shadow: '0 4px 14px #ec489944' },
  { value: 'video_16_9', label: 'Vídeo 16:9', icon: Monitor,    isVideo: true,  gradient: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: '0 4px 14px #3b82f644' },
  { value: 'video_9_16', label: 'Vídeo 9:16', icon: Smartphone, isVideo: true,  gradient: 'linear-gradient(135deg,#14b8a6,#0d9488)', shadow: '0 4px 14px #14b8a644' },
  { value: 'caption',    label: 'Legenda',     icon: Type,       isVideo: false, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: '0 4px 14px #f59e0b44' },
]

const PLACEHOLDERS: Record<ProjectFormat, string> = {
  carousel:   'Ex: 5 dicas para aumentar vendas no Instagram com produtos físicos...',
  post:       'Ex: Lançamento da nova linha de skincare vegana da marca...',
  story:      'Ex: Promoção relâmpago, 50% off só hoje nas categorias X e Y...',
  video_16_9: 'Ex: Apresentação institucional da empresa para LinkedIn...',
  video_9_16: 'Ex: Tutorial rápido de como usar nosso app em 60 segundos...',
  caption:    'Ex: Foto do time comemorando resultado mensal do Q3...',
}

const MUSIC_OPTIONS: { value: MusicMood; label: string }[] = [
  { value: 'energetic', label: 'Energética' },
  { value: 'calm',      label: 'Calma' },
  { value: 'corporate', label: 'Corporativa' },
  { value: 'fun',       label: 'Divertida' },
]

// Simulated stepper delays during API call
const STATIC_STEP_DELAYS  = [0, 3000, 10000] // step 0,1,2 (step 3 set on response)
const VIDEO_STEP_DELAYS   = [0, 3000, 8000]  // step 0,1,2 (step 3 set on 202)

// ─── Component ────────────────────────────────────────────────────────────────

export function CreatePage({ initialFormat, initialCommand }: CreatePageProps) {
  const { user } = useAuth()
  const router   = useRouter()

  // ── Form state ──────────────────────────────────────────────────────────────
  const [command,        setCommand]        = useState(initialCommand ?? '')
  const [format,         setFormat]         = useState<ProjectFormat>(initialFormat ?? 'carousel')
  const [brandKitId,     setBrandKitId]     = useState<string | null>(null)
  const [generateImages, setGenerateImages] = useState(true)
  const [musicEnabled,   setMusicEnabled]   = useState(false)
  const [musicMood,      setMusicMood]      = useState<MusicMood>('energetic')
  const [options,        setOptions]        = useState<AdvancedOptions>({ count: 5, audience: '', tone: '' })
  const [advancedOpen,   setAdvancedOpen]   = useState(false)
  const [brandKits,      setBrandKits]      = useState<BrandKit[]>([])

  // ── Generation state ─────────────────────────────────────────────────────────
  const [isGenerating,    setIsGenerating]    = useState(false)
  const [isRefining,      setIsRefining]      = useState(false)
  const [canUndo,         setCanUndo]         = useState(false)
  const [stepperStep,     setStepperStep]     = useState(0)
  const [renderProgress,  setRenderProgress]  = useState(0)
  const [videoProjectId,  setVideoProjectId]  = useState<string | null>(null)
  const [result,          setResult]          = useState<GenerateResult | null>(null)
  const [lastError,       setLastError]       = useState<string | null>(null)

  // Ref to clear step timers on response
  const stepTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const isVideo     = FORMAT_OPTIONS.find((f) => f.value === format)?.isVideo ?? false
  const selectedKit = brandKits.find((bk) => bk.id === brandKitId) ?? null

  // ── Load brand kits ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    getBrandKits()
      .then((kits) => {
        setBrandKits(kits)
        const def = kits.find((k) => k.is_default)
        if (def) setBrandKitId(def.id)
      })
      .catch(() => {})
  }, [user?.id])

  // ── Video render polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoProjectId) return

    // intervalRef allows poll (defined before interval) to clear itself via closure
    const intervalRef: { current: ReturnType<typeof setInterval> | undefined } = { current: undefined }

    const poll = async () => {
      try {
        const res = await fetch(`/api/render-video/status/${videoProjectId}`)
        if (!res.ok) return

        const data = await res.json()
        setRenderProgress(data.render_progress ?? 0)

        if (data.status === 'ready') {
          clearInterval(intervalRef.current)
          setStepperStep(4) // Finalizando
          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  project: {
                    ...prev.project,
                    status:        'ready',
                    video_url:     data.video_url ?? null,
                    thumbnail_url: data.thumbnail_url ?? null,
                  },
                }
              : prev
          )
          setTimeout(() => {
            setIsGenerating(false)
            setVideoProjectId(null)
          }, 1200)
        } else if (data.status === 'error') {
          clearInterval(intervalRef.current)
          setIsGenerating(false)
          setVideoProjectId(null)
          const msg = 'Vídeo demorou demais, tente com menos cenas'
          setLastError(msg)
          toast.error(msg)
        }
      } catch {
        // network error — retry next tick
      }
    }

    poll() // immediate first check
    intervalRef.current = setInterval(poll, 3000)
    return () => clearInterval(intervalRef.current)
  }, [videoProjectId])

  // ── Core generation ─────────────────────────────────────────────────────────
  const runGenerate = async (extraContext?: string) => {
    if (!command.trim() || isGenerating) return

    setIsGenerating(true)
    setIsRefining(false)
    setResult(null)
    setLastError(null)
    setStepperStep(0)
    setRenderProgress(0)

    // Simulate step progression during API call
    const delays = isVideo ? VIDEO_STEP_DELAYS : STATIC_STEP_DELAYS
    stepTimersRef.current = delays.map((delay, i) =>
      setTimeout(() => setStepperStep(i), delay)
    )

    try {
      const extraParts: string[] = []
      if (options.audience) extraParts.push(`Público-alvo: ${options.audience}`)
      if (options.tone)     extraParts.push(`Tom: ${options.tone}`)
      if (musicEnabled && isVideo) {
        const label = MUSIC_OPTIONS.find((m) => m.value === musicMood)?.label ?? musicMood
        extraParts.push(`Trilha sonora preferida: ${label}`)
      }
      if (extraContext) extraParts.push(`Instrução de refinamento: ${extraContext}`)

      const body = {
        command:        command.trim(),
        format,
        brandKitId:     brandKitId ?? undefined,
        generateImages,
        options: {
          // slideCount só para carrossel; frameCount só para story
          ...(format === 'carousel' ? { slideCount: options.count } : {}),
          ...(format === 'story'    ? { frameCount: Math.min(options.count, 5) as 1 | 2 | 3 | 4 | 5 } : {}),
          extraInstructions: extraParts.length > 0 ? extraParts.join('. ') : undefined,
        },
      }

      const res  = await fetch('/api/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      // Clear simulated timers now that we have a response
      stepTimersRef.current.forEach(clearTimeout)

      const data = await res.json()

      if (!res.ok) {
        const msg = data.error ?? 'Erro ao gerar conteúdo'
        setLastError(msg)

        // API key not configured → guide user to settings
        if (msg.includes('GEMINI_API_KEY') || msg.includes('Gemini') || msg.includes('gemini')) {
          toast.error('Chave API Gemini inválida ou não configurada', {
            description: 'Verifique sua chave Gemini nas configurações.',
            action: { label: 'Configurar', onClick: () => router.push('/settings') },
          })
        } else if (res.status === 429) {
          toast.error('Cota Gemini esgotada', {
            description: msg.includes('diário') || msg.includes('Cota')
              ? 'Limite diário atingido. Crie uma nova chave em aistudio.google.com ou aguarde até meia-noite (horário do Pacífico).'
              : 'Muitas requisições. Aguarde um momento e tente novamente.',
            duration: 8000,
          })
        } else {
          toast.error(msg)
        }
        setIsGenerating(false)
        return
      }

      if (res.status === 202) {
        // Video — keep loading, start polling
        setStepperStep(3) // Renderizando vídeo
        setVideoProjectId(data.project.id)
        setResult({
          project:  data.project,
          content:  data.content,
          format,
        })
        toast.info('Vídeo enviado para renderização!')
        // isGenerating stays true until polling resolves
      } else {
        // Static format — done
        setStepperStep(3)
        setResult({
          project:   data.project,
          content:   data.content,
          slideUrls: data.slideUrls ?? [],
          format,
        })
        await new Promise((r) => setTimeout(r, 400))
        setIsGenerating(false)
        toast.success('Conteúdo criado com sucesso!')
      }
    } catch {
      stepTimersRef.current.forEach(clearTimeout)
      const msg = 'Erro de conexão. Verifique sua internet e tente novamente.'
      setLastError(msg)
      toast.error(msg)
      setIsGenerating(false)
    }
  }

  const handleSubmit           = () => runGenerate()
  const handleRefine           = () => setIsRefining(true)
  const handleRefinementCancel = () => setIsRefining(false)

  // Chamado pelo RefinementPanel quando refinamento estático completa
  const handleRefined = (newResult: GenerateResult) => {
    setResult(newResult)
    setCanUndo(true)
  }

  // Chamado pelo RefinementPanel quando vídeo está sendo re-renderizado (202)
  const handleVideoRefinePending = (projectId: string) => {
    setIsRefining(false)
    setIsGenerating(true)
    setStepperStep(3) // Renderizando vídeo
    setRenderProgress(0)
    setVideoProjectId(projectId)
  }

  // Chamado pelo RefinementPanel após undo bem-sucedido
  const handleUndo = (revertedResult: GenerateResult) => {
    setResult(revertedResult)
    setCanUndo(false)
  }

  const handleNew = () => {
    setCommand('')
    setResult(null)
    setIsRefining(false)
    setCanUndo(false)
    setLastError(null)
    setFormat('carousel')
    setBrandKitId(null)
    setGenerateImages(true)
    setMusicEnabled(false)
    setOptions({ count: 5, audience: '', tone: '' })
    setStepperStep(0)
    setRenderProgress(0)
    setAdvancedOpen(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">

      {/* ══════════════ LEFT COLUMN — Briefing / Refinamento ══════════════ */}
      <aside className="lg:w-[390px] lg:min-h-screen border-r border-border/60 shrink-0 overflow-y-auto bg-card/40 backdrop-blur-sm">

        {/* Refinement panel — aparece quando usuário clica em Refinar */}
        {isRefining && result && (
          <RefinementPanel
            result={result}
            canUndo={canUndo}
            onRefined={handleRefined}
            onVideoRefinePending={handleVideoRefinePending}
            onUndo={handleUndo}
            onCancel={handleRefinementCancel}
          />
        )}

        {/* Briefing form — oculto durante refinamento */}
        <div className={isRefining && result ? 'hidden' : undefined}>

          {/* ── Cabeçalho gradiente ────────────────────────────────────────────── */}
          <div
            className="relative px-5 pt-6 pb-5 border-b border-border/60 overflow-hidden"
          >
            {/* Glow decorativo */}
            <div
              className="absolute -top-6 -right-6 size-32 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, #8b5cf633 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-4 -left-4 size-24 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, #ec489922 0%, transparent 70%)' }}
            />
            <div className="relative flex items-center gap-2 mb-0.5">
              <div
                className="size-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
              >
                <Wand2 className="size-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3 text-primary/60" />
                <span className="text-[10px] font-semibold text-primary/60 uppercase tracking-widest">IA Generativa</span>
              </div>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-foreground mt-2 font-display">Novo conteúdo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Descreva o que deseja criar</p>
          </div>

          <div className="p-5 flex flex-col gap-4">

            {/* Textarea — animate-section-1 */}
            <div className="flex flex-col gap-1.5 animate-section animate-section-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                O que você quer criar?
              </label>
              <Textarea
                rows={4}
                placeholder={PLACEHOLDERS[format]}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="resize-none text-sm leading-relaxed border-border/70 focus:border-primary/50 focus:ring-primary/20 bg-background/60"
                disabled={isGenerating}
              />
            </div>

            {/* Format grid 3×2 — animate-section-2 */}
            <div className="flex flex-col gap-1.5 animate-section animate-section-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Formato</label>
              <div className="grid grid-cols-3 gap-1.5">
                {FORMAT_OPTIONS.map(({ value: val, label, icon: Icon, gradient, shadow }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFormat(val)}
                    disabled={isGenerating}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border py-3 px-1 text-xs font-semibold transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'disabled:pointer-events-none disabled:opacity-50',
                      format === val
                        ? 'border-transparent text-white scale-[1.03]'
                        : 'border-border/60 bg-background/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border',
                    )}
                    style={format === val ? { background: gradient, boxShadow: shadow } : {}}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Kit — animate-section-3 */}
            <div className="flex flex-col gap-1.5 animate-section animate-section-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand Kit</label>
              <Select
                value={brandKitId ?? 'none'}
                onValueChange={(v) => setBrandKitId(!v || v === 'none' ? null : v)}
              >
                <SelectTrigger className="w-full h-9 border-border/70 bg-background/60">
                  <SelectValue placeholder="Sem Brand Kit">
                    {selectedKit ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ background: selectedKit.primary_color ?? '#6366f1' }}
                        />
                        <span className="truncate">{selectedKit.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sem Brand Kit</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="size-3 rounded-full bg-muted-foreground/30 shrink-0" />
                    Sem Brand Kit
                  </SelectItem>
                  {brandKits.map((bk) => (
                    <SelectItem key={bk.id} value={bk.id}>
                      <span
                        className="size-3 rounded-full shrink-0"
                        style={{ background: bk.primary_color ?? '#6366f1' }}
                      />
                      {bk.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gerar imagens IA — animate-section-4 */}
            <div className="animate-section animate-section-4 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-violet-500/5 to-blue-500/5 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#8b5cf620,#3b82f620)' }}>
                  <ImageIcon className="size-3.5 text-violet-500" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">Gerar imagens IA</span>
                  <span className="text-xs text-muted-foreground">Via Imagen 3 (Google)</span>
                </div>
              </div>
              <Switch
                checked={generateImages}
                onCheckedChange={setGenerateImages}
                disabled={isGenerating}
              />
            </div>

            {/* Trilha sonora — só para vídeo */}
            {isVideo && (
              <div className="flex flex-col gap-2 animate-section animate-section-5">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-gradient-to-r from-amber-500/5 to-orange-500/5 px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#f59e0b20,#f9731620)' }}>
                      <Music className="size-3.5 text-amber-500" />
                    </div>
                    <span className="text-sm font-medium">Trilha sonora</span>
                  </div>
                  <Switch
                    checked={musicEnabled}
                    onCheckedChange={setMusicEnabled}
                    disabled={isGenerating}
                  />
                </div>

                {musicEnabled && (
                  <Select
                    value={musicMood}
                    onValueChange={(v) => v && setMusicMood(v as MusicMood)}
                  >
                    <SelectTrigger className="w-full h-9 border-border/70 bg-background/60">
                      <SelectValue placeholder="Mood da trilha" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSIC_OPTIONS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Opções avançadas */}
            <div className="rounded-xl border border-border/60 overflow-hidden bg-background/40">
              <button
                type="button"
                onClick={() => setAdvancedOpen((o) => !o)}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
              >
                <span className="text-muted-foreground">Opções avançadas</span>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', advancedOpen && 'rotate-180')} />
              </button>

              {advancedOpen && (
                <div className="border-t border-border/60 px-3.5 pb-3.5 pt-3 flex flex-col gap-3">
                  {(format === 'carousel' || format === 'story') && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {format === 'story' ? 'Número de frames' : 'Número de slides'}
                      <span className="ml-1 font-normal">{format === 'story' ? '(1–5)' : '(3–10)'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={format === 'story' ? 1 : 3}
                        max={format === 'story' ? 5 : 10}
                        step={1}
                        value={options.count}
                        onChange={(e) => setOptions((o) => ({ ...o, count: Number(e.target.value) }))}
                        className="flex-1 h-1.5 accent-primary cursor-pointer"
                        disabled={isGenerating}
                      />
                      <span className="w-5 text-center text-sm font-semibold tabular-nums">{options.count}</span>
                    </div>
                  </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Público-alvo</label>
                    <Input
                      placeholder="Ex: Empreendedores 25-40 anos"
                      value={options.audience}
                      onChange={(e) => setOptions((o) => ({ ...o, audience: e.target.value }))}
                      disabled={isGenerating}
                      className="h-9 text-sm border-border/70 bg-background/60"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tom de voz</label>
                    <Input
                      placeholder="Ex: Descontraído, profissional"
                      value={options.tone}
                      onChange={(e) => setOptions((o) => ({ ...o, tone: e.target.value }))}
                      disabled={isGenerating}
                      className="h-9 text-sm border-border/70 bg-background/60"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit — botão gradiente com glow */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating || !command.trim()}
              className={cn(
                'relative flex w-full items-center justify-center gap-2',
                'h-12 rounded-xl text-sm font-bold text-white',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
                'active:scale-[0.98]',
                !isGenerating && command.trim() ? 'hover:opacity-90 hover:scale-[1.01]' : '',
              )}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
                boxShadow: isGenerating || !command.trim()
                  ? 'none'
                  : '0 4px 24px #8b5cf650, 0 2px 8px #ec489930',
              }}
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" />Gerando conteúdo...</>
              ) : (
                <><Wand2 className="size-4" />Gerar conteúdo</>
              )}
            </button>

            {/* Retry on error */}
            {lastError && !isGenerating && !result && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3">
                <p className="text-xs text-destructive mb-2">{lastError}</p>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!command.trim()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-destructive/40 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="size-3" />
                  Tentar novamente
                </button>
              </div>
            )}

          </div>
        </div>{/* end hidden wrapper */}
      </aside>

      {/* ══════════════ RIGHT COLUMN — Preview ══════════════ */}
      <PreviewPanel
        format={format}
        isGenerating={isGenerating}
        stepperStep={stepperStep}
        renderProgress={renderProgress}
        result={result}
        onRefine={handleRefine}
        onNew={handleNew}
      />

    </div>
  )
}
