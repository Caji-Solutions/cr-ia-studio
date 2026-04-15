/**
 * POST /api/settings/test-key
 *
 * Testa a validade de uma chave de API (Gemini ou OpenAI).
 *
 * Body: { provider: 'gemini' | 'openai'; key?: string }
 *
 * Se `key` não for fornecida, usa a chave do .env.local.
 */

import { NextRequest, NextResponse } from 'next/server'

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

export async function POST(request: NextRequest) {
  let body: { provider: 'gemini' | 'openai'; key?: string }
  try {
    body = await request.json()
  } catch {
    return fail('Body JSON inválido', 400)
  }

  const { provider, key: providedKey } = body
  if (!provider || !['gemini', 'openai'].includes(provider)) {
    return fail('provider inválido', 400)
  }

  const apiKey = (providedKey?.trim())
    || (provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY)
    || undefined

  if (!apiKey) {
    return NextResponse.json({ valid: false, message: 'Nenhuma chave configurada para testar' })
  }

  try {
    if (provider === 'gemini') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      )
      if (res.ok) {
        return NextResponse.json({ valid: true, message: 'Conexão bem-sucedida ✓' })
      }
      const data = await res.json().catch(() => ({}))
      const msg = (data as { error?: { message?: string } })?.error?.message ?? 'Chave inválida ou sem permissão'
      return NextResponse.json({ valid: false, message: msg })
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      if (res.ok) {
        return NextResponse.json({ valid: true, message: 'Conexão bem-sucedida ✓' })
      }
      const data = await res.json().catch(() => ({}))
      const msg = (data as { error?: { message?: string } })?.error?.message ?? 'Chave inválida ou sem permissão'
      return NextResponse.json({ valid: false, message: msg })
    }
  } catch {
    return NextResponse.json({ valid: false, message: 'Erro de rede ao testar a chave' })
  }

  return fail('Provider inválido', 400)
}
