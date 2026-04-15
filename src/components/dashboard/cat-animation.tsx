'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── Paleta fiel ao vídeo ─────────────────────────────────────────────── */
const C = {
  body:     '#F28C1A',   // laranja âmbar quente
  bodyLt:   '#F5A940',   // laranja claro (realce superior)
  bodyDk:   '#C96008',   // laranja escuro (sombra / underside)
  bodyRim:  '#A04806',   // contorno suave
  belly:    '#FCDFA0',   // barriga creme
  eyeW:     '#F5EDD8',   // branco quente dos olhos (igual ao vídeo)
  eyeRim:   '#8B4A06',   // aro dos olhos
  pupil:    '#1C0800',   // pupila escura
  nose:     '#B84860',   // nariz rosado-escuro
  earPink:  '#EEA0B8',   // orelha interna
  cheek:    '#F09060',   // blush bochechas
  yarn:     '#8C1820',   // novelo vermelho escuro (idêntico ao vídeo)
  yarnMid:  '#A82030',   // fio médio
  yarnLt:   '#C03040',   // fio claro / realce
  string:   '#B04050',   // fio solto entre patinha e novelo
};

/* ─── Centros dos olhos (viewBox 0 0 220 195) ────────────────────────── */
const EL = { x: 70, y: 124 };
const ER = { x: 97, y: 122 };

