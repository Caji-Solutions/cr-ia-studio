import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params
  if (!projectId) return NextResponse.json({ error: 'projectId obrigatório' }, { status: 400 })

  const project = getDb()
    .prepare(`SELECT id, status, render_progress, video_url, thumbnail_url FROM projects WHERE id = ?`)
    .get(projectId) as { id: string; status: string; render_progress: number; video_url: string | null; thumbnail_url: string | null } | undefined

  if (!project) return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })

  return NextResponse.json({
    status:          project.status,
    render_progress: project.render_progress ?? 0,
    ...(project.video_url     && { video_url:     project.video_url }),
    ...(project.thumbnail_url && { thumbnail_url: project.thumbnail_url }),
  })
}
