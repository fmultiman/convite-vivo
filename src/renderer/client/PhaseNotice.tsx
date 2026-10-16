"use client";

import type { LifecycleInfo } from "../model";
import { usePhase } from "./hooks";
import styles from "./client.module.css";

/** Aviso no topo quando o evento é hoje ou já passou. Nada durante o convite. */
export function PhaseNotice({ lifecycle }: { lifecycle: LifecycleInfo }) {
  const state = usePhase(lifecycle);
  if (!state || state.phase === "invitation") return null;

  if (state.phase === "event_day") {
    return (
      <div className={styles.phaseNotice} role="status">
        {lifecycle.eventDayMessage}
      </div>
    );
  }

  const { postEvent } = lifecycle;
  return (
    <div className={styles.phaseNotice} role="status">
      {postEvent.enabled ? (
        <>
          <strong>{postEvent.headline}</strong>
          {postEvent.body ? <span> {postEvent.body}</span> : null}
        </>
      ) : (
        "Esta celebração já aconteceu. Obrigado pelo carinho!"
      )}
    </div>
  );
}
