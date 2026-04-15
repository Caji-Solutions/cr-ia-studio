'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
      <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold">Algo deu errado</h2>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
          Ocorreu um erro inesperado. Tente novamente ou volte ao dashboard.
        </p>
        {error.message && (
          <p className="mt-3 text-xs text-muted-foreground/70 font-mono bg-muted px-3 py-1.5 rounded max-w-md mx-auto truncate">
            {error.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Ir ao Dashboard
        </Link>
      </div>
    </div>
  )
}
