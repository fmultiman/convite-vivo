"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { BubbleCanvas } from "../fx/BubbleCanvas";
import { FishDefs, FishSprite, usedVariants } from "../fx/Fish";
import { EXPERIENCE_EVENTS, useFxMode, usePrefersReducedMotion } from "../client/hooks";
import { LayerImage } from "../primitives/LayerImage";
import type { ResolvedDecor, ResolvedScene } from "../model";
import styles from "./stage.module.css";

type StageModel = Extract<ResolvedScene, { kind: "stage" }>;

/**
 * Raios de luz vindos de cima. Posição/ângulo/ritmo diferentes por raio, para a luz
 * "respirar" sem repetir. Só opacity/transform animam; a intensidade geral é estática.
 */
const RAYS = [
  { x: 24, w: 11, a: -19, dur: 9, delay: 0, o: 0.55 },
  { x: 40, w: 19, a: -8, dur: 12, delay: -3.5, o: 0.8 },
  { x: 55, w: 15, a: 4, dur: 10, delay: -6, o: 0.7 },
  { x: 69, w: 12, a: 15, dur: 13, delay: -2, o: 0.6 },
  { x: 83, w: 8, a: 24, dur: 8.5, delay: -5, o: 0.45 },
] as const;

function Light({ intensity }: { intensity: number }) {
  if (intensity <= 0) return null;
  return (
    <div className={styles.light} style={{ "--light": intensity } as CSSProperties} aria-hidden="true">
      <div className={styles.surface} />
      {RAYS.map((r, i) => (
        <div
          key={i}
          className={styles.ray}
          style={{ "--x": r.x, "--w": r.w, "--a": r.a, "--o": r.o, "--dur": `${r.dur}s`, "--delay": `${r.delay}s` } as CSSProperties}
        />
      ))}
      <div className={styles.caustics} />
    </div>
  );
}

