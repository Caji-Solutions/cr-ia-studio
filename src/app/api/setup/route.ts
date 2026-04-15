/**
 * POST /api/setup
 *
 * Escreve o arquivo .env.local com a chave do Gemini.
 * Funciona APENAS em modo development — nunca em produção.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Setup apenas disponível em desenvolvimento' }, { status: 403 })
  }

  let body: { geminiKey?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { geminiKey } = body

  if (!geminiKey?.trim()) {
    return NextResponse.json({ error: 'Chave Gemini obrigatória' }, { status: 400 })
  }

  const envContent = `# ContentAI Studio — gerado automaticamente via /setup
# NÃO commite este arquivo no git

# Gemini — geração de texto (Gemini 2.0 Flash) + imagens (Imagen 3)
GEMINI_API_KEY=${geminiKey.trim()}
`

  const envPath = path.join(process.cwd(), '.env.local')
  await fs.writeFile(envPath, envContent, 'utf-8')

  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json({
    geminiKey:  !!process.env.GEMINI_API_KEY,
    configured: !!process.env.GEMINI_API_KEY,
  })
}
