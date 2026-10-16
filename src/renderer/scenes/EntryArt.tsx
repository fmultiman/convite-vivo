"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import type { Motif as MotifName } from "@/contract/event.schema";
import type { EntryArt as EntryArtModel, ReadyImage, ResolvedDecor } from "../model";
import { Motif } from "../primitives/Motif";
import styles from "./entry-art.module.css";

type GateState = "closed" | "opening" | "open";

/**
 * Imagem de camada: aparece com fade quando carrega e some sozinha se falhar.
 * Usa apenas atributos do DOM (sem estado React): funciona também quando o
 * evento `load`/`error` acontece antes da hidratação.
 */
function LayerImage({
  image,
  className,
  priority = false,
  lazy = false,
  onReady,
  marker,
}: {
  image: ReadyImage;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  /** Chamado quando a imagem termina de carregar (a partir de um evento). */
  onReady?: () => void;
  marker?: string;
}) {
  return (
    <Image
      ref={(el) => {
        if (!el || !el.complete) return;
        if (el.naturalWidth > 0) el.dataset.loaded = "1";
        else el.dataset.failed = "1";
      }}
      src={image.src}
      width={image.width}
      height={image.height}
      alt=""
      aria-hidden="true"
      unoptimized
      priority={priority}
      loading={priority ? undefined : lazy ? "lazy" : "eager"}
      fetchPriority={priority ? "high" : "low"}
      draggable={false}
      className={`${styles.img} ${className ?? ""}`}
      data-marker={marker}
      onLoad={(e) => {
        e.currentTarget.dataset.loaded = "1";
        onReady?.();
      }}
      onError={(e) => {
        e.currentTarget.dataset.failed = "1";
      }}
    />
  );
}

function Sprite({ item, index, originX }: { item: ResolvedDecor; index: number; originX: number }) {
  const style = {
    "--x": item.x,
    "--y": item.y,
    "--w": item.width,
    "--rot": `${item.rotate}deg`,
    "--tilt": `${item.tilt}deg`,
    "--flip": item.flip ? -1 : 1,
    "--delay": `${item.delay}s`,
    // Bolhas liberadas se espalham a partir do motivo.
    "--drift": `${((item.x - originX) * 0.4).toFixed(1)}vw`,
    "--dur": `${(1.15 + (index % 4) * 0.2).toFixed(2)}s`,
  } as CSSProperties;
  return (
    <div
      className={styles.item}
      style={style}
      data-plane={item.plane}
      data-appear={item.appear}
      data-shadow={item.shadow || undefined}
    >
      <div className={styles.body} data-motion={item.appear === "onOpen" ? "release" : item.motion}>
        <div className={styles.tilt}>
          <LayerImage image={item.image} />
        </div>
      </div>
    </div>
  );
}

/** Brilhos pontuais (água e areia ao sol): posições fixas = mesmo HTML no servidor e no cliente. */
const GLINTS: { x: number; y: number; size: number; delay: number }[] = [
  { x: 74, y: 26, size: 10, delay: 0 },
  { x: 66, y: 31, size: 7, delay: 1.1 },
  { x: 82, y: 34, size: 8, delay: 2.2 },
  { x: 58, y: 38, size: 6, delay: 0.6 },
  { x: 91, y: 41, size: 7, delay: 1.7 },
  { x: 70, y: 45, size: 9, delay: 2.9 },
  { x: 50, y: 52, size: 6, delay: 1.4 },
  { x: 33, y: 63, size: 6, delay: 0.3 },
  { x: 78, y: 29, size: 6, delay: 3.3 },
  { x: 62, y: 35, size: 8, delay: 2.5 },
  { x: 86, y: 38, size: 5, delay: 0.9 },
  { x: 44, y: 58, size: 5, delay: 3.0 },
];

/**
 * Arte em camadas da entrada: fundo + decoração + motivo em imagem, todos
 * registrados ao "palco" (a caixa da arte de fundo), de modo que o envelope
 * fica sobre a areia em qualquer tela. Só movimento CSS (transform/opacity).
 */
