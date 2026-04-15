import { NextRequest, NextResponse } from 'next/server'
import { getDb, parseProject } from '@/lib/db'
import { deleteProjectFiles } from '@/lib/storage/local'

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

type Ctx = { params: { projectId: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const row = getDb().prepare(`SELECT * FROM projects WHERE id = ?`).get(params.projectId)
  if (!row) return fail('Projeto não encontrado', 404)
  return NextResponse.json(parseProject(row as Parameters<typeof parseProject>[0]))
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const db  = getDb()
  const row = db.prepare(`SELECT id FROM projects WHERE id = ?`).get(params.projectId)
  if (!row) return fail('Projeto não encontrado', 404)
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(params.projectId)
  await deleteProjectFiles(params.projectId)
  return NextResponse.json({ success: true })
}
