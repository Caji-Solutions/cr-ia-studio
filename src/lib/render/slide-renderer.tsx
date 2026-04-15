/* eslint-disable @next/next/no-img-element */
import React from 'react'
import satori, { type Font as SatoriFont } from 'satori'
import sharp from 'sharp'
import { saveBuffer } from '@/lib/storage/local'
import type { BrandKit } from '@/lib/api/brand-kits'
import type { ProjectFormat } from '@/types/database'
import type { CarouselContent, PostContent, StoryContent, VideoContent } from '@/types/content'

// ─── Types ────────────────────────────────────────────────────────────────────

type SlideLayout = 'bold-center' | 'text-left' | 'text-overlay' | 'split' | 'minimal'

export interface SlideData {
  headline: string
  body: string
  layout: SlideLayout
  slideNumber?: number
}

export interface Dimensions {
  width: number
  height: number
}

export type GeneratedContent = CarouselContent | PostContent | StoryContent | VideoContent

// ─── Dimensions ───────────────────────────────────────────────────────────────

export const FORMAT_DIMENSIONS: Record<ProjectFormat, Dimensions> = {
  post:       { width: 1080, height: 1080 },
  carousel:   { width: 1080, height: 1080 },
  caption:    { width: 1080, height: 1080 },
  story:      { width: 1080, height: 1920 },
  video_9_16: { width: 1080, height: 1920 },
  video_16_9: { width: 1920, height: 1080 },
}

// ─── Font Loading ──────────────────────────────────────────────────────────────

// Satori only supports TTF/OTF — never woff/woff2.
// Direct gstatic TTF URLs for Inter v20 (stable, versioned paths).
const INTER_TTF: Record<400 | 700, string> = {
  400: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrj72A.ttf',
  700: 'https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrj72A.ttf',
}

// User-Agent that makes Google Fonts return TTF (truetype) format instead of woff2.
const TTF_UA =
  'Mozilla/5.0 (Linux; Android 2.2; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1'

const fontCache = new Map<string, ArrayBuffer>()

