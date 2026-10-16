"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Motif as MotifName } from "@/contract/event.schema";
import { Motif } from "../primitives/Motif";
import { EXPERIENCE_EVENTS } from "../client/hooks";
import styles from "./reveal.module.css";

export interface RevealSceneProps {
  id: string;
  motif: MotifName;
  prompt: string;
  eyebrow?: string;
  headline?: string;
  children: ReactNode;
}

/**
 * Interactive Reveal: um motivo (concha, cortina, presente...) que, ao toque,
 * revela o conteúdo aninhado. O conteúdo está no HTML desde o início: sem
 * JavaScript ele fica visível; com JavaScript, aguarda a interação.
 */
export function RevealScene({ id, motif, prompt, eyebrow, headline, children }: RevealSceneProps) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = `${id}-content`;

  useEffect(() => {
    const onReplay = () => setOpen(false);
    window.addEventListener(EXPERIENCE_EVENTS.replay, onReplay);
    return () => window.removeEventListener(EXPERIENCE_EVENTS.replay, onReplay);
  }, []);

  const reveal = () => {
    setOpen(true);
    requestAnimationFrame(() => contentRef.current?.focus({ preventScroll: true }));
  };

  return (
    <section id={id} className={styles.reveal} data-state={open ? "open" : "closed"} aria-labelledby={headline ? `${id}-title` : undefined}>
      {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
      {headline ? (
        <h2 id={`${id}-title`} className={styles.headline}>
          {headline}
        </h2>
      ) : null}

      {/* O botão permanece montado para que o motivo anime a abertura. */}
      <button
        type="button"
        className={styles.trigger}
        onClick={reveal}
        aria-expanded={open}
        aria-controls={contentId}
        disabled={open}
      >
        <Motif name={motif} open={open} className={styles.motif} />
        {open ? null : <span className={styles.prompt}>{prompt}</span>}
      </button>

      <div id={contentId} ref={contentRef} tabIndex={-1} className={styles.content}>
        {children}
      </div>
    </section>
  );
}
