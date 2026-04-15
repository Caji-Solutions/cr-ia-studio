import { NextRequest, NextResponse } from 'next/server'
import { saveLogo } from '@/lib/storage/local'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 })

  const ext    = file.name.split('.').pop() ?? 'png'
  const name   = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const url    = await saveLogo(buffer, name)

  return NextResponse.json({ url })
}
