import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-4">Erro 404</p>
        <h1 className="text-3xl font-semibold text-foreground">Página não encontrada</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
          A página que você procura não existe ou foi movida para outro endereço.
        </p>
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
