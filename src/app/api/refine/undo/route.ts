/**
 * POST /api/refine/undo
 *
 * Reverte um projeto para o estado anterior ao último refinamento.
 * Usa o snapshot salvo em previous_content_data.
 *
 * Body: { projectId: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb, parseProject } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreviousSnapshot {
  content_data:  Record<string, unknown>
  slides_urls:   string[] | null
  video_url:     string | null
  thumbnail_url: string | null
  caption_text:  string | null
  hashtags:      string[] | null
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { projectId: string }
  try {
    body = await request.json()
  } catch {
    return fail('Body JSON inválido', 400)
  }

  const { projectId } = body
  if (!projectId) return fail('projectId obrigatório', 400)

  const db  = getDb()
  const row = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId) as Parameters<typeof parseProject>[0] | undefined
  if (!row) return fail('Projeto não encontrado', 404)

  const project = parseProject(row)

  if (!row.previous_content_data) {
    return fail('Sem versão anterior disponível para desfazer', 400)
  }

  let snapshot: PreviousSnapshot
  try {
    snapshot = JSON.parse(row.previous_content_data as string) as PreviousSnapshot
  } catch {
    return fail('Snapshot anterior corrompido, não é possível desfazer', 422)
  }

  // ── Restaura snapshot ───────────────────────────────────────────────────────
  db.prepare(`
    UPDATE projects SET
      content_data = ?, slides_urls = ?, video_url = ?, thumbnail_url = ?,
      caption_text = ?, hashtags = ?, status = 'ready', previous_content_data = NULL,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    JSON.stringify(snapshot.content_data),
    snapshot.slides_urls ? JSON.stringify(snapshot.slides_urls) : null,
    snapshot.video_url     ?? null,
    snapshot.thumbnail_url ?? null,
    snapshot.caption_text  ?? null,
    snapshot.hashtags ? JSON.stringify(snapshot.hashtags) : null,
    projectId,
  )

  return NextResponse.json({
    project: {
      ...project,
      status:               'ready',
      content_data:         snapshot.content_data,
      slides_urls:          snapshot.slides_urls,
      video_url:            snapshot.video_url,
      thumbnail_url:        snapshot.thumbnail_url,
      caption_text:         snapshot.caption_text,
      hashtags:             snapshot.hashtags,
      previous_content_data: null,
    },
    content:   snapshot.content_data,
    slideUrls: snapshot.slides_urls ?? [],
  })
}