async function fetchFontDirect(url: string): Promise<ArrayBuffer> {
  if (fontCache.has(url)) return fontCache.get(url)!
  const buffer = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`)
    return r.arrayBuffer()
  })
  fontCache.set(url, buffer)
  return buffer
}

async function fetchGoogleFont(
  family: string,
  weight: 400 | 700 = 400
): Promise<ArrayBuffer> {
  const key = `${family}-${weight}`
  if (fontCache.has(key)) return fontCache.get(key)!

  try {
    // Old Android UA → Google Fonts returns TTF (truetype), which Satori supports
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
    const css = await fetch(cssUrl, { headers: { 'User-Agent': TTF_UA } }).then((r) => r.text())

    // CSS returns a single @font-face with one URL (no unicode subsets for this UA)
    const match = css.match(/url\(([^)]+)\)/)
    if (!match?.[1]) throw new Error('font URL not found in CSS response')

    const buffer = await fetchFontDirect(match[1])
    fontCache.set(key, buffer)
    return buffer
  } catch {
    if (family !== 'Inter') return fetchGoogleFont('Inter', weight)
    // Absolute fallback: known stable TTF URL for Inter
    return fetchFontDirect(INTER_TTF[weight])
  }
}

async function loadFonts(brandKit: BrandKit | null): Promise<SatoriFont[]> {
  const titleFamily = brandKit?.font_title || 'Inter'
  const bodyFamily  = brandKit?.font_body  || 'Inter'
  const families    = Array.from(new Set([titleFamily, bodyFamily, 'Inter']))
  const weights     = [400, 700] as const
  const fonts: SatoriFont[] = []

  // Always guarantee Inter is loaded first as the baseline fallback
  try {
    for (const weight of weights) {
      fonts.push({
        name: 'Inter',
        data: await fetchFontDirect(INTER_TTF[weight]),
        weight,
        style: 'normal',
      })
    }
  } catch {
    throw new Error(
      'Falha ao carregar fonte Inter. Verifique conectividade com fonts.gstatic.com.'
    )
  }

  for (const family of families) {
    if (family === 'Inter') continue // already loaded above
    for (const weight of weights) {
      try {
        fonts.push({
          name: family,
          data: await fetchGoogleFont(family, weight),
          weight,
          style: 'normal',
        })
      } catch { /* fallback to Inter (already loaded) */ }
    }
  }

  return fonts
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function headlineSize(text: string, baseWidth: number): number {
  const scale = baseWidth / 1080
  const len   = text.length
  if (len < 20) return Math.round(90 * scale)
  if (len < 40) return Math.round(72 * scale)
  if (len < 70) return Math.round(58 * scale)
  return Math.round(46 * scale)
}

function toBase64DataUrl(buffer: ArrayBuffer, mime = 'image/jpeg'): string {
  const bytes = new Uint8Array(buffer)
  const b64   = Buffer.from(bytes).toString('base64')
  return `data:${mime};base64,${b64}`
}

async function fetchBase64(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const buf  = await fetch(url).then((r) => r.arrayBuffer())
    const mime = url.endsWith('.png') ? 'image/png'
               : url.endsWith('.svg') ? 'image/svg+xml'
               : 'image/jpeg'
    return toBase64DataUrl(buf, mime)
  } catch {
    return null
  }
}

const DEFAULT_PRIMARY   = '#6366f1'
const DEFAULT_SECONDARY = '#a855f7'

// ─── Decorative Design Elements ───────────────────────────────────────────────

/**
 * Elementos geométricos decorativos sobrepostos ao fundo do slide.
 * Sempre presentes, independente de imagens geradas por IA.
 * Usam rgba para manter harmonia com qualquer cor de brand kit.
 */
function DecorativeShapes({ accentColor }: { accentColor?: string }) {
  const accent = accentColor ?? 'rgba(255,255,255,0.12)'
  return (
    <>
      {/* Círculo grande no canto superior direito */}
      <div
        style={{
          position: 'absolute',
          top: -160, right: -160,
          width: 420, height: 420,
          borderRadius: '50%',
          background: accent,
          display: 'flex',
          opacity: 0.35,
        }}
      />
      {/* Círculo menor no canto inferior esquerdo */}
      <div
        style={{
          position: 'absolute',
          bottom: -100, left: -100,
          width: 260, height: 260,
          borderRadius: '50%',
          background: accent,
          display: 'flex',
          opacity: 0.25,
        }}
      />
      {/* Barra accent no topo */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 6,
          background: 'rgba(255,255,255,0.4)',
          display: 'flex',
        }}
      />
      {/* Barra accent no rodapé */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 4,
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
        }}
      />
    </>
  )
}

// ─── JSX Primitives ───────────────────────────────────────────────────────────

function Background({
  bgBase64,
  primaryColor,
  secondaryColor,
}: {
  bgBase64: string | null
  primaryColor: string
  secondaryColor: string
}) {
  if (bgBase64) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          backgroundImage: `url(${bgBase64})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
          }}
        />
      </div>
    )
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }}
    />
  )
}

function SlideBadge({ number }: { number: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 40, left: 40,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: 30,
        paddingTop: 10, paddingBottom: 10,
        paddingLeft: 22, paddingRight: 22,
      }}
    >
      <span style={{ color: 'white', fontSize: 28, fontWeight: 700 }}>{number}</span>
    </div>
  )
}

function Logo({ src }: { src: string }) {
  return (
    <img
      src={src}
      style={{
        position: 'absolute',
        bottom: 40, right: 40,
        width: 60, height: 60,
        objectFit: 'contain',
      }}
      alt=""
    />
  )
}

// ─── Layout Builders ──────────────────────────────────────────────────────────

function BoldCenter({
  data, bg, logo, titleFont, bodyFont, dim, accentColor,
}: {
  data: SlideData
  bg: React.ReactElement
  logo: React.ReactElement | null
  titleFont: string
  bodyFont: string
  dim: Dimensions
  accentColor?: string
}) {
  const hSize = headlineSize(data.headline, dim.width)
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      {bg}
      <DecorativeShapes accentColor={accentColor} />
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: hSize,
            fontWeight: 700,
            fontFamily: titleFont,
            lineHeight: 1.1,
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          {data.headline}
        </div>
        {data.body ? (
          <div
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: Math.round(hSize * 0.44),
              fontFamily: bodyFont,
              lineHeight: 1.5,
              textAlign: 'center',
              maxWidth: '80%',
            }}
          >
            {data.body}
          </div>
        ) : null}
      </div>
      {data.slideNumber !== undefined ? <SlideBadge number={data.slideNumber} /> : null}
      {logo}
    </div>
  )
}

