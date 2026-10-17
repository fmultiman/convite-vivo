"use client";

import { useEffect, useRef } from "react";
import { EXPERIENCE_EVENTS, prefersLightweightMedia } from "../client/hooks";
import {
  createBubbles,
  createMotes,
  drawPosition,
  moteGlow,
  mulberry32,
  spawnBurst,
  stepBubbles,
  type Bubble,
  type PointerState,
  type SimConfig,
} from "./bubbleSim";

/** Atributo colocado no palco pai enquanto o canvas está ativo (CSS esconde o fallback). */
export const CANVAS_ACTIVE_ATTR = "data-canvas";
/** Evento disparado no palco quando o seu destaque é revelado (bolhas sobem junto). */
export const REVEAL_EVENT = "cv-reveal";

const DPR_CAP = 1.5;
const BURST_COUNT = 18;

/** Bolha desenhada à mão, usada quando não há sprites (ou até eles carregarem). */
function makeFallbackSprite(): HTMLCanvasElement {
  const size = 96;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const mid = size / 2;
  const body = g.createRadialGradient(mid * 0.85, mid * 0.8, size * 0.04, mid, mid, mid);
  body.addColorStop(0, "rgba(255,255,255,0.0)");
  body.addColorStop(0.62, "rgba(190,230,255,0.10)");
  body.addColorStop(0.9, "rgba(255,196,232,0.38)");
  body.addColorStop(1, "rgba(255,255,255,0.65)");
  g.fillStyle = body;
  g.beginPath();
  g.arc(mid, mid, mid - 1, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.55)";
  g.lineWidth = 1.5;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.ellipse(mid * 0.7, mid * 0.62, size * 0.1, size * 0.055, -0.7, 0, Math.PI * 2);
  g.fill();
  return c;
}

/** Pontinho de luz macio para as partículas flutuantes (desenhado uma vez). */
function makeMoteSprite(): HTMLCanvasElement {
  const size = 32;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const mid = size / 2;
  const dot = g.createRadialGradient(mid, mid, 0, mid, mid, mid);
  dot.addColorStop(0, "rgba(255,255,255,1)");
  dot.addColorStop(0.35, "rgba(235,248,255,0.55)");
  dot.addColorStop(1, "rgba(220,240,255,0)");
  g.fillStyle = dot;
  g.fillRect(0, 0, size, size);
  return c;
}

function loadSprites(urls: string[], onLoad: (img: HTMLImageElement, index: number) => void): () => void {
  let cancelled = false;
  urls.forEach((url, index) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!cancelled) onLoad(img, index);
    };
    img.src = url;
  });
  return () => {
    cancelled = true;
  };
}

/**
 * Camada atmosférica transparente em Canvas 2D: microbolhas discretas e partículas
 * flutuantes (neve marinha). As bolhas grandes e decorativas ficam em CSS, em
 * primeiro plano; aqui só entra o que dá profundidade e vida ao ar da cena.
 *
 * - Nunca captura eventos (pointer-events: none); ouve o ponteiro na janela, de
 *   forma passiva, então cliques, rolagem e navegação seguem intactos.
 * - Sem estado React por quadro: tudo vive em closures do efeito.
 * - Só roda com a cena visível, a aba em primeiro plano e a entrada aberta.
 * - Resolução limitada (DPR ≤ 1,5) e taxa limitada em ponteiro grosso.
 */
