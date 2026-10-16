import type { CSSProperties } from "react";
import type { Theme } from "@/contract/event.schema";
import styles from "./primitives.module.css";

/** Pseudo-aleatório determinístico: mesmo HTML no servidor e no cliente. */
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Camada decorativa de partículas (bolhas, brilhos, pétalas), apenas CSS.
 * Escondida de leitores de tela e congelada com prefers-reduced-motion.
 */
export function Particles({ kind, count = 16 }: { kind: Theme["particles"]; count?: number }) {
  if (kind === "none") return null;
  return (
    <div className={styles.particles} data-kind={kind} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={styles.particle}
          style={
            {
              "--x": `${Math.round(seeded(i, 1) * 100)}%`,
              "--size": `${Math.round(6 + seeded(i, 2) * 22)}px`,
              "--duration": `${Math.round(9 + seeded(i, 3) * 12)}s`,
              "--delay": `${-Math.round(seeded(i, 4) * 20)}s`,
              "--drift": `${Math.round(seeded(i, 5) * 40 - 20)}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
