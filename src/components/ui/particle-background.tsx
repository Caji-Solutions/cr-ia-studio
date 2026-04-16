'use client'

/**
 * WaveBackground — ondas SVG animadas no topo e na base
 *
 * Camadas inferiores: 3 ondas fluindo horizontalmente (violet, pink, teal)
 * Camadas superiores: 2 ondas invertidas fluindo (violet, pink)
 * Aurora glows: 3 gradientes radiais sutis para profundidade de cor
 *
 * Todos os caminhos usam período duplicado (2880 unidades) para tile
 * seamless via translateX(-50%).
 */

// ── Ondas inferiores (preenchem de baixo para cima) ───────────────────────────

// Onda baixo 1 — violet, amplitude 55, midY=90, viewBox height=180
const WAVE_BOT_1 =
  'M 0,90 C 240,35 480,35 720,90 C 960,145 1200,145 1440,90 ' +
  'C 1680,35 1920,35 2160,90 C 2400,145 2640,145 2880,90 ' +
  'L 2880,180 L 0,180 Z'

// Onda baixo 2 — pink, fase invertida, amplitude 60, midY=70, viewBox height=140
const WAVE_BOT_2 =
  'M 0,70 C 240,130 480,130 720,70 C 960,10 1200,10 1440,70 ' +
  'C 1680,130 1920,130 2160,70 C 2400,10 2640,10 2880,70 ' +
  'L 2880,140 L 0,140 Z'

// Onda baixo 3 — teal, período 960 (3 ciclos em 2880), midY=50, viewBox height=100
const WAVE_BOT_3 =
  'M 0,50 C 160,15 320,15 480,50 C 640,85 800,85 960,50 ' +
  'C 1120,15 1280,15 1440,50 C 1600,85 1760,85 1920,50 ' +
  'C 2080,15 2240,15 2400,50 C 2560,85 2720,85 2880,50 ' +
  'L 2880,100 L 0,100 Z'

// ── Ondas superiores (preenchem de cima para baixo) ──────────────────────────

// Onda topo 1 — violet, amplitude 55, desce até midY=90, viewBox height=160
const WAVE_TOP_1 =
  'M 0,0 L 2880,0 L 2880,90 ' +
  'C 2640,145 2400,35 2160,90 C 1920,145 1680,35 1440,90 ' +
  'C 1200,145 960,35 720,90 C 480,145 240,35 0,90 Z'

// Onda topo 2 — pink, fase oposta, desce até midY=70, viewBox height=130
const WAVE_TOP_2 =
  'M 0,0 L 2880,0 L 2880,70 ' +
  'C 2640,20 2400,120 2160,70 C 1920,20 1680,120 1440,70 ' +
  'C 1200,20 960,120 720,70 C 480,20 240,120 0,70 Z'

export function ParticleBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* ── Aurora glows (profundidade de cor) ─────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: '-18%',
          left: '-10%',
          width: '58%',
          height: '58%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, #8b5cf6 0%, transparent 65%)',
          filter: 'blur(64px)',
          opacity: 0.06,
          animation: 'aurora-breathe 9s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-14%',
          right: '-14%',
          width: '52%',
          height: '52%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, #ec4899 0%, transparent 65%)',
          filter: 'blur(56px)',
          opacity: 0.055,
          animation: 'aurora-breathe 12s ease-in-out infinite',
          animationDelay: '-5s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '32%',
          left: '38%',
          width: '42%',
          height: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, #06b6d4 0%, transparent 65%)',
          filter: 'blur(72px)',
          opacity: 0.04,
          animation: 'aurora-breathe 15s ease-in-out infinite',
          animationDelay: '-8s',
        }}
      />

      {/* ── Ondas superiores ─────────────────────────────────────────────────── */}

      {/* Topo 1 — violet, flui da esquerda para direita */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          willChange: 'transform',
          animation: 'wave-flow-1 26s linear infinite',
        }}
      >
        <svg
          viewBox="0 0 2880 160"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '160px' }}
        >
          <defs>
            <linearGradient id="wgt1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d={WAVE_TOP_1} fill="url(#wgt1)" />
        </svg>
      </div>

      {/* Topo 2 — pink, flui da direita para esquerda */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '200%',
          willChange: 'transform',
          animation: 'wave-flow-2 18s linear infinite',
        }}
      >
        <svg
          viewBox="0 0 2880 130"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '130px' }}
        >
          <defs>
            <linearGradient id="wgt2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#be185d" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          <path d={WAVE_TOP_2} fill="url(#wgt2)" />
        </svg>
      </div>

      {/* ── Ondas inferiores ─────────────────────────────────────────────────── */}

      {/* Base 1 — violet, flui da esquerda para direita, mais lenta */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          willChange: 'transform',
          animation: 'wave-flow-1 22s linear infinite',
        }}
      >
        <svg
          viewBox="0 0 2880 180"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '180px' }}
        >
          <defs>
            <linearGradient id="wgb1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#8b5cf6" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.06" />
            </linearGradient>
          </defs>
          <path d={WAVE_BOT_1} fill="url(#wgb1)" />
        </svg>
      </div>

      {/* Base 2 — pink, flui da direita para esquerda */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          willChange: 'transform',
          animation: 'wave-flow-2 16s linear infinite',
        }}
      >
        <svg
          viewBox="0 0 2880 140"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '140px' }}
        >
          <defs>
            <linearGradient id="wgb2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#ec4899" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={WAVE_BOT_2} fill="url(#wgb2)" />
        </svg>
      </div>

      {/* Base 3 — teal, flui mais rápido, na frente */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          willChange: 'transform',
          animation: 'wave-flow-3 11s linear infinite',
        }}
      >
        <svg
          viewBox="0 0 2880 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: '100px' }}
        >
          <defs>
            <linearGradient id="wgb3" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#0e7490" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <path d={WAVE_BOT_3} fill="url(#wgb3)" />
        </svg>
      </div>
    </div>
  )
}