export function EntryArt({
  art,
  state,
  reducedMotion,
  tint,
  ctaLabel,
  tag,
  motif,
  buttonRef,
  onEnter,
  describedBy,
}: {
  art: EntryArtModel;
  state: GateState;
  reducedMotion: boolean;
  /** Cor do véu do mergulho (cor média da cena seguinte). */
  tint?: string;
  ctaLabel: string;
  tag?: string;
  motif: MotifName;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onEnter: () => void;
  describedBy: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Em conexões lentas o fundo e o envelope têm prioridade: o restante só começa
  // a baixar depois que o fundo chega (ou após um prazo, se o evento se perder).
  const [secondary, setSecondary] = useState(false);
  const { background, motif: motifImage, open: openImage, tag: tagImage, motifPlacement: mp, tagPlacement: tp } = art;

  useEffect(() => {
    const bg = rootRef.current?.querySelector<HTMLImageElement>('[data-marker="bg"]');
    if (bg?.complete) {
      const id = requestAnimationFrame(() => setSecondary(true));
      return () => cancelAnimationFrame(id);
    }
    const timer = window.setTimeout(() => setSecondary(true), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  // Parallax leve só com ponteiro fino (mouse); sem listeners em toque nem reduced motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || state !== "closed") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--px", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        root.style.setProperty("--py", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [reducedMotion, state]);

  const resting = art.decor.filter((d) => d.appear === "always");
  const released = art.decor.filter((d) => d.appear === "onOpen");
  const stageStyle = {
    "--aspect": `${background.width} / ${background.height}`,
    "--aspect-n": background.width / background.height,
    "--ox": `${mp.x}%`,
    "--oy": `${mp.y}%`,
    "--tint": tint,
  } as CSSProperties;
  const motifStyle = {
    "--x": mp.x,
    "--y": mp.y,
    "--w": mp.width,
    "--rot": `${mp.rotate}deg`,
    "--tilt": `${mp.tilt}deg`,
    "--env-aspect": motifImage ? motifImage.width / motifImage.height : 1.6,
    "--open-w": motifImage && openImage ? `${((openImage.width / motifImage.width) * 100).toFixed(1)}%` : "100%",
  } as CSSProperties;

  return (
    <div ref={rootRef} className={styles.art} data-state={state} data-reduced={reducedMotion || undefined}>
      {/* Telas largas: o mesmo fundo desfocado preenche as laterais da coluna central. */}
      <div className={styles.fill} aria-hidden="true">
        <LayerImage image={background} className={styles.fillImg} lazy />
      </div>

      <div className={styles.stage} style={stageStyle}>
        <div className={styles.camera}>
        <div className={styles.world}>
          <LayerImage image={background} className={styles.bg} priority marker="bg" onReady={() => setSecondary(true)} />
          <div className={styles.sunPath} aria-hidden="true" />
          <div className={styles.glints} aria-hidden="true">
            {GLINTS.map((g, i) => (
              <span
                key={i}
                className={styles.glint}
                style={{ left: `${g.x}%`, top: `${g.y}%`, width: g.size, height: g.size, animationDelay: `${g.delay}s` }}
              />
            ))}
          </div>

          {(["far", "mid", "near"] as const).map((plane) =>
            (secondary ? resting : [])
              .filter((d) => d.plane === plane)
              .map((item, i) => <Sprite key={`${plane}-${i}`} item={item} index={i} originX={mp.x} />),
          )}

          {tagImage && tag ? (
            <p
              className={styles.tag}
              style={
                {
                  "--x": tp.x,
                  "--y": tp.y,
                  "--w": tp.width,
                  "--rot": `${tp.rotate}deg`,
                  "--tilt": `${tp.tilt}deg`,
                  aspectRatio: `${tagImage.width} / ${tagImage.height}`,
                } as CSSProperties
              }
            >
              {secondary ? <LayerImage image={tagImage} className={styles.tagImg} /> : null}
              <span className={styles.tagText}>{tag}</span>
            </p>
          ) : null}

          <button
            ref={buttonRef}
            type="button"
            className={styles.trigger}
            style={motifStyle}
            onClick={onEnter}
            aria-describedby={describedBy}
            data-has-open={openImage ? "1" : undefined}
          >
            <span className={styles.envStack}>
              <span className={styles.glow} aria-hidden="true" />
              <span className={styles.envTilt}>
                <span className={styles.shadow} aria-hidden="true" />
                {motifImage ? <LayerImage image={motifImage} className={styles.envClosed} priority /> : null}
                {openImage && secondary ? <LayerImage image={openImage} className={styles.envOpen} /> : null}
                {/* Reserva vetorial: só aparece se a imagem do envelope falhar (ou não existir). */}
                <span className={styles.fallbackMotif} data-always={motifImage ? undefined : "1"} aria-hidden="true">
                  <Motif name={motif} />
                </span>
              </span>
            </span>
            <span className={styles.pill}>{ctaLabel}</span>
          </button>

          {(secondary ? released : []).map((item, i) => (
            <Sprite key={`rel-${i}`} item={item} index={i} originX={mp.x} />
          ))}

          <div className={styles.grade} aria-hidden="true" />
        </div>
        </div>
      </div>

      <div className={styles.wash} data-tint={tint ? "" : undefined} aria-hidden="true" />
    </div>
  );
}
