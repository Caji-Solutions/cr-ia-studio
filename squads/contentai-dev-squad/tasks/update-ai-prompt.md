---
task: Update AI Prompt
responsavel: "@content-dev"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - format: Formato alvo (carousel, post, story, caption, video_16_9, video_9_16)
  - problem: Descrição do problema com o prompt atual
  - expected_output: Exemplo do output desejado
Saida: |
  - updated_prompt: Prompt atualizado em src/lib/ai/prompts/{format}.ts
  - test_result: Resultado de teste com a nova versão
Checklist:
  - "[ ] Ler prompt atual em src/lib/ai/prompts/{format}.ts"
  - "[ ] Ler schema Zod esperado em src/types/content.ts"
  - "[ ] Identificar causa do problema (instrução ausente, formato errado, ambiguidade)"
  - "[ ] Escrever nova versão do prompt"
  - "[ ] Verificar que o prompt instrui retorno JSON puro (sem markdown)"
  - "[ ] Verificar alinhamento entre campos do prompt e schema Zod"
  - "[ ] Documentar mudança no cabeçalho do arquivo de prompt"
---

# *update-prompt — Atualizar Prompt de Geração

Atualiza o prompt de um formato existente para corrigir problemas de qualidade, parsing ou estrutura.

## Elicitação

```
? Qual formato precisa ser atualizado?
  1. carousel
  2. post
  3. story
  4. caption
  5. video_16_9
  6. video_9_16
> 1

? Qual é o problema com o output atual?
> As legendas dos slides estão muito longas, ultrapassando o limite de caracteres

? Tem exemplo de como deveria ser?
> Máximo 80 caracteres por legenda, direto ao ponto
```

## Diagnóstico de Problemas Comuns

| Problema | Causa Provável | Fix |
|----------|---------------|-----|
| JSON inválido | Modelo envolve em ```json | Adicionar instrução "retorne JSON puro, sem markdown" |
| Campo ausente | Não mencionado no prompt | Adicionar ao system prompt com exemplo |
| Campo errado | Ambiguidade no nome | Renomear no prompt + schema |
| Texto muito longo | Sem limite explícito | Adicionar restrição de caracteres no prompt |
| Idioma errado | Sem instrução de idioma | Adicionar "responda em português brasileiro" |
| Formato inconsistente | Instrução vaga | Adicionar exemplo JSON no prompt |

## Boas Práticas de Prompt

```
✅ FAÇA:
- Instruir retorno JSON puro explicitamente
- Incluir exemplo da estrutura esperada no system prompt
- Especificar limites (max chars, max items)
- Pedir conteúdo em pt-BR explicitamente
- Usar system prompt para regras, user message para conteúdo

❌ EVITE:
- Prompts muito longos sem estrutura clara
- Campos ambíguos que o modelo pode interpretar diferente
- Pedir múltiplas coisas na mesma instrução
- Deixar o modelo livre para "formatar como quiser"
```

## Estrutura Padrão de Prompt

```typescript
export function composeXxxPrompt(brandKit: BrandKit | null, command: string, options?: ...) {
  const tone = brandKit?.tone_of_voice ?? 'profissional e direto'
  const colors = brandKit?.colors ?? {}

  const systemPrompt = `
Você é um especialista em criação de conteúdo para redes sociais em português brasileiro.

FORMATO DE SAÍDA: Retorne APENAS JSON válido, sem markdown, sem explicações.

ESTRUTURA EXATA:
{
  "campo1": "string (máx X chars)",
  "campo2": ["array de strings"],
  ...
}

TOM: ${tone}
`.trim()

  const userMessage = `Crie ${formatName} sobre: ${command}`

  return { systemPrompt, userMessage }
}
```

## Relacionado

- **Agent:** @content-dev (Luma)
- **Task relacionada:** add-content-format.md
- **Arquivos de prompt:** `src/lib/ai/prompts/`
