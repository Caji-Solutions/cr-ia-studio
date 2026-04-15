/**
 * GET /api/projects
 *
 * Lista projetos com filtros opcionais:
 *   ?format=carousel|post|...
 *   ?search=texto
 *   ?page=1
 *   ?pageSize=12
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb, parseProject } from '@/lib/db'

const DEFAULT_PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const format   = searchParams.get('format')
  const search   = searchParams.get('search')?.trim() ?? ''
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10))
  const offset   = (page - 1) * pageSize

  const db = getDb()

  // Build WHERE clauses
  const conditions: string[] = []
  const params: unknown[] = []

  if (format && format !== 'all') {
    conditions.push(`format = ?`)
    params.push(format)
  }
  if (search) {
    conditions.push(`title LIKE ?`)
    params.push(`%${search}%`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const total = (db.prepare(`SELECT COUNT(*) as count FROM projects ${where}`).get(...params) as { count: number }).count

  const rows = db.prepare(
    `SELECT id, title, format, status, thumbnail_url, slides_urls, video_url, caption_text, created_at, updated_at
     FROM projects ${where}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, pageSize, offset) as Parameters<typeof parseProject>[0][]

  const projects = rows.map(r => parseProject(r))

  return NextResponse.json({ projects, total, page, pageSize })
}
