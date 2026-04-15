'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import type { ProjectFormat } from '@/types/database'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Key, Sliders, Loader2, Eye, EyeOff,
  CheckCircle2, XCircle, RefreshCw, Sun, Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chaves de API e preferências da interface.
        </p>
      </div>

      <Tabs defaultValue="apikeys">
        <TabsList className="mb-6 w-full grid grid-cols-2">
          <TabsTrigger value="apikeys" className="gap-1.5">
            <Key  className="size-3.5" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="prefs"   className="gap-1.5">
            <Sliders className="size-3.5" /> Preferências
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: API Keys ─────────────────────────────────────────────────────── */}
        <TabsContent value="apikeys" className="space-y-6">

          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-900/20 px-4 py-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              As chaves são definidas no arquivo <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">.env.local</code> na raiz do projeto.
              Use o campo abaixo para testar uma chave antes de configurá-la.
            </p>
          </div>

          {/* Gemini */}
          <ApiKeyField
            label="Google Gemini"
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

          {/* OpenAI — campo mantido para compatibilidade mas imagens usam Imagen 3 */}
          <ApiKeyField
            label="OpenAI (opcional, legado)"
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

        </TabsContent>

        {/* ── Tab: Preferências ────────────────────────────────────────────────── */}
        <TabsContent value="prefs" className="space-y-6">

          {/* Dark mode */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="size-4 text-muted-foreground" /> : <Sun className="size-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Modo escuro</p>
                <p className="text-xs text-muted-foreground">Alterna o tema da interface</p>
              </div>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleDarkMode} />
          </div>

          {/* Default format */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Formato padrão
            </label>
            <p className="text-xs text-muted-foreground">
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

          <Button onClick={savePreferences} className="w-full sm:w-auto">
            Salvar Preferências
          </Button>

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
        <label className="text-sm font-medium">{label}</label>
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