export function CatAnimation() {
  const svgRef      = useRef<SVGSVGElement>(null);
  const pupilLRef   = useRef<SVGEllipseElement>(null);
  const pupilRRef   = useRef<SVGEllipseElement>(null);
  const tailRef     = useRef<SVGPathElement>(null);
  const tailShadRef = useRef<SVGPathElement>(null);
  const yarnGRef    = useRef<SVGGElement>(null);
  const pawGRef     = useRef<SVGGElement>(null);
  const stringRef   = useRef<SVGPathElement>(null);

  const [typing, setTyping] = useState(false);
  const mouse   = useRef({ x: 0, y: 0 });
  const typingR = useRef(false);
  const rafRef  = useRef(0);

  useEffect(() => { typingR.current = typing; }, [typing]);

  useEffect(() => {
    const onMove     = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    const onFocusIn  = (e: FocusEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)
        setTyping(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement)
        setTyping(false);
    };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('focusin',  onFocusIn,  true);
    document.addEventListener('focusout', onFocusOut, true);

    const loop = (ms: number) => {
      const t   = ms / 1000;
      const isT = typingR.current;
      const svg = svgRef.current;

      /* ── olhos seguem o mouse ── */
      if (svg) {
        const rect = svg.getBoundingClientRect();
        if (rect.width > 0) {
          const sx = 220 / rect.width;
          const sy = 195 / rect.height;
          const mx = (mouse.current.x - rect.left) * sx;
          const my = (mouse.current.y - rect.top)  * sy;

          const movePupil = (
            el: SVGEllipseElement | null,
            c:  { x: number; y: number },
            maxR: number,
          ) => {
            if (!el) return;
            const dx   = mx - c.x;
            const dy   = my - c.y;
            const ang  = Math.atan2(dy, dx);
            const dist = Math.min(maxR, Math.hypot(dx, dy) / 9);
            el.setAttribute('cx', String(c.x + Math.cos(ang) * dist));
            el.setAttribute('cy', String(c.y + Math.sin(ang) * dist));
            /* pupila mais aberta quando o gato está alerta (digitando) */
            el.setAttribute('rx', isT ? '5.5' : '4.5');
            el.setAttribute('ry', isT ? '6'   : '5.5');
          };

          movePupil(pupilLRef.current, EL, 4.5);
          movePupil(pupilRRef.current, ER, 3.5);
        }
      }

      /* ── novelo se move para longe e perto (como no vídeo) ── */
      const speed = isT ? 3.5 : 1.6;
      /* normalized 0→1→0: afasta e aproxima */
      const phase  = (Math.sin(t * speed) + 1) / 2;
      const yarnX  = 14 + phase * 40;          /* 14 (perto) → 54 (longe) */
      const yarnY  = 164 + Math.sin(t * speed * 1.8) * 2.5;

      yarnGRef.current?.setAttribute('transform', `translate(${yarnX}, ${yarnY})`);

      /* patinha acompanha o novelo */
      const pawX = yarnX + 16 + phase * 4;
      const pawY = yarnY - 10;
      pawGRef.current?.setAttribute('transform', `translate(${pawX}, ${pawY})`);

      /* fio entre patinha e novelo */
      if (stringRef.current) {
        const cx = (pawX - 10 + yarnX) / 2;
        const cy = Math.min(pawY, yarnY) - 8;
        stringRef.current.setAttribute(
          'd',
          `M${pawX - 10} ${pawY + 3} Q${cx} ${cy} ${yarnX + 4} ${yarnY - 13}`,
        );
      }

      /* ── cauda balança ── */
      const wagS = isT ? 5 : 2;
      const wagA = isT ? 20 : 8;
      const wag  = Math.sin(t * wagS) * wagA;
      const td = `M202 150 C218 138,226 ${112 + wag * 0.35},222 ${90 + wag} C218 ${72 + wag},204 ${66 + wag * 0.5},195 ${75 + wag * 0.3}`;
      tailRef.current?.setAttribute('d', td);
      tailShadRef.current?.setAttribute('d', td);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('focusin',  onFocusIn,  true);
      document.removeEventListener('focusout', onFocusOut, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 220 195"
      className="w-full"
      style={{ overflow: 'visible' }}
      aria-label="Gatinho laranja interativo"
    >
      <defs>
        <style>{`
          @keyframes cat-breathe {
            0%,100% { transform: scaleX(1) scaleY(1); }
            50%      { transform: scaleX(1.012) scaleY(1.018); }
          }
          @keyframes cat-blink {
            0%,88%,100% { transform: scaleY(1);    }
            93%          { transform: scaleY(0.05); }
          }
          @keyframes sparkle-pop {
            0%   { opacity:0; transform: scale(0.3) translateY(8px); }
            65%  { opacity:1; transform: scale(1.12) translateY(-3px); }
            100% { opacity:1; transform: scale(1) translateY(0); }
          }
          .cat-body-g {
            animation: cat-breathe 4s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }
          .eye-l {
            animation: cat-blink 6.5s ease-in-out infinite;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }
          .eye-r {
            animation: cat-blink 6.5s ease-in-out 0.12s infinite;
            transform-box: fill-box;
            transform-origin: 50% 50%;
          }
          .sparkle {
            animation: sparkle-pop 0.38s cubic-bezier(0.34,1.56,0.64,1) both;
            transform-box: fill-box;
            transform-origin: 50% 100%;
          }
        `}</style>

        {/* gradiente radial para o corpo — centro claro, bordas escuras */}
        <radialGradient id="g-body" cx="38%" cy="28%" r="65%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor={C.bodyLt} />
          <stop offset="70%"  stopColor={C.body}   />
          <stop offset="100%" stopColor={C.bodyDk} />
        </radialGradient>

        {/* gradiente para a cabeça */}
        <radialGradient id="g-head" cx="35%" cy="28%" r="68%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor={C.bodyLt} />
          <stop offset="65%"  stopColor={C.body}   />
          <stop offset="100%" stopColor={C.bodyDk} />
        </radialGradient>

        {/* gradiente para o novelo */}
        <radialGradient id="g-yarn" cx="32%" cy="28%" r="70%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor={C.yarnLt}  />
          <stop offset="55%"  stopColor={C.yarnMid}  />
          <stop offset="100%" stopColor={C.yarn}     />
        </radialGradient>

        {/* sombra suave para elementos principais */}
        <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2.5" floodColor="#00000028"/>
        </filter>
      </defs>

      {/* ══════════════════════════════════════════
          CAUDA  (fica atrás do corpo)
          ══════════════════════════════════════════ */}
      {/* sombra da cauda */}
      <path
        ref={tailShadRef}
        d="M202 150 C218 138,226 115,222 92 C218 73,204 67,195 76"
        fill="none" stroke={C.bodyDk} strokeWidth="17" strokeLinecap="round"
      />
      {/* cauda principal */}
      <path
        ref={tailRef}
        d="M202 150 C218 138,226 115,222 92 C218 73,204 67,195 76"
        fill="none" stroke="url(#g-body)" strokeWidth="13" strokeLinecap="round"
      />

      {/* ══════════════════════════════════════════
          PATAS TRASEIRAS  (atrás do corpo)
          ══════════════════════════════════════════ */}
      {/* pata traseira direita */}
      <ellipse cx="185" cy="167" rx="26" ry="13" fill={C.bodyDk}  />
      <ellipse cx="183" cy="164" rx="24" ry="12" fill="url(#g-body)" />
      {/* pata traseira esquerda (parcialmente visível) */}
      <ellipse cx="158" cy="170" rx="20" ry="10" fill={C.bodyDk}  />
      <ellipse cx="157" cy="168" rx="18" ry="9"  fill={C.body}    />

      {/* ══════════════════════════════════════════
          CORPO  (rechonchudo horizontal)
          ══════════════════════════════════════════ */}
      <g className="cat-body-g" filter="url(#drop)">
        {/* sombra do corpo */}
        <ellipse cx="148" cy="157" rx="68" ry="30" fill={C.bodyDk} opacity="0.7" />
        {/* corpo principal */}
        <ellipse cx="145" cy="152" rx="66" ry="28" fill="url(#g-body)" />
        {/* barriga mais clara (parte de baixo / frente) */}
        <ellipse cx="128" cy="158" rx="40" ry="14" fill={C.belly} opacity="0.55"/>
      </g>

      {/* ══════════════════════════════════════════
          FIO  (entre patinha e novelo)
          ══════════════════════════════════════════ */}
      <path
        ref={stringRef}
        d="M55 155 Q42 148 30 153"
        fill="none" stroke={C.string} strokeWidth="1.4" opacity="0.85"
      />

      {/* ══════════════════════════════════════════
          PATINHA DIANTEIRA  (animada — bate no novelo)
          ══════════════════════════════════════════ */}
      <g ref={pawGRef} style={{ willChange: 'transform' }}>
        {/* sombra */}
        <ellipse cx="0" cy="3"  rx="18" ry="9"  fill={C.bodyDk} />
        {/* patinha */}
        <ellipse cx="0" cy="0"  rx="17" ry="8"  fill="url(#g-body)" />
        {/* dedinhos */}
        <ellipse cx="-8" cy="5"  rx="5.5" ry="3.5" fill={C.bodyLt} opacity="0.65"/>
        <ellipse cx="0"  cy="7"  rx="5.5" ry="3.5" fill={C.bodyLt} opacity="0.65"/>
        <ellipse cx="8"  cy="5"  rx="5.5" ry="3.5" fill={C.bodyLt} opacity="0.65"/>
      </g>

      {/* patinha dianteira secundária (sob o corpo, estática) */}
      <ellipse cx="108" cy="167" rx="19" ry="9"  fill={C.bodyDk} opacity="0.8"/>
      <ellipse cx="107" cy="164" rx="18" ry="8"  fill={C.body}   />

      {/* ══════════════════════════════════════════
          NOVELO DE LÃ  (animado, vermelho escuro)
          ══════════════════════════════════════════ */}
      <g ref={yarnGRef} style={{ willChange: 'transform' }}>
        {/* sombra no chão */}
        <ellipse cx="0" cy="16" rx="12" ry="4" fill="#00000018"/>
        {/* bola */}
        <circle cx="0" cy="0" r="13" fill="url(#g-yarn)"/>
        {/* fios de lã — cruzamentos característicos do novelo */}
        <ellipse cx="0" cy="0" rx="13" ry="7"  fill="none" stroke={C.yarn}   strokeWidth="1.3" opacity="0.55"/>
        <ellipse cx="0" cy="0" rx="7"  ry="13" fill="none" stroke={C.yarn}   strokeWidth="1.3" opacity="0.55"/>
        <ellipse cx="0" cy="0" rx="10" ry="5"  fill="none" stroke={C.yarnLt} strokeWidth="0.8" opacity="0.4" transform="rotate(40)"/>
        <circle  cx="0" cy="0" r="13"  fill="none" stroke={C.yarnMid} strokeWidth="1.8" opacity="0.3"/>
        {/* brilho */}
        <ellipse cx="-4" cy="-5" rx="4" ry="3" fill="white" opacity="0.22"/>
      </g>

      {/* ══════════════════════════════════════════
          CABEÇA
          ══════════════════════════════════════════ */}
      <g filter="url(#drop)">
        {/* sombra */}
        <circle cx="84" cy="134" r="36" fill={C.bodyDk} opacity="0.7"/>
        {/* cabeça */}
        <circle cx="82" cy="131" r="34" fill="url(#g-head)"/>

        {/* ── ORELHAS ── */}
        {/* orelha esquerda */}
        <polygon points="57,104  70,87  82,108" fill={C.body}    />
        <polygon points="62,103  71,91  79,107" fill={C.earPink} opacity="0.9"/>
        {/* orelha direita */}
        <polygon points="82,107  97,90  108,104" fill={C.body}    />
        <polygon points="86,106  97,93  105,103" fill={C.earPink} opacity="0.9"/>

        {/* ── OLHO ESQUERDO (maior — fiel ao vídeo) ── */}
        <g className="eye-l">
          {/* aro/sombra */}
          <ellipse cx={EL.x} cy={EL.y} rx="15" ry="14" fill={C.eyeRim}/>
          {/* esclera */}
          <ellipse cx={EL.x} cy={EL.y} rx="14" ry="13" fill={C.eyeW} />
          {/* pupila — movida por JS */}
          <ellipse ref={pupilLRef} cx={EL.x} cy={EL.y} rx="4.5" ry="5.5" fill={C.pupil}/>
          {/* brilho */}
          <circle cx={EL.x - 4} cy={EL.y - 4} r="3.2" fill="white" opacity="0.9"/>
          <circle cx={EL.x + 5} cy={EL.y - 1} r="1.5" fill="white" opacity="0.5"/>
        </g>

        {/* ── OLHO DIREITO (ligeiramente menor — perspectiva) ── */}
        <g className="eye-r">
          <ellipse cx={ER.x} cy={ER.y} rx="13" ry="12" fill={C.eyeRim}/>
          <ellipse cx={ER.x} cy={ER.y} rx="12" ry="11" fill={C.eyeW} />
          <ellipse ref={pupilRRef} cx={ER.x} cy={ER.y} rx="4.5" ry="5.5" fill={C.pupil}/>
          <circle cx={ER.x - 3} cy={ER.y - 3} r="2.8" fill="white" opacity="0.9"/>
          <circle cx={ER.x + 4} cy={ER.y}     r="1.3" fill="white" opacity="0.5"/>
        </g>

        {/* ── BOCHECHAS (blush suave) ── */}
        <ellipse cx="56"  cy="134" rx="11" ry="7" fill={C.cheek} opacity="0.25"/>
        <ellipse cx="106" cy="132" rx="9"  ry="6" fill={C.cheek} opacity="0.2"/>

        {/* ── NARIZ ── */}
        <polygon points="82,138  77,143  87,143" fill={C.nose}/>
        {/* filtro + boca */}
        <line x1="82" y1="138" x2="82" y2="144"
          stroke={C.bodyRim} strokeWidth="1.2" strokeLinecap="round"/>
        <path d="M77 144 Q82 149 87 144"
          fill="none" stroke={C.bodyRim} strokeWidth="1.6" strokeLinecap="round"/>

        {/* ── BIGODES ── */}
        {/* esquerda */}
        <line x1="20"  y1="134" x2="65" y2="137" stroke="white" strokeWidth="1.2" opacity="0.78"/>
        <line x1="18"  y1="139" x2="65" y2="140" stroke="white" strokeWidth="1.2" opacity="0.78"/>
        <line x1="20"  y1="144" x2="65" y2="143" stroke="white" strokeWidth="1.2" opacity="0.78"/>
        {/* direita */}
        <line x1="144" y1="134" x2="99" y2="137" stroke="white" strokeWidth="1.2" opacity="0.78"/>
        <line x1="144" y1="139" x2="99" y2="140" stroke="white" strokeWidth="1.2" opacity="0.78"/>
        <line x1="144" y1="144" x2="99" y2="143" stroke="white" strokeWidth="1.2" opacity="0.78"/>
      </g>

      {/* ══════════════════════════════════════════
          INDICADOR DE DIGITAÇÃO
          Aparece quando textarea/input recebe foco
          ══════════════════════════════════════════ */}
      {typing && (
        <g className="sparkle">
          {/* balão de fala */}
          <rect x="100" y="52" width="58" height="34" rx="10" fill="white" opacity="0.95"/>
          <polygon points="108,86 100,96 120,86" fill="white" opacity="0.95"/>
          {/* texto */}
          <text
            x="129" y="76"
            textAnchor="middle"
            fontSize="20"
            fontFamily="system-ui, sans-serif"
          >
            ✨
          </text>
        </g>
      )}
    </svg>
  );
}
