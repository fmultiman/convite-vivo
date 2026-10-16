"use client";

import { useFxMode } from "./hooks";
import styles from "../experience.module.css";

/**
 * Alternador de revisão (só no painel de prévia): compara a cena submarina
 * só com CSS (A) e híbrida, CSS + canvas atmosférico (B). Usa a marca "#fx=css" na URL.
 */
export function FxSwitch() {
  const mode = useFxMode();
  const set = (next: "canvas" | "css") => {
    const url = new URL(window.location.href);
    url.hash = next === "css" ? "fx=css" : "";
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  return (
    <div className={styles.fxSwitch} role="group" aria-label="Efeitos da cena submarina">
      <span>Cena submarina:</span>
      <button type="button" aria-pressed={mode === "css"} onClick={() => set("css")}>
        A · só CSS
      </button>
      <button type="button" aria-pressed={mode === "canvas"} onClick={() => set("canvas")}>
        B · híbrido (CSS + Canvas)
      </button>
    </div>
  );
}
