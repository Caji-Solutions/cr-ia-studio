'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import type { ProjectFormat } from '@/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Key, Sliders, Loader2, Eye, EyeOff,
  CheckCircle2, XCircle, RefreshCw, Sun, Moon, Sparkles,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyState {
  value:       string
  showValue:   boolean
  testStatus:  'idle' | 'testing' | 'valid' | 'invalid'
  testMessage: string
}

interface EnvStatus {
  gemini: boolean
  openai: boolean
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

const ALL_FORMATS: ProjectFormat[] = ['carousel', 'post', 'story', 'video_16_9', 'video_9_16', 'caption']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  // ── API keys state ───────────────────────────────────────────────────────────
  const [envStatus,  setEnvStatus]  = useState<EnvStatus | null>(null)
  const [gemini,     setGemini]     = useState<ApiKeyState>({ value: '', showValue: false, testStatus: 'idle', testMessage: '' })
  const [openai,     setOpenai]     = useState<ApiKeyState>({ value: '', showValue: false, testStatus: 'idle', testMessage: '' })

  // ── Preferences state ────────────────────────────────────────────────────────
  const [defaultFormat, setDefaultFormat] = useState<ProjectFormat>('carousel')

  // ── Load env status ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/setup')
      .then(r => r.json())
      .then((data: { geminiKey: boolean; openaiKey: boolean }) =>
        setEnvStatus({ gemini: data.geminiKey, openai: data.openaiKey })
      )
      .catch(() => {})

