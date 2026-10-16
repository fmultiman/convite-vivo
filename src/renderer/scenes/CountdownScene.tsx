"use client";

import type { LifecycleInfo, ResolvedScene } from "../model";
import { usePhase } from "../client/hooks";
import styles from "./scenes.module.css";

type CountdownModel = Extract<ResolvedScene, { kind: "countdown" }>;

/**
 * Contagem regressiva pela data no fuso do evento. O HTML estático mostra a
 * data; o número de dias é calculado no navegador do visitante.
 */
export function CountdownScene({
  scene,
  lifecycle,
  dateLabel,
}: {
  scene: CountdownModel;
  lifecycle: LifecycleInfo;
  dateLabel: string;
}) {
  const state = usePhase(lifecycle);

  let content: React.ReactNode = <p className={styles.countdownText}>{dateLabel}</p>;
  if (state?.phase === "invitation") {
    content =
      state.daysLeft === 1 ? (
        <p className={styles.countdownText}>É amanhã!</p>
      ) : (
        <p className={styles.countdownText}>
          <span className={styles.countdownNumber}>{state.daysLeft}</span> dias
        </p>
      );
  } else if (state?.phase === "event_day") {
    content = <p className={styles.countdownText}>{lifecycle.eventDayMessage}</p>;
  } else if (state) {
    content = <p className={styles.countdownText}>{lifecycle.postEvent.enabled ? lifecycle.postEvent.headline : "Esta celebração já aconteceu."}</p>;
  }

  return (
    <section id={scene.id} className={`${styles.section} ${styles.countdown}`} aria-label={scene.headline ?? "Contagem regressiva"}>
      {scene.headline && state?.phase === "invitation" ? <p className={styles.eyebrow}>{scene.headline}</p> : null}
      <div aria-live="polite">{content}</div>
    </section>
  );
}
