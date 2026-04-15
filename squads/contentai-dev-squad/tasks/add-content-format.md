---
task: Add Content Format
responsavel: "@content-dev"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - format_id: ID do novo formato (ex: thread, newsletter, email)
  - format_description: Descrição do que o formato deve gerar
  - output_structure: Estrutura de dados esperada na saída
Saida: |
  - generator_path: src/lib/ai/generators/{format}.ts
  - prompt_path: src/lib/ai/prompts/{format}.ts
  - schema_path: Zod schema em src/types/content.ts
  - route_update: Atualização em src/app/api/generate/route.ts
Checklist:
  - "[ ] Definir Zod schema do conteúdo gerado em src/types/content.ts"
  - "[ ] Criar arquivo de prompt em src/lib/ai/prompts/{format}.ts"
  - "[ ] Criar generator em src/lib/ai/generators/{format}.ts"
  - "[ ] Registrar generator no índice src/lib/ai/generators/index.ts"
  - "[ ] Adicionar formato ao tipo ProjectFormat em src/types/database.ts"
  - "[ ] Registrar no selectGenerator() em route.ts"
  - "[ ] Classificar como STATIC_FORMAT ou VIDEO_FORMAT em route.ts"
  - "[ ] Testar geração com comando de teste"
  - "[ ] Verificar parsing Zod sem erros"
---

# *add-format — Adicionar Novo Formato de Geração

Adiciona suporte a um novo formato de conteúdo no pipeline de geração do ContentAI Studio.

## Elicitação

```
? ID do novo formato (kebab-case, ex: thread, newsletter):
> thread

? Descrição do que ele gera:
> Série de posts encadeados para X/Twitter, máx 280 chars cada

? Quantos itens compõem o formato? (ex: posts, slides, frames)
> posts (entre 3 e 10)

? Cada item tem imagem?
> não, apenas texto

? O formato é estático (imagem/texto) ou vídeo?
> estático
```

## Estrutura a Criar

### 1. Schema Zod (`src/types/content.ts`)

```typescript
export const ThreadPostSchema = z.object({
  text: z.string().max(280),
  position: z.number(),
})

export const ThreadContentSchema = z.object({
  topic: z.string(),
  posts: z.array(ThreadPostSchema).min(3).max(10),
  hashtags: z.array(z.string()).optional(),
})

export type ThreadContent = z.infer<typeof ThreadContentSchema>
```

### 2. Prompt (`src/lib/ai/prompts/thread.ts`)

```typescript
import { BrandKit } from '@/lib/api/brand-kits'

export function buildThreadPrompt(brandKit: BrandKit | null, command: string) {
  const systemPrompt = `Você é um especialista em criação de threads para X/Twitter...`
  const userMessage = `Crie uma thread sobre: ${command}`
  return { systemPrompt, userMessage }
}
```

### 3. Generator (`src/lib/ai/generators/thread.ts`)

```typescript
import { callAndValidate } from './_shared'
import { buildThreadPrompt } from '@/lib/ai/prompts/thread'
import { ThreadContentSchema, ThreadContent } from '@/types/content'

export async function generateThread(
  command: string,
  brandKit: BrandKit | null,
  apiKey: string,
): Promise<ThreadContent> {
  const { systemPrompt, userMessage } = buildThreadPrompt(brandKit, command)
  return callAndValidate(ThreadContentSchema, systemPrompt, userMessage, apiKey)
}
```

### 4. Registrar no índice (`src/lib/ai/generators/index.ts`)

```typescript
import { generateThread } from './thread'
// ...adicionar ao selectGenerator()
case 'thread': return generateThread
```

### 5. Atualizar route (`src/app/api/generate/route.ts`)

```typescript
const STATIC_FORMATS: ProjectFormat[] = ['carousel', 'post', 'story', 'caption', 'thread']
```

## Regras

- Prompt deve retornar **JSON puro** — instruir o modelo explicitamente
- Schema Zod deve cobrir todos os campos retornados pelo modelo
- Formatos estáticos: `STATIC_FORMATS[]`; formatos de vídeo: `VIDEO_FORMATS[]`
- Nome do formato deve ser adicionado ao tipo `ProjectFormat` em `src/types/database.ts`

## Relacionado

- **Agent:** @content-dev (Luma)
- **Task relacionada:** update-ai-prompt.md
- **Arquivos principais:** `src/lib/ai/generators/index.ts`, `src/types/content.ts`
