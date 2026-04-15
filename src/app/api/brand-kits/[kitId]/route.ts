import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { deleteProjectFiles } from '@/lib/storage/local'

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

type Ctx = { params: { kitId: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const row = getDb().prepare(`SELECT * FROM brand_kits WHERE id = ?`).get(params.kitId)
  if (!row) return fail('Brand kit não encontrado', 404)
  return NextResponse.json(row)
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return fail('JSON inválido', 400) }

  const db  = getDb()
  const row = db.prepare(`SELECT id FROM brand_kits WHERE id = ?`).get(params.kitId)
  if (!row) return fail('Brand kit não encontrado', 404)

  const fields = ['name', 'primary_color', 'secondary_color', 'accent_color', 'font_title', 'font_body', 'tone_of_voice', 'logo_url', 'is_default']
  const sets: string[] = ["updated_at = datetime('now')"]
  const vals: unknown[] = []

  for (const f of fields) {
    if (f in body) {
      sets.push(`${f} = ?`)
      vals.push(f === 'is_default' ? (body[f] ? 1 : 0) : (body[f] ?? null))
    }
  }

  if (body.is_default) {
    db.prepare(`UPDATE brand_kits SET is_default = 0 WHERE id != ?`).run(params.kitId)
  }

  db.prepare(`UPDATE brand_kits SET ${sets.join(', ')} WHERE id = ?`).run(...vals, params.kitId)
  const updated = db.prepare(`SELECT * FROM brand_kits WHERE id = ?`).get(params.kitId)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const db = getDb()
  // Limpa brand_kit_id dos projetos que usam este kit
  db.prepare(`UPDATE projects SET brand_kit_id = NULL WHERE brand_kit_id = ?`).run(params.kitId)
  db.prepare(`DELETE FROM brand_kits WHERE id = ?`).run(params.kitId)
  await deleteProjectFiles(params.kitId).catch(() => {})
  return NextResponse.json({ success: true })
}

// POST /api/brand-kits/[kitId]/default — atalho para setar como padrão
export async function POST(_req: NextRequest, { params }: Ctx) {
  const db  = getDb()
  const row = db.prepare(`SELECT id FROM brand_kits WHERE id = ?`).get(params.kitId)
  if (!row) return fail('Brand kit não encontrado', 404)
  db.prepare(`UPDATE brand_kits SET is_default = 0`).run()
  db.prepare(`UPDATE brand_kits SET is_default = 1, updated_at = datetime('now') WHERE id = ?`).run(params.kitId)
  return NextResponse.json(db.prepare(`SELECT * FROM brand_kits WHERE id = ?`).get(params.kitId))
}
