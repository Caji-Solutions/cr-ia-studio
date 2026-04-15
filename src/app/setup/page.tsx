'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'

export default function SetupPage() {
  const [geminiKey, setGeminiKey]   = useState('')
  const [showKey,   setShowKey]     = useState(false)
  const [loading,   setLoading]     = useState(false)
  const [error,     setError]       = useState<string | null>(null)
  const [done,      setDone]        = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res  = await fetch('/api/setup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ geminiKey }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao salvar configurações')
        return
      }

      setDone(true)
      setTimeout(() => window.location.replace('/'), 2500)
    } catch {
      setError('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold">Configurado com sucesso!</h2>
          <p className="text-muted-foreground text-sm">
            O arquivo <code className="font-mono bg-muted px-1.5 py-0.5 rounded">.env.local</code> foi criado.<br />
            Reiniciando o servidor e redirecionando...
          </p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center space-y-2">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Configurar ContentAI Studio</h1>
          <p className="text-sm text-muted-foreground">
            Adicione sua chave do Google Gemini para começar a gerar conteúdo.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">Como obter a chave Gemini</p>
          <p>Acesse <strong>aistudio.google.com/app/apikey</strong>, crie um projeto e copie a API Key.</p>
          <p>A chave cobre geração de texto (Gemini 2.0 Flash) e imagens (Imagen 3).</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <XCircle className="size-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !geminiKey.trim()}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            {loading
              ? <><Loader2 className="size-4 animate-spin" />Salvando...</>
              : <><Sparkles className="size-4" />Salvar e iniciar</>
            }
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          A chave é salva em <code className="font-mono bg-muted px-1 py-0.5 rounded">.env.local</code> — apenas no seu computador, nunca no git.
        </p>

      </div>
    </div>
  )
}
