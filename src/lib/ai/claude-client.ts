import { GoogleGenerativeAI, GoogleGenerativeAIError } from '@google/generative-ai'

const MODEL              = 'gemini-2.0-flash'
const MAX_TOKENS         = 4096
const TEMPERATURE        = 0.7
const MAX_RETRIES        = 2
const RATE_LIMIT_DELAY   = 62_000  // 62s — Gemini reseta o RPM a cada 60s

export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_API_KEY' | 'RATE_LIMIT' | 'PARSE_ERROR' | 'API_ERROR' | 'TIMEOUT',
    public readonly status?: number,
    public readonly retryable: boolean = false
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}


function classifyError(err: unknown): GeminiError {
  if (err instanceof GeminiError) return err

  const msg = err instanceof Error ? err.message : String(err)

  if (err instanceof GoogleGenerativeAIError) {
    if (msg.includes('API_KEY_INVALID') || msg.includes('401')) {
      return new GeminiError('API key inválida. Verifique a chave em aistudio.google.com/app/apikey.', 'INVALID_API_KEY', 401, false)
    }
    if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
      return new GeminiError(
        'Sem permissão para usar esta API. Verifique se o billing está ativo no projeto Google Cloud e se a Generative Language API está habilitada em console.cloud.google.com.',
        'INVALID_API_KEY', 403, false
      )
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      // Detecta se é cota do plano gratuito (free tier) — mesmo com billing ativo no projeto,
      // a quota do Google AI Studio pode estar no tier gratuito se o projeto não foi migrado.
      if (msg.includes('free_tier') || msg.includes('Free Tier')) {
        return new GeminiError(
          'Cota do plano gratuito do Gemini esgotada. Sua chave de API ainda está no tier gratuito. Acesse console.cloud.google.com → API & Services → Gemini API → Quotas e ative o plano pago (Pay-as-you-go) para o projeto.',
          'RATE_LIMIT', 429, false
        )
      }
      // Limite diário (RPD) — não adianta aguardar minutos
      if (msg.includes('per_day') || msg.includes('daily') || msg.includes('DAILY')) {
        return new GeminiError(
          'Limite diário da API Gemini atingido. Aguarde a reinicialização (meia-noite horário do servidor) ou verifique suas cotas em console.cloud.google.com.',
          'RATE_LIMIT', 429, false
        )
      }
      // Limite por minuto (RPM) — retentável após espera
      return new GeminiError('Rate limit por minuto atingido. Aguardando reset...', 'RATE_LIMIT', 429, true)
    }
    const retryable = msg.includes('500') || msg.includes('503')
    return new GeminiError(`Erro da API Gemini: ${msg}`, 'API_ERROR', undefined, retryable)
  }

  return new GeminiError(
    `Erro inesperado: ${msg}`,
    'API_ERROR',
    undefined,
    false
  )
}

export async function callGemini<T = unknown>(
  systemPrompt: string,
  userMessage:  string,
  apiKey:       string
): Promise<T> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model:             MODEL,
    systemInstruction: systemPrompt,
  })

  let lastError: GeminiError | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent({
        contents:         [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: TEMPERATURE },
      })

      // Verifica bloqueio por safety filter antes de tentar ler o texto
      const candidate = result.response.candidates?.[0]
      if (candidate?.finishReason === 'SAFETY') {
        throw new GeminiError(
          'Conteúdo bloqueado pelos filtros de segurança do Gemini. Tente reformular o prompt.',
          'API_ERROR',
          undefined,
          false
        )
      }

      const raw = result.response.text().trim()

      if (!raw) {
        throw new GeminiError(
          'Gemini retornou resposta vazia. Tente novamente ou reformule o prompt.',
          'API_ERROR',
          undefined,
          attempt < MAX_RETRIES
        )
      }

      // Strip markdown code fences se presentes
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

      try {
        return JSON.parse(cleaned) as T
      } catch {
        throw new GeminiError(
          `Resposta não é JSON válido: ${cleaned.slice(0, 200)}`,
          'PARSE_ERROR',
          undefined,
          false
        )
      }
    } catch (err) {
      lastError = classifyError(err)

      if (!lastError.retryable || attempt === MAX_RETRIES) break

      // Para rate limit usa delay longo (Gemini reseta em 60s); demais erros: 2s, 4s
      const delay = lastError.code === 'RATE_LIMIT'
        ? RATE_LIMIT_DELAY
        : 2000 * (attempt + 1)
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw lastError!
}
