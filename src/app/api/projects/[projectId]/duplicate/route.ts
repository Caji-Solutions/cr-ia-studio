import { NextRequest, NextResponse } from 'next/server'
import { getDb, uuid, parseProject } from '@/lib/db'

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const db       = getDb()
  const original = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(params.projectId) as Parameters<typeof parseProject>[0] | undefined
  if (!original) return fail('Projeto não encontrado', 404)

  const newId = uuid()
  db.prepare(`
    INSERT INTO projects (id, brand_kit_id, title, format, status, command, content_data, slides_urls, video_url, thumbnail_url, caption_text, hashtags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    newId,
    original.brand_kit_id,
    `${original.title} (cópia)`,
    original.format,
    original.status,
    original.command,
    original.content_data,
    original.slides_urls,
    original.video_url,
    original.thumbnail_url,
    original.caption_text,
    original.hashtags,
  )

  const copy = parseProject(db.prepare(`SELECT * FROM projects WHERE id = ?`).get(newId) as Parameters<typeof parseProject>[0])
  return NextResponse.json({ project: copy })
}
