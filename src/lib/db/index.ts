/**
 * SQLite database — substitui Supabase para uso interno sem servidor externo.
 * Arquivo: data/contentai.db
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'contentai.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initSchema(_db)
  return _db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS brand_kits (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      primary_color    TEXT,
      secondary_color  TEXT,
      accent_color     TEXT,
      font_title       TEXT,
      font_body        TEXT,
      tone_of_voice    TEXT,
      logo_url         TEXT,
      is_default       INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id                     TEXT PRIMARY KEY,
      brand_kit_id           TEXT REFERENCES brand_kits(id) ON DELETE SET NULL,
      title                  TEXT NOT NULL,
      format                 TEXT NOT NULL,
      status                 TEXT NOT NULL DEFAULT 'draft',
      command                TEXT,
      content_data           TEXT,
      slides_urls            TEXT,
      video_url              TEXT,
      thumbnail_url          TEXT,
      caption_text           TEXT,
      hashtags               TEXT,
      render_progress        INTEGER NOT NULL DEFAULT 0,
      previous_content_data  TEXT,
      created_at             TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_projects_format  ON projects(format);
    CREATE INDEX IF NOT EXISTS idx_bk_default       ON brand_kits(is_default);
  `)
}

export { randomUUID as uuid }

// ─── Typed helpers ────────────────────────────────────────────────────────────

export interface DbBrandKit {
  id:              string
  name:            string
  primary_color:   string | null
  secondary_color: string | null
  accent_color:    string | null
  font_title:      string | null
  font_body:       string | null
  tone_of_voice:   string | null
  logo_url:        string | null
  is_default:      number
  created_at:      string
  updated_at:      string
}

export interface DbProject {
  id:                    string
  brand_kit_id:          string | null
  title:                 string
  format:                string
  status:                string
  command:               string | null
  content_data:          string | null   // JSON string
  slides_urls:           string | null   // JSON string
  video_url:             string | null
  thumbnail_url:         string | null
  caption_text:          string | null
  hashtags:              string | null   // JSON string
  render_progress:       number
  previous_content_data: string | null   // JSON string
  created_at:            string
  updated_at:            string
}

export interface ParsedProject extends Omit<DbProject, 'content_data' | 'slides_urls' | 'hashtags' | 'previous_content_data'> {
  content_data:          unknown
  slides_urls:           string[] | null
  hashtags:              string[] | null
  previous_content_data: unknown
}

/** Parse JSON columns safely */
export function parseProject(row: DbProject): ParsedProject {
  return {
    ...row,
    content_data:          row.content_data          ? JSON.parse(row.content_data)          : null,
    slides_urls:           row.slides_urls           ? JSON.parse(row.slides_urls)           : null,
    hashtags:              row.hashtags              ? JSON.parse(row.hashtags)              : null,
    previous_content_data: row.previous_content_data ? JSON.parse(row.previous_content_data) : null,
  }
}
