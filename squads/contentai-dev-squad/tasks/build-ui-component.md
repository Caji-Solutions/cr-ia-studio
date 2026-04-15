---
task: Build UI Component
responsavel: "@frontend-dev"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - component_name: Nome do componente (PascalCase)
  - component_type: client | server
  - location: Pasta em src/components/ ou src/app/
  - description: O que o componente faz
  - props: Props esperadas (opcional)
Saida: |
  - component_file: Arquivo TSX criado
  - export: Named ou default export configurado
Checklist:
  - "[ ] Verificar se shadcn/ui já tem o componente necessário"
  - "[ ] Definir se é Client ou Server Component"
  - "[ ] Criar arquivo na pasta correta"
  - "[ ] Tipar todas as props com interface TypeScript"
  - "[ ] Usar cn() para classes condicionais"
  - "[ ] Usar tokens CSS (hsl(var(--...))) para cores"
  - "[ ] Strings visíveis em pt-BR"
  - "[ ] Verificar responsividade (mobile-first)"
  - "[ ] Exportar corretamente (named ou default)"
---

# *build-component — Construir Componente UI

Cria um novo componente React seguindo os padrões do ContentAI Studio.

## Elicitação

```
? Nome do componente (PascalCase):
> ProjectCard

? Tipo:
  1. Client Component (interativo, usa hooks/state)
  2. Server Component (dados estáticos ou server-fetched)
> 1

? Localização:
  1. src/components/dashboard/
  2. src/components/brand-kit/
  3. src/components/layout/
  4. src/components/ui/ (apenas via shadcn-ui add!)
  5. Outra pasta
> 1

? Descrição do componente:
> Card que exibe um projeto com título, formato e status
```

## Template — Client Component

```tsx
"use client"

import { cn } from '@/lib/utils'

interface ProjectCardProps {
  title: string
  format: string
  status: 'draft' | 'generating' | 'ready' | 'error'
  className?: string
  onClick?: () => void
}

export function ProjectCard({ title, format, status, className, onClick }: ProjectCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4 cursor-pointer hover:border-primary transition-colors",
        status === 'error' && "border-destructive",
        className
      )}
      onClick={onClick}
    >
      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{format}</p>
    </div>
  )
}
```

## Template — Server Component

```tsx
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number
  className?: string
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className={cn("rounded-lg bg-card border p-6", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  )
}
```

## Regras

| Situação | Ação |
|----------|------|
| Precisa de useState, useEffect, onClick | `"use client"` obrigatório |
| Só exibe dados | Server Component (sem diretiva) |
| Precisa de Input, Select, Dialog | `"use client"` + shadcn/ui |
| Precisa de cor customizada | Token CSS `hsl(var(--cor))` |
| Classe condicional | `cn("base", condicao && "extra")` |

## Componentes shadcn/ui disponíveis

```
Avatar, Badge, Card, Dialog, DropdownMenu, Input,
ScrollArea, Select, Separator, Skeleton, Sonner,
Switch, Tabs, Textarea, Tooltip
```

Para adicionar novo: `npx shadcn-ui add <nome>` — nunca editar manualmente.

## Relacionado

- **Agent:** @frontend-dev (Finn)
- **Globals:** `src/app/globals.css` (tokens CSS)
- **Utils:** `src/lib/utils.ts` (cn())
