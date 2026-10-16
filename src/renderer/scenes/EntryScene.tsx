"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { ResolvedScene } from "../model";
import { AssetImage } from "../primitives/AssetImage";
import { Motif } from "../primitives/Motif";
import { EntryArt } from "./EntryArt";
import { EXPERIENCE_EVENTS, usePrefersReducedMotion } from "../client/hooks";
import styles from "./entry.module.css";

type EntryModel = Extract<ResolvedScene, { kind: "entry" }>;
type GateState = "closed" | "opening" | "open";

const TRANSITION_MS = 1600;
/** A entrada em camadas tem a abertura do envelope + mergulho (ver entry-art.module.css). */
const ART_TRANSITION_MS = 1700;
/** Com reduced motion o estado aberto fica visível por um instante, sem movimento. */
const ART_REDUCED_MS = 500;

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
    // closed | opening | open: as cenas seguintes sincronizam a chegada com o mergulho.
    root.dataset.cvPhase = state;
    main?.toggleAttribute("inert", covering);
    return () => {
      delete root.dataset.cvGate;
      delete root.dataset.cvPhase;
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

  const art = scene.art;

  const finish = () => {
    window.clearTimeout(timer.current);
    setState("open");
    // Remove o inert já (o efeito só roda depois da pintura) para o foco não falhar.
    const main = document.getElementById(mainId);
    main?.removeAttribute("inert");
    requestAnimationFrame(() => main?.focus({ preventScroll: true }));
  };

  const enter = () => {
    if (state !== "closed") return;
    // Disparado de dentro do clique: conta como gesto do usuário para o áudio.
    window.dispatchEvent(new Event(EXPERIENCE_EVENTS.enter));
    if (reducedMotion && !art) {
      finish();
      return;
    }
    setState("opening");
    const duration = art ? (reducedMotion ? ART_REDUCED_MS : ART_TRANSITION_MS) : TRANSITION_MS;
    timer.current = window.setTimeout(finish, duration);
  };

  // A transição nunca prende o visitante: Escape/Enter/Espaço ou um toque a encerram.
  useEffect(() => {
    if (state !== "opening") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const titleId = `${scene.id}-title`;

  return (
    <section
      id={scene.id}
      className={styles.gate}
      data-state={state}
      data-art={art ? "" : undefined}
      aria-labelledby={titleId}
      hidden={state === "open"}
      onClick={state === "opening" ? finish : undefined}
    >
      {art ? (
        <EntryArt
          art={art}
          state={state}
          reducedMotion={reducedMotion}
          tint={scene.transitionTint}
          ctaLabel={scene.ctaLabel}
          tag={scene.tag}
          motif={scene.motif}
          buttonRef={buttonRef}
          onEnter={enter}
          describedBy={titleId}
        />
      ) : scene.background ? (
        <div className={styles.background}>
          <AssetImage asset={scene.background} priority sizes="100vw" className={styles.backgroundMedia} />
        </div>
      ) : null}

      <div className={styles.inner}>
        {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}

        {art ? null : (
          <button ref={buttonRef} type="button" className={styles.trigger} onClick={enter} aria-describedby={titleId}>
            <span className={styles.motifWrap}>
              <Motif name={scene.motif} open={state !== "closed"} className={styles.motif} />
              {scene.tag ? <span className={styles.tag}>{scene.tag}</span> : null}
            </span>
            <span className={styles.cta}>{scene.ctaLabel}</span>
          </button>
        )}

        <h1 id={titleId} className={styles.headline}>
          {scene.headline}
        </h1>
        {scene.body ? <p className={styles.body}>{scene.body}</p> : null}

        <noscript>
          <a className={styles.noscriptLink} href={`#${mainId}`}>
            {scene.ctaLabel}
          </a>
        </noscript>
      </div>

      {!art && state === "opening" ? <TransitionLayer kind={scene.transition} /> : null}
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