/** Partículas em CSS: o equivalente simples da neve marinha do canvas (só sem canvas). */
function Motes({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className={styles.motes} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": (i * 37 + 13) % 100,
              "--y": (i * 53 + 7) % 82,
              "--s": `${(2.2 + (i % 3) * 1.1).toFixed(1)}px`,
              "--dur": `${(18 + (i % 5) * 3.5).toFixed(1)}s`,
              "--delay": `${(-i * 2.3).toFixed(1)}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Um plano de profundidade: deriva lenta (CSS) + parallax leve do mouse (variáveis --px/--py). */
function Plane({ name, children }: { name: "bg" | "far" | "mid" | "near" | "front"; children: ReactNode }) {
  return (
    <div className={styles.plane} data-layer={name}>
      {children}
    </div>
  );
}

/**
 * Parallax do mouse: atualiza duas variáveis CSS no palco (sem estado React) com
 * suavização em rAF, só enquanto o ponteiro se move. Eventos de toque são ignorados
 * (a deriva lenta em CSS já dá profundidade); desligado com reduced motion.
 */
function useStageParallax(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const tick = () => {
      raf = 0;
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.003 || Math.abs(ty - cy) > 0.003) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
      el.style.removeProperty("--px");
      el.style.removeProperty("--py");
    };
  }, [ref, enabled]);
}

function Sprite({ item, index }: { item: ResolvedDecor; index: number }) {
  const style = {
    "--x": item.x,
    "--y": item.y,
    "--w": item.width,
    "--rot": `${item.rotate}deg`,
    "--tilt": `${item.tilt}deg`,
    "--flip": item.flip ? -1 : 1,
    "--delay": `${item.delay}s`,
    // Fallback em CSS das bolhas: durações variadas, sem aleatoriedade (SSR = cliente).
    "--dur": `${(15 + (index % 5) * 2.6).toFixed(1)}s`,
    // Balanço das plantas: períodos diferentes (sem aleatoriedade).
    "--sway": `${(4.8 + ((index * 7) % 5) * 0.85).toFixed(2)}s`,
  } as CSSProperties;
  return (
    <div className={styles.item} style={style} data-plane={item.plane} data-appear={item.appear} data-shadow={item.shadow || undefined}>
      <div className={styles.mover} data-motion={item.motion}>
        <div className={styles.tilt}>
          <LayerImage image={item.image} />
        </div>
      </div>
    </div>
  );
}

/**
 * Palco em camadas (cena "stage"), de trás para a frente:
 *   fundo estático · raios de luz (CSS) · distante (decoração + peixes) · intermediária
 *   · partículas CSS (só sem canvas) · canvas atmosférico (microbolhas + neve marinha)
 *   · próxima (decoração + peixe desfocado) · primeiro plano (bolhas CSS) · profundidade
 *   (vinheta) · texto HTML.
 *
 * Híbrido: o CSS carrega o que é visível e decorativo (bolhas grandes, peixes, plantas,
 * luz); o canvas é um aprimoramento opcional, só atmosférico. Sem canvas (indisponível,
 * reduced motion ou "#fx=css") a cena continua completa, com partículas em CSS.
 */
export function StageScene({ scene, first, tint }: { scene: StageModel; first: boolean; tint?: string }) {
  const { art } = scene;
  const fx = useFxMode();
  const reduced = usePrefersReducedMotion();
  const [armed, setArmed] = useState(false);

  // As imagens da cena só começam a baixar depois do essencial da entrada (ou ao tocar).
  useEffect(() => {
    const hasGate = document.documentElement.dataset.cvPhase !== undefined;
    const timer = window.setTimeout(() => setArmed(true), hasGate ? 1200 : 0);
    const arm = () => setArmed(true);
    window.addEventListener(EXPERIENCE_EVENTS.enter, arm);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(EXPERIENCE_EVENTS.enter, arm);
    };
  }, []);

  const canvas = art?.canvas ?? null;
  const spriteUrls = useMemo(() => canvas?.sprites.map((s) => s.src) ?? [], [canvas]);
  const useCanvas = Boolean(canvas) && fx === "canvas" && !reduced;
  const stageRef = useRef<HTMLElement>(null);
  useStageParallax(stageRef, (scene.ambience?.parallax ?? true) && !reduced);
  const titleId = scene.headline ? `${scene.id}-title` : undefined;

  const text = (
    <div className={styles.text}>
      {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
      {scene.headline ? (
        <h2 id={titleId} className={styles.headline}>
          {scene.headline}
        </h2>
      ) : null}
      {scene.body ? <p className={styles.body}>{scene.body}</p> : null}
    </div>
  );

  if (!art) {
    // Fundo pendente/indisponível: o texto continua legível sobre o fundo do tema.
    return (
      <section id={scene.id} className={styles.plain} aria-labelledby={titleId}>
        {text}
      </section>
    );
  }

  const decor = art.decor.filter((d) => d.appear !== "onOpen");
  const fishList = scene.fish ?? [];
  const fishPrefix = `${scene.id}-fish`;
  const layer = (plane: "far" | "mid" | "near" | "front") => [
    ...decor.filter((d) => d.plane === plane).map((item, i) => <Sprite key={`${plane}-${i}`} item={item} index={i} />),
    ...(plane === "front"
      ? []
      : fishList.flatMap((f, i) => (f.plane === plane ? [<FishSprite key={`fish-${i}`} fish={f} prefix={fishPrefix} index={i} />] : []))),
  ];
  const stageStyle = {
    "--aspect": `${art.background.width} / ${art.background.height}`,
    "--aspect-n": art.background.width / art.background.height,
    "--tint": tint,
  } as CSSProperties;

  return (
    <section ref={stageRef} id={scene.id} className={styles.stage} style={stageStyle} data-stage data-first={first || undefined} aria-labelledby={titleId}>
      {/* Telas largas: o mesmo fundo desfocado preenche as laterais da coluna central. */}
      <div className={styles.fill} aria-hidden="true">
        {armed ? <LayerImage image={art.background} className={styles.fillImg} lazy /> : null}
      </div>

      <div className={styles.box}>
        <div className={styles.world}>
          {fishList.length > 0 ? <FishDefs prefix={fishPrefix} variants={usedVariants(fishList)} /> : null}
          {/* A — fundo */}
          <Plane name="bg">{armed ? <LayerImage image={art.background} className={styles.bg} /> : null}</Plane>
          {/* Luz vinda de cima */}
          <Light intensity={scene.ambience?.light ?? 0.6} />
          {/* B — decoração distante e intermediária (com os peixes de cada plano) */}
          <Plane name="far">{layer("far")}</Plane>
          <Plane name="mid">{layer("mid")}</Plane>
          {/* Partículas em CSS (somem quando o canvas assume) */}
          <Motes count={scene.ambience?.motes ?? 10} />
          {/* C — canvas atmosférico */}
          {useCanvas && canvas ? (
            <BubbleCanvas sprites={spriteUrls} density={canvas.density} motes={canvas.motes} className={styles.canvas} />
          ) : null}
          {/* D — decoração próxima */}
          <Plane name="near">{layer("near")}</Plane>
          {/* Primeiro plano: bolhas CSS, o elemento mais visível */}
          <Plane name="front">{layer("front")}</Plane>
          <div className={styles.depth} aria-hidden="true" />
          {tint ? <div className={styles.haze} aria-hidden="true" /> : null}
        </div>
      </div>

      {/* E — interface HTML */}
      {text}
      {scene.scrollHint ? (
        <p className={styles.hint}>
          <span>{scene.scrollHint}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </p>
      ) : null}
    </section>
  );
}
