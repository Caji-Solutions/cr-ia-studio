/**
 * Brand Kits — cliente HTTP (sem Supabase).
 * Chama as API routes que usam SQLite internamente.
 */

export interface BrandKit {
  id:              string
  name:            string
  primary_color:   string | null
  secondary_color: string | null
  accent_color:    string | null
  font_title:      string | null
  font_body:       string | null
  tone_of_voice:   string | null
  logo_url:        string | null
  is_default:      number | boolean
  created_at:      string
  updated_at:      string
}

export type BrandKitInsert = Omit<BrandKit, 'id' | 'created_at' | 'updated_at'>

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Erro na API')
  }
  return res.json()
}

export async function getBrandKits(): Promise<BrandKit[]> {
  return apiFetch<BrandKit[]>('/api/brand-kits')
}

export async function createBrandKit(payload: BrandKitInsert): Promise<BrandKit> {
  return apiFetch<BrandKit>('/api/brand-kits', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}

export async function updateBrandKit(id: string, payload: Partial<BrandKitInsert>): Promise<BrandKit> {
  return apiFetch<BrandKit>(`/api/brand-kits/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  })
}

export async function deleteBrandKit(id: string): Promise<void> {
  await apiFetch(`/api/brand-kits/${id}`, { method: 'DELETE' })
}

export async function setDefaultBrandKit(id: string): Promise<BrandKit> {
  return apiFetch<BrandKit>(`/api/brand-kits/${id}/default`, { method: 'POST' })
}

export async function uploadLogo(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res  = await fetch('/api/brand-kits/logo', { method: 'POST', body: form })
  if (!res.ok) throw new Error('Falha no upload do logo')
  const { url } = await res.json()
  return url
}
