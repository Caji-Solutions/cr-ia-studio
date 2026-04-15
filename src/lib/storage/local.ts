/**
 * Local filesystem storage — substitui Supabase Storage.
 * Arquivos salvos em public/renders/{projectId}/ e servidos estaticamente pelo Next.js.
 */

import fs from 'fs/promises'
import path from 'path'

const RENDERS_DIR = path.join(process.cwd(), 'public', 'renders')

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

/** Salva um Buffer PNG e retorna a URL pública (/renders/...) */
export async function saveBuffer(
  buffer: Buffer,
  projectId: string,
  filename: string,
): Promise<string> {
  const dir = path.join(RENDERS_DIR, projectId)
  await ensureDir(dir)
  await fs.writeFile(path.join(dir, filename), buffer)
  return `/renders/${projectId}/${filename}`
}

/** Copia um arquivo já existente no disco (ex: saída do Remotion) para public/renders */
export async function copyFile(
  sourcePath: string,
  projectId:  string,
  filename:   string,
): Promise<string> {
  const dir = path.join(RENDERS_DIR, projectId)
  await ensureDir(dir)
  await fs.copyFile(sourcePath, path.join(dir, filename))
  return `/renders/${projectId}/${filename}`
}

/** Lê um arquivo de renders como Buffer (para download ZIP) */
export async function readRenderFile(publicUrl: string): Promise<Buffer> {
  // publicUrl: /renders/{projectId}/{file}
  const rel  = publicUrl.replace(/^\//, '')
  const full = path.join(process.cwd(), 'public', rel)
  return fs.readFile(full)
}

/** Salva logo de brand kit em public/logos/ */
export async function saveLogo(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'logos')
  await ensureDir(dir)
  await fs.writeFile(path.join(dir, filename), buffer)
  return `/logos/${filename}`
}

/** Remove pasta de renders de um projeto */
export async function deleteProjectFiles(projectId: string): Promise<void> {
  const dir = path.join(RENDERS_DIR, projectId)
  await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
}