export function BubbleCanvas({
  sprites,
  density,
  motes = 1,
  className,
}: {
  sprites: string[];
  density: number;
  motes?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const stage = canvas?.closest<HTMLElement>("[data-stage]");
    const ctx = canvas?.getContext("2d", { alpha: true }) ?? null;
    if (!canvas || !host || !stage || !ctx) return; // sem canvas: o fallback CSS permanece

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const light = prefersLightweightMedia();
    const cfg: SimConfig = {
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight),
      density: density * (light ? 0.55 : 1),
      coarse,
      spriteCount: Math.max(1, sprites.length),
      atmosphere: true,
      motesDensity: motes * (light ? 0.55 : 1),
    };
    const rand = mulberry32(0xb0bb1e);
    const pointer: PointerState = { x: -9999, y: -9999, active: false };
    const fallback = makeFallbackSprite();
    const moteSprite = makeMoteSprite();
    const images: (HTMLImageElement | null)[] = sprites.map(() => null);
    const stopLoading = loadSprites(sprites, (img, i) => {
      images[i] = img;
    });

    const field = () => [...createBubbles(cfg, rand), ...createMotes(cfg, rand)].sort((a, b) => a.z - b.z);
    let bubbles: Bubble[] = field();
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let inView = false;
    let tabVisible = document.visibilityState === "visible";
    let entered = document.documentElement.dataset.cvPhase !== "closed";
    const minFrame = coarse ? 1000 / 45 : 1000 / 62;

    const resize = () => {
      const w = Math.max(1, host.clientWidth);
      const h = Math.max(1, host.clientHeight);
      const sx = w / cfg.width;
      const sy = h / cfg.height;
      for (const b of bubbles) {
        b.x *= sx;
        b.y *= sy;
      }
      cfg.width = w;
      cfg.height = h;
      dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!raf) draw(); // mantém o quadro correto mesmo parado
    };

    const draw = () => {
      ctx.clearRect(0, 0, cfg.width, cfg.height);
      for (const b of bubbles) {
        const { x, y } = drawPosition(b);
        if (y < -b.r || y > cfg.height + b.r || x < -b.r || x > cfg.width + b.r) continue;
        if (b.mote) {
          ctx.globalAlpha = b.alpha * moteGlow(b);
          const d = b.r * 5; // o halo do sprite é maior que o núcleo
          ctx.drawImage(moteSprite, x - d / 2, y - d / 2, d, d);
          continue;
        }
        const img = images[b.sprite % images.length] ?? null;
        const src: CanvasImageSource = img && img.naturalWidth > 0 ? img : fallback;
        const w = src === fallback ? 96 : img!.naturalWidth;
        const h = src === fallback ? 96 : img!.naturalHeight;
        const size = b.r * 2;
        ctx.globalAlpha = b.alpha;
        ctx.drawImage(src, x - b.r, y - (b.r * h) / w, size, (size * h) / w);
      }
      ctx.globalAlpha = 1;
    };

    // Em palcos consecutivos o mundo fixo de cada palco pode estar coberto/escondido: sem ver, sem desenhar.
    const worldLive = () =>
      !stage.hasAttribute("data-covered") && (!stage.hasAttribute("data-after-stage") || stage.hasAttribute("data-live"));
    const shouldRun = () => inView && tabVisible && entered && worldLive();

    const frame = (now: number) => {
      raf = 0;
      if (!shouldRun()) {
        last = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
      if (!last) last = now;
      acc += now - last;
      last = now;
      if (acc < minFrame - 1) return; // limita a taxa (celulares)
      const dt = Math.min(acc / 1000, 0.05); // usa o tempo ACUMULADO: a velocidade não depende da taxa
      acc = 0;
      bubbles = stepBubbles(bubbles, dt, cfg, pointer, rand);
      draw();
    };

    const sync = () => {
      if (shouldRun() && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
      if (!shouldRun() && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    // --- ponteiro: passivo, na janela, sem preventDefault ---
    let touchDown = false;
    const place = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      pointer.active = inside && (e.pointerType !== "touch" || touchDown);
    };
    const onMove = (e: PointerEvent) => place(e);
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") touchDown = true;
      place(e);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        touchDown = false;
        pointer.active = false;
      }
    };
    const onLeave = () => {
      pointer.active = false;
    };

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      sync();
    };
    const onEnter = () => {
      entered = true;
      // A rajada do mergulho só faz sentido na primeira cena (as outras estão fora da tela).
      if (stage.hasAttribute("data-first")) bubbles = bubbles.concat(spawnBurst(cfg, rand, BURST_COUNT));
      sync();
    };
    const onReveal = () => {
      bubbles = bubbles.concat(spawnBurst(cfg, rand, Math.round(BURST_COUNT * 0.7)));
      sync();
    };
    const onReplay = () => {
      entered = false;
      bubbles = bubbles.filter((b) => !b.burst);
      sync();
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting);
        sync();
      },
      { threshold: 0 },
    );
    const ro = new ResizeObserver(resize);

    const mo = new MutationObserver(sync);
    mo.observe(stage, { attributes: true, attributeFilter: ["data-covered", "data-live"] });

    resize();
    stage.setAttribute(CANVAS_ACTIVE_ATTR, "");
    io.observe(canvas);
    ro.observe(host);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(EXPERIENCE_EVENTS.enter, onEnter);
    window.addEventListener(EXPERIENCE_EVENTS.replay, onReplay);
    stage.addEventListener(REVEAL_EVENT, onReveal);

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      stopLoading();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(EXPERIENCE_EVENTS.enter, onEnter);
      window.removeEventListener(EXPERIENCE_EVENTS.replay, onReplay);
      stage.removeEventListener(REVEAL_EVENT, onReveal);
      stage.removeAttribute(CANVAS_ACTIVE_ATTR);
      canvas.width = canvas.height = 0;
    };
    // sprites/density são estáveis por cena; recriar o canvas só se mudarem
  }, [sprites, density, motes]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