    const savedFormat = localStorage.getItem('default-format') as ProjectFormat | null
    if (savedFormat && ALL_FORMATS.includes(savedFormat)) setDefaultFormat(savedFormat)
  }, [])

  // ── Test API key ─────────────────────────────────────────────────────────────
  const testKey = async (provider: 'gemini' | 'openai') => {
    const state    = provider === 'gemini' ? gemini : openai
    const setState = provider === 'gemini' ? setGemini : setOpenai

    setState(prev => ({ ...prev, testStatus: 'testing', testMessage: '' }))

    try {
      const res = await fetch('/api/settings/test-key', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ provider, key: state.value.trim() || undefined }),
      })
      const data = await res.json()
      setState(prev => ({
        ...prev,
        testStatus:  data.valid ? 'valid' : 'invalid',
        testMessage: data.message ?? '',
      }))
    } catch {
      setState(prev => ({ ...prev, testStatus: 'invalid', testMessage: 'Erro de conexão' }))
    }
  }

  // ── Dark mode toggle ─────────────────────────────────────────────────────────
  const isDark = theme === 'dark'
  const toggleDarkMode = (enabled: boolean) => setTheme(enabled ? 'dark' : 'light')

  // ── Save preferences ─────────────────────────────────────────────────────────
  const savePreferences = () => {
    localStorage.setItem('default-format', defaultFormat)
    toast.success('Preferências salvas')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-10 relative animate-section animate-section-1">
        {/* Decorative glow */}
        <div
          className="absolute -top-4 -left-4 w-52 h-24 rounded-full pointer-events-none opacity-[0.14] blur-3xl"
          style={{ background: 'linear-gradient(135deg, hsl(27 90% 57%), hsl(258 55% 56%))' }}
        />
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary opacity-70" />
          <span className="text-xs font-medium text-primary/70 uppercase tracking-widest">Painel de Controle</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground font-display">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Chaves de API e preferências da interface.
        </p>
      </div>

      <Tabs defaultValue="apikeys">
        <TabsList className="mb-6 w-full grid grid-cols-2 rounded-xl p-1 animate-section animate-section-2">
          <TabsTrigger value="apikeys" className="gap-1.5 rounded-lg">
            <Key className="size-3.5" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="prefs" className="gap-1.5 rounded-lg">
            <Sliders className="size-3.5" /> Preferências
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: API Keys ─────────────────────────────────────────────────────── */}
        <TabsContent value="apikeys" className="space-y-5 animate-section animate-section-3">

          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800/40 dark:from-blue-900/20 dark:to-indigo-900/20 px-4 py-3.5">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              As chaves são definidas no arquivo{' '}
              <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-md">.env.local</code>{' '}
              na raiz do projeto. Use o campo abaixo para testar uma chave antes de configurá-la.
            </p>
          </div>

          {/* Gemini */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2"
              style={{ background: 'linear-gradient(90deg, hsl(258 55% 56% / 0.06), transparent)' }}
            >
              <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4285f4, #0f9d58)' }}>
                <Key className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">Google Gemini</span>
            </div>
            <div className="p-4">
              <ApiKeyField
                label=""
                placeholder="AIza... (para testar)"
                hint={
                  envStatus === null
                    ? 'Verificando...'
                    : envStatus.gemini
                      ? 'GEMINI_API_KEY configurada no .env.local'
                      : 'GEMINI_API_KEY não encontrada no .env.local — necessária para gerar conteúdo'
                }
                configured={envStatus?.gemini ?? null}
                state={gemini}
                onChange={v => setGemini(prev => ({ ...prev, value: v, testStatus: 'idle', testMessage: '' }))}
                onToggleShow={() => setGemini(prev => ({ ...prev, showValue: !prev.showValue }))}
                onTest={() => testKey('gemini')}
              />
            </div>
          </div>

          {/* OpenAI — campo mantido para compatibilidade mas imagens usam Imagen 3 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2"
              style={{ background: 'linear-gradient(90deg, hsl(27 90% 57% / 0.06), transparent)' }}
            >
              <div className="size-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10a37f, #1a7f64)' }}>
                <Key className="size-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">OpenAI</span>
              <span className="text-xs text-muted-foreground ml-1">(opcional, legado)</span>
            </div>
            <div className="p-4">
              <ApiKeyField
                label=""
                placeholder="sk-... (para testar)"
                hint={
                  envStatus === null
                    ? 'Verificando...'
                    : envStatus.openai
                      ? 'OPENAI_API_KEY configurada no .env.local'
                      : 'OPENAI_API_KEY não encontrada — não necessária, imagens geradas pelo Imagen 3 (Google)'
                }
                configured={envStatus?.openai ?? null}
                state={openai}
                onChange={v => setOpenai(prev => ({ ...prev, value: v, testStatus: 'idle', testMessage: '' }))}
                onToggleShow={() => setOpenai(prev => ({ ...prev, showValue: !prev.showValue }))}
                onTest={() => testKey('openai')}
              />
            </div>
          </div>

        </TabsContent>

        {/* ── Tab: Preferências ────────────────────────────────────────────────── */}
        <TabsContent value="prefs" className="space-y-4 animate-section animate-section-3">

          {/* Dark mode */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-xl flex items-center justify-center"
                style={{ background: isDark
                  ? 'linear-gradient(135deg, hsl(258 55% 56% / 0.2), hsl(220 70% 58% / 0.2))'
                  : 'linear-gradient(135deg, hsl(50 85% 55% / 0.2), hsl(27 90% 57% / 0.2))'
                }}
              >
                {isDark
                  ? <Moon className="size-4 text-violet-400" />
                  : <Sun className="size-4 text-amber-500" />
                }
              </div>
              <div>
                <p className="text-sm font-medium">Modo escuro</p>
                <p className="text-xs text-muted-foreground">Alterna o tema da interface</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
          </div>

          {/* Default format */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <label className="text-sm font-medium block mb-0.5">
              Formato padrão
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Formato pré-selecionado ao criar um novo projeto.
            </p>
            <Select value={defaultFormat} onValueChange={v => setDefaultFormat(v as ProjectFormat)}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_FORMATS.map(f => (
                  <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={savePreferences}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 hover:scale-[1.02] transition-all duration-200"
            style={{ background: 'linear-gradient(135deg,#f97316,#8b5cf6)', boxShadow: '0 4px 20px #f9731640' }}
          >
            Salvar Preferências
          </button>

        </TabsContent>
      </Tabs>

    </div>
  )
}

// ─── ApiKeyField component ────────────────────────────────────────────────────

interface ApiKeyFieldProps {
  label:        string
  placeholder:  string
  hint:         string
  configured:   boolean | null
  state:        ApiKeyState
  onChange:     (v: string) => void
  onToggleShow: () => void
  onTest:       () => void
}

function ApiKeyField({ label, placeholder, hint, configured, state, onChange, onToggleShow, onTest }: ApiKeyFieldProps) {
  const canTest   = state.value.trim().length > 0 || configured === true
  const isTesting = state.testStatus === 'testing'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {label && <label className="text-sm font-medium">{label}</label>}
        {configured !== null && (
          configured
            ? <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="size-3.5" /> Configurada</span>
            : <span className="flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="size-3.5" /> Não configurada</span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={state.showValue ? 'text' : 'password'}
            value={state.value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="pr-9 font-mono text-sm"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {state.showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <button
          type="button"
          onClick={onTest}
          disabled={isTesting || !canTest}
          className={cn(
            'flex items-center gap-1.5 h-9 px-3 rounded-md text-xs font-medium border transition-colors',
            'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
          title="Testar conexão"
        >
          {isTesting
            ? <Loader2 className="size-3.5 animate-spin" />
            : <RefreshCw className="size-3.5" />}
          Testar
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{hint}</p>

      {state.testMessage && state.testStatus !== 'testing' && (
        <p className={cn(
          'text-xs',
          state.testStatus === 'valid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
        )}>
          {state.testMessage}
        </p>
      )}
    </div>
  )
}