function TextLeft({
  data, bgBase64, primaryColor, secondaryColor, logo, titleFont, bodyFont, dim,
}: {
  data: SlideData
  bgBase64: string | null
  primaryColor: string
  secondaryColor: string
  logo: React.ReactElement | null
  titleFont: string
  bodyFont: string
  dim: Dimensions
}) {
  const hSize = headlineSize(data.headline, dim.width)
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      {/* Gradient background behind text column */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0, left: 0,
        }}
      >
        {/* Text — 60% */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '60%',
            padding: 80,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: hSize,
              fontWeight: 700,
              fontFamily: titleFont,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            {data.headline}
          </div>
          {data.body ? (
            <div
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: Math.round(hSize * 0.44),
                fontFamily: bodyFont,
                lineHeight: 1.5,
              }}
            >
              {data.body}
            </div>
          ) : null}
        </div>
        {/* Image — 40% */}
        <div style={{ display: 'flex', width: '40%' }}>
          {bgBase64 ? (
            <img
              src={bgBase64}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              alt=""
            />
          ) : (
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                background: `linear-gradient(180deg, ${secondaryColor}66, ${primaryColor}66)`,
              }}
            />
          )}
        </div>
      </div>
      {data.slideNumber !== undefined ? <SlideBadge number={data.slideNumber} /> : null}
      {logo}
    </div>
  )
}

function TextOverlay({
  data, bg, logo, titleFont, bodyFont, dim, accentColor,
}: {
  data: SlideData
  bg: React.ReactElement
  logo: React.ReactElement | null
  titleFont: string
  bodyFont: string
  dim: Dimensions
  accentColor?: string
}) {
  const hSize = headlineSize(data.headline, dim.width)
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
      {bg}
      <DecorativeShapes accentColor={accentColor} />
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: Math.round(hSize * 1.1),
            fontWeight: 700,
            fontFamily: titleFont,
            lineHeight: 1.05,
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          {data.headline}
        </div>
        {data.body ? (
          <div
            style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: Math.round(hSize * 0.44),
              fontFamily: bodyFont,
              lineHeight: 1.5,
              textAlign: 'center',
              maxWidth: '85%',
            }}
          >
            {data.body}
          </div>
        ) : null}
      </div>
      {data.slideNumber !== undefined ? <SlideBadge number={data.slideNumber} /> : null}
      {logo}
    </div>
  )
}

function Split({
  data, bgBase64, primaryColor, secondaryColor, logo, titleFont, bodyFont, dim,
}: {
  data: SlideData
  bgBase64: string | null
  primaryColor: string
  secondaryColor: string
  logo: React.ReactElement | null
  titleFont: string
  bodyFont: string
  dim: Dimensions
}) {
  const hSize = headlineSize(data.headline, dim.width)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Top 50% — image */}
      <div style={{ display: 'flex', height: '50%' }}>
        {bgBase64 ? (
          <img
            src={bgBase64}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />
        ) : (
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            }}
          />
        )}
      </div>
      {/* Bottom 50% — text */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '50%',
          background: '#111111',
          padding: 60,
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: hSize,
            fontWeight: 700,
            fontFamily: titleFont,
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          {data.headline}
        </div>
        {data.body ? (
          <div
            style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: Math.round(hSize * 0.44),
              fontFamily: bodyFont,
              lineHeight: 1.5,
            }}
          >
            {data.body}
          </div>
        ) : null}
      </div>
      {data.slideNumber !== undefined ? <SlideBadge number={data.slideNumber} /> : null}
      {logo}
    </div>
  )
}

function Minimal({
  data, logo, titleFont, bodyFont, dim,
}: {
  data: SlideData
  logo: React.ReactElement | null
  titleFont: string
  bodyFont: string
  dim: Dimensions
}) {
  const hSize = headlineSize(data.headline, dim.width)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#fafafa',
        position: 'relative',
        padding: 80,
      }}
    >
      <div
        style={{
          color: '#111111',
          fontSize: Math.round(hSize * 0.85),
          fontWeight: 700,
          fontFamily: titleFont,
          lineHeight: 1.2,
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        {data.headline}
      </div>
      {data.body ? (
        <div
          style={{
            color: '#444444',
            fontSize: Math.round(hSize * 0.42),
            fontFamily: bodyFont,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: '75%',
          }}
        >
          {data.body}
        </div>
      ) : null}
      {data.slideNumber !== undefined ? <SlideBadge number={data.slideNumber} /> : null}
      {logo}
    </div>
  )
}

