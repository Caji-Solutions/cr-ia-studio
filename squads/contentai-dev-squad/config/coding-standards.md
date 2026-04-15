# Coding Standards — ContentAI Studio

## Estrutura de Arquivos

- **Server Components** por padrão; `"use client"` apenas quando necessário
- **Route Handlers** em `src/app/api/{recurso}/route.ts`
- **Componentes de UI** em `src/components/{dominio}/`
- **Lógica de negócio** em `src/lib/`, nunca em componentes

## TypeScript

- Tipar tudo — sem `any` sem justificativa
- Interfaces para shapes de objeto; types para unions/primitivos
- Exportar tipos de `src/types/` quando compartilhados entre módulos
- Zod para validação de dados externos (resposta de API, input de formulário)

## Componentes React

- Nomes em PascalCase para componentes, camelCase para funções/variáveis
- Props interface declarada acima do componente
- `cn()` para condicionais de className — nunca template string
- Não modificar arquivos em `src/components/ui/` — adicionar via `npx shadcn-ui add`

## Integração Gemini

- Todo acesso ao Gemini passa por `callGemini()` em `src/lib/ai/claude-client.ts`
- Cada formato tem seu próprio generator em `src/lib/ai/generators/`
- System prompt e user message sempre separados
- Resposta sempre parseada com Zod antes de usar
- Tratar `GeminiError` com código específico (RATE_LIMIT, INVALID_API_KEY, etc.)

## Banco de Dados (SQLite)

- Queries síncronas com `better-sqlite3` — sem async/await para DB
- `getDb()` de `src/lib/db/index.ts` — nunca instanciar diretamente
- Parâmetros sempre via placeholders (`?`) — nunca interpolação de string
- `parseProject()` para normalizar dados de projeto antes de retornar ao cliente

## Tratamento de Erros

- Route Handlers: retornar `NextResponse.json({ error: msg }, { status: N })`
- Client Components: `toast.error()` com descrição útil ao usuário
- Erros de API Gemini: usar `GeminiError.code` para customizar mensagem
- Não expor stack traces para o cliente

## UI / Strings

- Toda string visível ao usuário em **pt-BR**
- Mensagens de erro descritivas — orientar o usuário para a solução
- Loading states sempre visíveis durante operações assíncronas
