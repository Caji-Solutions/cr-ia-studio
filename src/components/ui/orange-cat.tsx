'use client';

import React, { useEffect, useRef } from 'react';

// --- Paleta de cores do gatinho laranja ---
const PALETTE = {
  dark: '#1a0800',
  light: '#fff',
  orange: 'hsl(25, 90%, 55%)',
  orangeLight: 'hsl(32, 95%, 72%)',
  orangeShadow: 'hsl(18, 80%, 40%)',
  orangeDark: 'hsl(14, 72%, 30%)',
  pink: 'hsl(340, 80%, 82%)',
  pinkDark: 'hsl(340, 55%, 62%)',
  stripes: 'hsl(18, 78%, 36%)',
  eyeColor: 'hsl(52, 92%, 54%)',
  eyeRim: 'hsl(25, 70%, 35%)',
  nose: 'hsl(348, 75%, 68%)',
  belly: 'hsl(35, 85%, 82%)',
};

const SCENE_SIZE = 400;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Zdog: any;
  }
}

const OrangeCat: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animationId: number;
    let cleanup: (() => void) | undefined;

    const init = () => {
      const canvas = canvasRef.current;
      if (!canvas || !window.Zdog) return;

      const Zdog = window.Zdog;

      const illo = new Zdog.Illustration({
        element: canvas,
        resize: false,
        rotate: { x: 0.08 },
      });

      // ===== CABEÇA =====
      const headAnchor = new Zdog.Anchor({
        addTo: illo,
        translate: { y: -38 },
      });

      // Sombra da cabeça (volume)
      new Zdog.Shape({
        addTo: headAnchor,
        stroke: 148,
        color: PALETTE.orangeShadow,
        translate: { y: 6 },
      });

      // Cabeça principal
      new Zdog.Shape({
        addTo: headAnchor,
        stroke: 140,
        color: PALETTE.orange,
      });

      // Realce superior
      new Zdog.Shape({
        addTo: headAnchor,
        stroke: 80,
        color: PALETTE.orangeLight,
        translate: { y: -18, z: 28 },
      });

      // ===== ORELHAS =====
      // Orelha esquerda - externa
      new Zdog.Shape({
        addTo: headAnchor,
        path: [{ x: 0, y: 0 }, { x: -28, y: -55 }, { x: -55, y: -5 }],
        fill: true,
        stroke: 4,
        color: PALETTE.orange,
        translate: { x: -38, y: -65, z: 5 },
      });
      // Orelha esquerda - interna (rosa)
      new Zdog.Shape({
        addTo: headAnchor,
        path: [{ x: 0, y: 0 }, { x: -17, y: -32 }, { x: -34, y: -2 }],
        fill: true,
        stroke: 0,
        color: PALETTE.pink,
        translate: { x: -48, y: -63, z: 8 },
      });

      // Orelha direita - externa
      new Zdog.Shape({
        addTo: headAnchor,
        path: [{ x: 0, y: 0 }, { x: 28, y: -55 }, { x: 55, y: -5 }],
        fill: true,
        stroke: 4,
        color: PALETTE.orange,
        translate: { x: 38, y: -65, z: 5 },
      });
      // Orelha direita - interna (rosa)
      new Zdog.Shape({
        addTo: headAnchor,
        path: [{ x: 0, y: 0 }, { x: 17, y: -32 }, { x: 34, y: -2 }],
        fill: true,
        stroke: 0,
        color: PALETTE.pink,
        translate: { x: 38, y: -63, z: 8 },
      });

      // ===== LISTRAS NA TESTA (padrão tabby) =====
      [
        [{ x: -12, y: 0 }, { x: -6, y: -28 }, { x: 0, y: 0 }],
        [{ x: 0, y: 0 }, { x: 6, y: -30 }, { x: 14, y: 0 }],
      ].forEach((path) => {
        new Zdog.Shape({
          addTo: headAnchor,
          path,
          fill: false,
          stroke: 5,
          color: PALETTE.stripes,
          translate: { x: -7, y: -55, z: 52 },
          closed: false,
        });
      });

      // ===== OLHO ESQUERDO =====
      const eyeLeftAnchor = new Zdog.Anchor({
        addTo: headAnchor,
        translate: { x: -40, y: -12, z: 62 },
      });
      // Iris
      new Zdog.Ellipse({
        addTo: eyeLeftAnchor,
        width: 34,
        height: 38,
        fill: true,
        stroke: 2,
        color: PALETTE.eyeColor,
        frontFace: PALETTE.eyeColor,
      });
      // Pupila (fenda de gato)
      const pupilLeft = new Zdog.Ellipse({
        addTo: eyeLeftAnchor,
        width: 9,
        height: 32,
        fill: true,
        stroke: 0,
        color: PALETTE.dark,
        translate: { z: 3 },
      });
      // Contorno do olho
      new Zdog.Ellipse({
        addTo: eyeLeftAnchor,
        width: 34,
        height: 38,
        fill: false,
        stroke: 3,
        color: PALETTE.eyeRim,
        translate: { z: 1 },
      });
      // Brilho
      new Zdog.Shape({
        addTo: eyeLeftAnchor,
        stroke: 9,
        color: PALETTE.light,
        translate: { x: -9, y: -9, z: 6 },
      });
      new Zdog.Shape({
        addTo: eyeLeftAnchor,
        stroke: 5,
        color: 'rgba(255,255,255,0.6)',
        translate: { x: 6, y: -4, z: 6 },
      });

      // ===== OLHO DIREITO =====
      const eyeRightAnchor = new Zdog.Anchor({
        addTo: headAnchor,
        translate: { x: 40, y: -12, z: 62 },
      });
      new Zdog.Ellipse({
        addTo: eyeRightAnchor,
        width: 34,
        height: 38,
        fill: true,
        stroke: 2,
        color: PALETTE.eyeColor,
        frontFace: PALETTE.eyeColor,
      });
      const pupilRight = new Zdog.Ellipse({
        addTo: eyeRightAnchor,
        width: 9,
        height: 32,
        fill: true,
        stroke: 0,
        color: PALETTE.dark,
        translate: { z: 3 },
      });
      new Zdog.Ellipse({
        addTo: eyeRightAnchor,
        width: 34,
        height: 38,
        fill: false,
        stroke: 3,
        color: PALETTE.eyeRim,
        translate: { z: 1 },
      });
      new Zdog.Shape({
        addTo: eyeRightAnchor,
        stroke: 9,
        color: PALETTE.light,
        translate: { x: -9, y: -9, z: 6 },
      });
      new Zdog.Shape({
        addTo: eyeRightAnchor,
        stroke: 5,
        color: 'rgba(255,255,255,0.6)',
        translate: { x: 6, y: -4, z: 6 },
      });

      // ===== NARIZ =====
      new Zdog.Shape({
        addTo: headAnchor,
        path: [{ x: 0, y: 0 }, { x: -11, y: 13 }, { x: 11, y: 13 }],
        fill: true,
        stroke: 2,
        color: PALETTE.nose,
        translate: { y: 14, z: 68 },
      });

      // ===== BOCA =====
      // Bigode central → linhas da boca
      new Zdog.Shape({
        addTo: headAnchor,
        path: [
          { x: 0, y: 0 },
          { arc: [{ x: 0, y: 14 }, { x: -18, y: 22 }] },
        ],
        fill: false,
        stroke: 3,
        color: PALETTE.orangeShadow,
        closed: false,
        translate: { y: 30, z: 67 },
      });
      new Zdog.Shape({
        addTo: headAnchor,
        path: [
          { x: 0, y: 0 },
          { arc: [{ x: 0, y: 14 }, { x: 18, y: 22 }] },
        ],
        fill: false,
        stroke: 3,
        color: PALETTE.orangeShadow,
        closed: false,
        translate: { y: 30, z: 67 },
      });

      // ===== BIGODES =====
      ([-8, 2, 12] as number[]).forEach((dy, i) => {
        const dir = i - 1;
        // Bigodes esquerdos
        new Zdog.Shape({
          addTo: headAnchor,
          path: [{ x: 0, y: 0 }, { x: -68, y: dir * 10 }],
          stroke: 1.8,
          color: PALETTE.light,
          translate: { x: -18, y: 22 + dy, z: 66 },
          closed: false,
        });
        // Bigodes direitos
        new Zdog.Shape({
          addTo: headAnchor,
          path: [{ x: 0, y: 0 }, { x: 68, y: dir * 10 }],
          stroke: 1.8,
          color: PALETTE.light,
          translate: { x: 18, y: 22 + dy, z: 66 },
          closed: false,
        });
      });

      // ===== CORPO =====
      const bodyAnchor = new Zdog.Anchor({
        addTo: illo,
        translate: { y: 92 },
      });

      // Sombra do corpo
      new Zdog.Shape({
        addTo: bodyAnchor,
        stroke: 128,
        color: PALETTE.orangeShadow,
        translate: { y: 5 },
      });

      // Corpo principal
      new Zdog.Shape({
        addTo: bodyAnchor,
        stroke: 118,
        color: PALETTE.orange,
      });

      // Barriga (mais clara na frente)
      new Zdog.Shape({
        addTo: bodyAnchor,
        stroke: 78,
        color: PALETTE.belly,
        translate: { z: 42 },
      });

      // Listras no corpo
      [-22, 0, 22].forEach((x) => {
        new Zdog.Shape({
          addTo: bodyAnchor,
          path: [
            { x, y: -35, z: 54 },
            { x, y: 35, z: 54 },
          ],
          stroke: 7,
          color: PALETTE.stripes,
          closed: false,
        });
      });

      // ===== CAUDA =====
      new Zdog.Shape({
        addTo: illo,
        path: [
          { x: 58, y: 92, z: 0 },
          {
            bezier: [
              { x: 130, y: 88, z: 0 },
              { x: 165, y: 45, z: 15 },
              { x: 155, y: -5, z: 25 },
            ],
          },
          {
            bezier: [
              { x: 145, y: -40, z: 28 },
              { x: 120, y: -55, z: 22 },
              { x: 108, y: -42, z: 14 },
            ],
          },
        ],
        fill: false,
        stroke: 24,
        color: PALETTE.orange,
        closed: false,
      });
      // Ponta da cauda (listrada escura)
      new Zdog.Shape({
        addTo: illo,
        stroke: 30,
        color: PALETTE.orangeShadow,
        translate: { x: 108, y: -42, z: 14 },
      });
      new Zdog.Shape({
        addTo: illo,
        stroke: 20,
        color: PALETTE.orangeDark,
        translate: { x: 110, y: -45, z: 15 },
      });

      // ===== PATAS =====
      ([-1, 1] as number[]).forEach((side) => {
        // Pata (bola laranja)
        new Zdog.Shape({
          addTo: illo,
          stroke: 44,
          color: PALETTE.orange,
          translate: { x: side * 48, y: 158 },
        });
        // Almofadas
        new Zdog.Shape({
          addTo: illo,
          stroke: 28,
          color: PALETTE.belly,
          translate: { x: side * 48, y: 162, z: 18 },
        });
        // Dedinhos
        ([-14, 0, 14] as number[]).forEach((tx) => {
          new Zdog.Shape({
            addTo: illo,
            stroke: 13,
            color: PALETTE.pinkDark,
            translate: { x: side * 48 + tx, y: 172, z: 22 },
          });
        });
      });

      // ===== RASTREAMENTO DO MOUSE =====
      const mouse = { x: 0, y: 0 };

      const onMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left - SCENE_SIZE / 2;
        mouse.y = e.clientY - rect.top - SCENE_SIZE / 2;
      };

      const onTouchMove = (e: TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouse.x = touch.clientX - rect.left - SCENE_SIZE / 2;
        mouse.y = touch.clientY - rect.top - SCENE_SIZE / 2;
      };

      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('touchmove', onTouchMove, { passive: true });

      // ===== LOOP DE ANIMAÇÃO =====
      let time = 0;

      const animate = () => {
        time += 0.016;

        // Cabeça gira suavemente em direção ao mouse
        const targetRotY = Math.atan2(mouse.x, 320) * 0.65;
        const targetRotX = Math.atan2(-mouse.y, 420) * 0.45;

        headAnchor.rotate.y += (targetRotY - headAnchor.rotate.y) * 0.07;
        headAnchor.rotate.x += (targetRotX - headAnchor.rotate.x) * 0.07;

        // Pupila se desloca levemente no espaço local do olho
        const px = (mouse.x / SCENE_SIZE) * 7;
        const py = (mouse.y / SCENE_SIZE) * 7;
        pupilLeft.translate.x = px;
        pupilLeft.translate.y = py;
        pupilRight.translate.x = px;
        pupilRight.translate.y = py;

        // Respiração suave do corpo
        bodyAnchor.translate.y = 92 + Math.sin(time * 1.4) * 4;
        bodyAnchor.scale.y = 1 + Math.sin(time * 1.4) * 0.015;

        // Cauda balança
        // (rota no próprio anchor de illo — efeito sutil)
        illo.rotate.y = Math.sin(time * 0.9) * 0.04;

        illo.updateRenderGraph();
        animationId = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('touchmove', onTouchMove);
        cancelAnimationFrame(animationId);
      };
    };

    // Carrega Zdog via CDN (sem dependência de pacote npm)
    const loadScript = (src: string, onLoad: () => void) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        onLoad();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = onLoad;
      document.body.appendChild(script);
    };

    loadScript('https://unpkg.com/zdog@1/dist/zdog.dist.min.js', () => {
      cleanup = init();
    });

    return () => {
      cleanup?.();
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={SCENE_SIZE}
      height={SCENE_SIZE}
      className="block cursor-none select-none"
      aria-label="Gatinho laranja 3D interativo"
    />
  );
};

export default OrangeCat;
