import { ProjectFormat } from '@/types/database'

export type ImageSize = '1024x1024' | '1024x1792' | '1792x1024'

const PROMPT_PREFIX =
  'Professional social media visual, clean modern, no text no words no letters. '

const FORMAT_SIZES: Record<ProjectFormat, ImageSize> = {
  post: '1024x1024',
  carousel: '1024x1024',
  caption: '1024x1024',
  story: '1024x1792',
  video_9_16: '1024x1792',
  video_16_9: '1792x1024',
}

const SIZE_TO_ASPECT: Record<ImageSize, string> = {
  '1024x1024': '1:1',
  '1024x1792': '9:16',
  '1792x1024': '16:9',
}

const IMAGEN_MODEL = 'imagen-3.0-generate-002'
const IMAGEN_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export function getSizeForFormat(format: ProjectFormat): ImageSize {
  return FORMAT_SIZES[format]
}

export async function generateImage(
  prompt: string,
  size: ImageSize,
  apiKey: string
): Promise<ArrayBuffer | null> {
  try {
    const aspectRatio = SIZE_TO_ASPECT[size]
    const url = `${IMAGEN_API_BASE}/${IMAGEN_MODEL}:predict?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: PROMPT_PREFIX + prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio,
        },
      }),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as { error?: { message?: string; status?: string } }
      const errMsg = errBody?.error?.message ?? `HTTP ${response.status}`
      console.error(`[Imagen 3] Falha ao gerar imagem (${response.status}): ${errMsg}`)
      return null
    }

    const data = await response.json() as {
      predictions?: Array<{ bytesBase64Encoded?: string }>
    }

    const b64 = data.predictions?.[0]?.bytesBase64Encoded
    if (!b64) {
      console.error('[Imagen 3] Resposta sem imagem — predictions vazia ou bytesBase64Encoded ausente')
      return null
    }

    const bytes = Buffer.from(b64, 'base64')
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  } catch {
    return null
  }
}

// Executa tarefas com no máximo `limit` em paralelo para evitar RESOURCE_EXHAUSTED
async function withConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  let next = 0

  async function worker() {
    while (next < tasks.length) {
      const i = next++
      results[i] = await tasks[i]()
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker)
  await Promise.all(workers)
  return results
}

const IMAGE_CONCURRENCY = 3  // máx 3 imagens simultâneas para respeitar RPM do Imagen

export async function generateMultipleImages(
  prompts: string[],
  size: ImageSize,
  apiKey: string
): Promise<(ArrayBuffer | null)[]> {
  return withConcurrency(
    prompts.map((prompt) => () => generateImage(prompt, size, apiKey)),
    IMAGE_CONCURRENCY
  )
}

// Mantido para compatibilidade com URLs externas
export async function downloadImageAsBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${response.status} ${response.statusText}`)
  }
  return response.arrayBuffer()
}
