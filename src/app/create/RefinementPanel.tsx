'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Loader2, RotateCcw, Undo2, Bot, User, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { GenerateResult } from './PreviewPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

// ─── Chips ────────────────────────────────────────────────────────────────────

const CHIPS = ['Mais formal', 'Mais curto', 'Mudar hook', 'Trocar cores', 'Mais dinâmico']

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RefinementPanelProps {
  result:              GenerateResult
  canUndo:             boolean
  onRefined:           (newResult: GenerateResult) => void
  onVideoRefinePending:(projectId: string) => void
  onUndo:              (revertedResult: GenerateResult) => void
  onCancel:            () => void
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ role, text }: ChatMessage) {
  const isUser = role === 'user'
  return (
    <div className={cn('flex gap-2 items-end', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={cn(
        'size-6 rounded-full flex items-center justify-center shrink-0',
        isUser ? 'bg-violet-600' : 'bg-muted',
      )}>
        {isUser
          ? <User className="size-3 text-white" />
          : <Bot  className="size-3 text-foreground" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        'max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed',
        isUser
          ? 'bg-violet-600 text-white rounded-br-sm'
          : 'bg-muted text-foreground rounded-bl-sm',
      )}>
        {text}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RefinementPanel({
  result,
  canUndo,
  onRefined,
  onVideoRefinePending,
  onUndo,
  onCancel,
}: RefinementPanelProps) {
  const [history,   setHistory]   = useState<ChatMessage[]>([])
  const [input,     setInput]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUndoing, setIsUndoing] = useState(false)

  const chatEndRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isVideo = result.format === 'video_16_9' || result.format === 'video_9_16'

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleChip = (chip: string) => {
    setInput((prev) => prev.trim() ? `${prev.trimEnd()}, ${chip}` : chip)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    const instruction = input.trim()
    if (!instruction || isLoading) return

    setHistory((h) => [...h, { role: 'user', text: instruction }])
    setInput('')
    setIsLoading(true)

    try {
      const res  = await fetch('/api/refine', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: result.project.id, instruction }),
      })
      const data = await res.json()

      if (!res.ok) {
        setHistory((h) => [...h, { role: 'ai', text: `Erro: ${data.error ?? 'Falha no refinamento'}` }])
        return
      }

      const summary = String(data.summary ?? 'Conteúdo atualizado.')
      setHistory((h) => [...h, { role: 'ai', text: summary }])

      if (res.status === 202) {
        // Vídeo: render assíncrono — inicia polling no pai
        onVideoRefinePending(data.project.id as string)
        toast.info('Refinamento de vídeo iniciado — aguarde ~1-3 minutos para o re-render.')
      } else {
        const newResult: GenerateResult = {
          project:   data.project,
          content:   data.content,
          slideUrls: (data.slideUrls as string[] | undefined) ?? result.slideUrls,
          format:    result.format,
        }
        onRefined(newResult)
        toast.success('Refinamento aplicado!')
      }
    } catch {
      setHistory((h) => [...h, { role: 'ai', text: 'Erro de conexão. Tente novamente.' }])
      toast.error('Falha no refinamento')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUndo = async () => {
    if (!canUndo || isUndoing) return
    setIsUndoing(true)
    try {
      const res  = await fetch('/api/refine/undo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ projectId: result.project.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao desfazer')
        return
      }

      setHistory([])

      const revertedResult: GenerateResult = {
        project:   data.project,
        content:   data.content,
        slideUrls: (data.slideUrls as string[] | undefined) ?? [],
        format:    result.format,
      }
      onUndo(revertedResult)
      toast.success('Refinamento desfeito')
    } catch {
      toast.error('Erro ao desfazer')
    } finally {
      setIsUndoing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="p-5">
      <Card className="gap-0">

        {/* ── Header ── */}
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <RotateCcw className="size-4 text-violet-500" />
              Refinar Conteúdo
            </CardTitle>

            <div className="flex items-center gap-1">
              {/* Desfazer */}
              {canUndo && (
                <button
                  onClick={handleUndo}
                  disabled={isUndoing || isLoading}
                  className={cn(
                    'flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium',
                    'border border-border text-muted-foreground',
                    'hover:bg-muted hover:text-foreground transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                  title="Desfazer último refinamento"
                >
                  {isUndoing
                    ? <Loader2 className="size-3 animate-spin" />
                    : <Undo2   className="size-3" />}
                  Desfazer
                </button>
              )}

              {/* Fechar */}
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="size-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground truncate mt-0.5" title={result.project.title}>
            <span className="text-foreground font-medium">Projeto:</span> {result.project.title}
          </p>
        </CardHeader>

        <CardContent className="pt-3 flex flex-col gap-3">

          {/* Aviso para vídeo */}
          {isVideo && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2">
              <Clock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                Refinamentos de vídeo levam ~1-3 minutos para re-renderizar.
              </p>
            </div>
          )}

          {/* Histórico de chat */}
          {history.length > 0 && (
            <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto pr-1 py-1">
              {history.map((msg, i) => (
                <ChatBubble key={i} role={msg.role} text={msg.text} />
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex gap-2 items-end">
                  <div className="size-6 rounded-full flex items-center justify-center bg-muted shrink-0">
                    <Bot className="size-3 text-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5">
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}

          {/* Chips rápidos */}
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChip(chip)}
                disabled={isLoading}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                  'disabled:pointer-events-none disabled:opacity-50',
                  input.includes(chip)
                    ? 'border-violet-500 text-violet-600 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-border text-muted-foreground hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20',
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              rows={3}
              placeholder="O que você quer mudar? (Enter para enviar)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="resize-none text-sm leading-relaxed pr-11"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className={cn(
                'absolute right-2.5 bottom-2.5 size-7 flex items-center justify-center rounded-lg transition-all',
                'bg-violet-600 text-white hover:bg-violet-500',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              {isLoading
                ? <Loader2  className="size-3.5 animate-spin" />
                : <Sparkles className="size-3.5" />}
            </button>
          </div>

          {/* Fechar painel */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={cn(
              'flex w-full items-center justify-center h-8 rounded-lg text-xs font-medium border border-border',
              'text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            Fechar painel
          </button>

        </CardContent>
      </Card>
    </div>
  )
}
