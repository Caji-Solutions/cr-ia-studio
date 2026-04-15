/**
 * Simple in-memory rate limiter.
 * Works for single-instance deployments (Railway, Fly.io).
 * For multi-instance: replace with Upstash Redis.
 */

interface RateLimitEntry {
  count:   number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key)
    })
  }, 5 * 60_000)
}

export interface RateLimitResult {
  ok:        boolean
  remaining: number
  resetAt:   number
}

/**
 * @param key       — unique key (e.g. userId or IP)
 * @param limit     — max requests per window (default 10)
 * @param windowMs  — window in ms (default 60s)
 */
export function checkRateLimit(
  key:      string,
  limit    = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return new Response(
    JSON.stringify({ error: 'Muitas requisições. Aguarde um momento e tente novamente.' }),
    {
      status:  429,
      headers: {
        'Content-Type':  'application/json',
        'Retry-After':   String(retryAfter),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
      },
    },
  )
}
