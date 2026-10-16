"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ResolvedScene } from "../model";
import { AssetImage } from "../primitives/AssetImage";
import { Motif } from "../primitives/Motif";
import { EXPERIENCE_EVENTS, usePrefersReducedMotion } from "../client/hooks";
import styles from "./entry.module.css";

type EntryModel = Extract<ResolvedScene, { kind: "entry" }>;
type GateState = "closed" | "opening" | "open";

const TRANSITION_MS = 1600;

/**
 * Hero/Entry: primeira tela com o motivo (envelope, selo...) e a interação
 * inicial. Com JavaScript, cobre a tela até o toque do visitante; sem
 * JavaScript, é apenas o primeiro bloco da página com link para o conteúdo.
 */
export function EntryScene({ scene, mainId }: { scene: EntryModel; mainId: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const [state, setState] = useState<GateState>("closed");
  const timer = useRef<number | undefined>(undefined);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Enquanto a entrada cobre a tela, o conteúdo atrás fica inerte e sem rolagem.
  useEffect(() => {
    const covering = state !== "open";
    const root = document.documentElement;
    const main = document.getElementById(mainId);
    root.dataset.cvGate = covering ? "closed" : "open";
    main?.toggleAttribute("inert", covering);
    return () => {
      delete root.dataset.cvGate;
      main?.removeAttribute("inert");
    };
  }, [state, mainId]);

  useEffect(() => {
    const onReplay = () => {
      window.clearTimeout(timer.current);
      setState("closed");
      requestAnimationFrame(() => buttonRef.current?.focus());
    };
    window.addEventListener(EXPERIENCE_EVENTS.replay, onReplay);
    return () => {
      window.removeEventListener(EXPERIENCE_EVENTS.replay, onReplay);
      window.clearTimeout(timer.current);
    };
  }, []);

  const finish = () => {
    setState("open");
    requestAnimationFrame(() => document.getElementById(mainId)?.focus({ preventScroll: true }));
  };

  const enter = () => {
    if (state !== "closed") return;
    // Disparado de dentro do clique: conta como gesto do usuário para o áudio.
    window.dispatchEvent(new Event(EXPERIENCE_EVENTS.enter));
    if (reducedMotion) {
      finish();
      return;
    }
    setState("opening");
    timer.current = window.setTimeout(finish, TRANSITION_MS);
  };

  return (
    <section
      id={scene.id}
      className={styles.gate}
      data-state={state}
      aria-labelledby={`${scene.id}-title`}
      hidden={state === "open"}
    >
      {scene.background ? (
        <div className={styles.background}>
          <AssetImage asset={scene.background} priority sizes="100vw" className={styles.backgroundMedia} />
        </div>
      ) : null}

      <div className={styles.inner}>
        {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}

        <button ref={buttonRef} type="button" className={styles.trigger} onClick={enter} aria-describedby={`${scene.id}-title`}>
          <span className={styles.motifWrap}>
            <Motif name={scene.motif} open={state !== "closed"} className={styles.motif} />
            {scene.tag ? <span className={styles.tag}>{scene.tag}</span> : null}
          </span>
          <span className={styles.cta}>{scene.ctaLabel}</span>
        </button>

        <h1 id={`${scene.id}-title`} className={styles.headline}>
          {scene.headline}
        </h1>
        {scene.body ? <p className={styles.body}>{scene.body}</p> : null}

        <noscript>
          <a className={styles.noscriptLink} href={`#${mainId}`}>
            {scene.ctaLabel}
          </a>
        </noscript>
      </div>

      {state === "opening" ? <TransitionLayer kind={scene.transition} /> : null}
    </section>
  );
}

/** Bolhas/brilhos que sobem pela tela durante a passagem para a experiência. */
function TransitionLayer({ kind }: { kind: EntryModel["transition"] }) {
  if (kind === "fade") return <div className={styles.transition} data-kind="fade" aria-hidden="true" />;
  return (
    <div className={styles.transition} data-kind={kind} aria-hidden="true">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          style={
            {
              "--x": `${(i * 37) % 100}%`,
              "--size": `${10 + ((i * 53) % 46)}px`,
              "--delay": `${((i * 29) % 60) * 10}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
