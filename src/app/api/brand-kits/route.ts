import { NextRequest, NextResponse } from 'next/server'
import { getDb, uuid } from '@/lib/db'

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

export async function GET() {
  const db   = getDb()
  const rows = db.prepare(`SELECT * FROM brand_kits ORDER BY created_at DESC`).all()
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return fail('JSON inválido', 400) }

  const { name, primary_color, secondary_color, accent_color, font_title, font_body, tone_of_voice, logo_url, is_default } = body

  if (!name || typeof name !== 'string') return fail('name obrigatório', 400)

  const db = getDb()
  const id = uuid()

  if (is_default) {
    db.prepare(`UPDATE brand_kits SET is_default = 0`).run()
  }

  db.prepare(`
    INSERT INTO brand_kits (id, name, primary_color, secondary_color, accent_color, font_title, font_body, tone_of_voice, logo_url, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, primary_color ?? null, secondary_color ?? null, accent_color ?? null, font_title ?? null, font_body ?? null, tone_of_voice ?? null, logo_url ?? null, is_default ? 1 : 0)

  const row = db.prepare(`SELECT * FROM brand_kits WHERE id = ?`).get(id)
  return NextResponse.json(row, { status: 201 })
}
