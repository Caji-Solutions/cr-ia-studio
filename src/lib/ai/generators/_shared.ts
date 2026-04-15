import { z } from 'zod'
import { callGemini, GeminiError } from '@/lib/ai/claude-client'

const VALIDATION_RETRIES = 2

export async function callAndValidate<T>(
  schema: z.ZodType<T>,
  systemPrompt: string,
  userMessage: string,
  apiKey: string
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= VALIDATION_RETRIES; attempt++) {
    let raw: unknown
    try {
      raw = await callGemini<unknown>(systemPrompt, userMessage, apiKey)
    } catch (err) {
      // Erros da API (rate limit, auth, etc.) não devem ser repetidos aqui —
      // o callGemini já tratou os retries internos. Propaga imediatamente.
      throw err
    }

    const result = schema.safeParse(raw)
    if (result.success) return result.data

    lastError = new GeminiError(
      `JSON inválido (tentativa ${attempt + 1}): ${result.error.message}`,
      'PARSE_ERROR',
      undefined,
      false
    )
  }

  throw lastError!
}
