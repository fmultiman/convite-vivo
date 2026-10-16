"use client";

import { EXPERIENCE_EVENTS } from "./hooks";
import styles from "./client.module.css";

export function ReplayButton({ label = "Rever o convite" }: { label?: string }) {
  return (
    <button
      type="button"
      className={styles.replay}
      onClick={() => {
        window.dispatchEvent(new Event(EXPERIENCE_EVENTS.replay));
        window.scrollTo({ top: 0 });
      }}
    >
      {label}
    </button>
  );
}