// ─── Core Render ──────────────────────────────────────────────────────────────

export async function renderSlide(
  data: SlideData,
  brandKit: BrandKit | null,
  dimensions: Dimensions,
  bgImageBuffer?: ArrayBuffer
): Promise<Buffer> {
  const primaryColor   = brandKit?.primary_color   || DEFAULT_PRIMARY
  const secondaryColor = brandKit?.secondary_color || DEFAULT_SECONDARY
  const accentColor    = brandKit?.accent_color    || undefined
  const titleFont      = brandKit?.font_title       || 'Inter'
  const bodyFont       = brandKit?.font_body        || 'Inter'

  const bgBase64  = bgImageBuffer ? toBase64DataUrl(bgImageBuffer) : null
  const logoBase64 = await fetchBase64(brandKit?.logo_url ?? null)
  const fonts      = await loadFonts(brandKit)

  const logo = logoBase64 ? <Logo src={logoBase64} /> : null
  const bg   = (
    <Background
      bgBase64={bgBase64}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
    />
  )

  let element: React.ReactElement

  switch (data.layout) {
    case 'text-left':
      element = (
        <TextLeft
          data={data}
          bgBase64={bgBase64}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          logo={logo}
          titleFont={titleFont}
          bodyFont={bodyFont}
          dim={dimensions}
        />
      )
      break

    case 'text-overlay':
      element = (
        <TextOverlay
          data={data}
          bg={bg}
          logo={logo}
          titleFont={titleFont}
          bodyFont={bodyFont}
          dim={dimensions}
          accentColor={accentColor}
        />
      )
      break

    case 'split':
      element = (
        <Split
          data={data}
          bgBase64={bgBase64}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          logo={logo}
          titleFont={titleFont}
          bodyFont={bodyFont}
          dim={dimensions}
        />
      )
      break

    case 'minimal':
      element = (
        <Minimal
          data={data}
          logo={logo}
          titleFont={titleFont}
          bodyFont={bodyFont}
          dim={dimensions}
        />
      )
      break

    case 'bold-center':
    default:
      element = (
        <BoldCenter
          data={data}
          bg={bg}
          logo={logo}
          titleFont={titleFont}
          bodyFont={bodyFont}
          dim={dimensions}
          accentColor={accentColor}
        />
      )
  }

  const svg = await satori(element, {
    width: dimensions.width,
    height: dimensions.height,
    fonts,
  })

  return sharp(Buffer.from(svg)).png().toBuffer()
}

// ─── Content → Slides Mapping ─────────────────────────────────────────────────

function contentToSlides(
  content: GeneratedContent,
  format: ProjectFormat
): SlideData[] {
  switch (format) {
    case 'carousel': {
      const c = content as CarouselContent
      return c.slides.map((s) => ({
        headline:    s.headline,
        body:        s.body,
        layout:      s.layout,
        slideNumber: s.slideNumber,
      }))
    }

    case 'story': {
      const c = content as StoryContent
      return c.frames.map((f) => ({
        headline:    f.headline,
        body:        f.body,
        layout:      f.layout,
        slideNumber: f.frameNumber,
      }))
    }

    case 'post':
    case 'caption': {
      const c = content as PostContent
      return [{ headline: c.headline, body: c.body, layout: c.layout }]
    }

    case 'video_16_9':
    case 'video_9_16': {
      const c = content as VideoContent
      return c.scenes.map((s, i) => ({
        headline:    s.textOverlay || `Cena ${s.sceneNumber}`,
        body:        s.narration,
        layout:      'bold-center' as const,
        slideNumber: i + 1,
      }))
    }

    default:
      return []
  }
}

export async function renderContent(
  content: GeneratedContent,
  brandKit: BrandKit | null,
  format: ProjectFormat,
  imageBuffers: (ArrayBuffer | null)[]
): Promise<Buffer[]> {
  const slides = contentToSlides(content, format)
  const dim    = FORMAT_DIMENSIONS[format]

  return Promise.all(
    slides.map((slide, i) =>
      renderSlide(slide, brandKit, dim, imageBuffers[i] ?? undefined)
    )
  )
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadRendered(
  buffers: Buffer[],
  projectId: string
): Promise<string[]> {
  const urls = await Promise.all(
    buffers.map(async (buffer, i) => {
      const filename = `slide-${i + 1}.png`
      return saveBuffer(buffer, projectId, filename)
    })
  )

  return urls
}
