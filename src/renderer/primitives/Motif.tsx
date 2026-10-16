import type { Motif as MotifName } from "@/contract/event.schema";
import styles from "./primitives.module.css";

/**
 * Motivos gráficos genéricos (envelope, concha, cortina, presente, selo).
 * São vetores neutros coloridos pelos tokens do evento — não ilustrações
 * definitivas. `open` aciona a animação de abertura via CSS.
 */
export function Motif({ name, open = false, className }: { name: MotifName; open?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      className={`${styles.motif} ${className ?? ""}`}
      data-motif={name}
      data-open={open}
      aria-hidden="true"
      focusable="false"
    >
      {motifs[name]}
    </svg>
  );
}

const motifs: Record<MotifName, React.ReactNode> = {
  envelope: (
    <g>
      <rect x="30" y="50" width="180" height="116" rx="10" className={styles.fill} />
      <path d="M30 160 L120 104 L210 160" className={styles.line} />
      <path d="M30 56 L120 118 L210 56 Z" className={`${styles.fill} ${styles.line} ${styles.flap}`} />
      <circle cx="120" cy="112" r="15" className={styles.accentFill} />
      <path d="M114 112 l4 4 l8 -9" className={styles.sealMark} />
    </g>
  ),
  shell: (
    <g>
      <path
        d="M40 120 Q120 196 200 120 Z"
        className={`${styles.fill} ${styles.line}`}
      />
      <circle cx="120" cy="128" r="10" className={styles.pearl} />
      <g className={styles.lid}>
        <path
          d="M40 120 Q40 40 120 30 Q200 40 200 120 Q160 112 120 120 Q80 112 40 120 Z"
          className={`${styles.fill} ${styles.line}`}
        />
        <path
          d="M120 32 L120 118 M120 32 L84 114 M120 32 L156 114 M120 32 L56 116 M120 32 L184 116"
          className={styles.line}
        />
      </g>
    </g>
  ),
  curtain: (
    <g>
      <rect x="28" y="22" width="184" height="10" rx="5" className={styles.accentFill} />
      <rect x="40" y="34" width="160" height="134" rx="6" className={styles.glow} />
      <path
        d="M36 32 H120 V168 Q96 150 84 168 Q70 150 58 168 Q46 150 36 168 Z"
        className={`${styles.fill} ${styles.line} ${styles.drapeLeft}`}
      />
      <path
        d="M204 32 H120 V168 Q144 150 156 168 Q170 150 182 168 Q194 150 204 168 Z"
        className={`${styles.fill} ${styles.line} ${styles.drapeRight}`}
      />
    </g>
  ),
  gift: (
    <g>
      <rect x="58" y="86" width="124" height="82" rx="8" className={`${styles.fill} ${styles.line}`} />
      <rect x="112" y="86" width="16" height="82" className={styles.accentFill} />
      <g className={styles.lid}>
        <rect x="50" y="64" width="140" height="26" rx="6" className={`${styles.fill} ${styles.line}`} />
        <rect x="112" y="64" width="16" height="26" className={styles.accentFill} />
        <path d="M120 64 Q96 30 84 52 Q80 64 120 64 Q160 64 156 52 Q144 30 120 64" className={styles.line} />
      </g>
    </g>
  ),
  seal: (
    <g>
      <rect x="40" y="40" width="160" height="120" rx="6" className={`${styles.fill} ${styles.line}`} />
      <path d="M40 40 L120 104 L200 40" className={styles.line} />
      <g className={styles.sealGroup}>
        <path
          d="M120 76 q8 -6 14 2 q10 0 8 10 q8 6 0 14 q2 10 -8 10 q-6 8 -14 2 q-8 6 -14 -2 q-10 0 -8 -10 q-8 -8 0 -14 q-2 -10 8 -10 q6 -8 14 -2 Z"
          className={styles.accentFill}
        />
        <circle cx="120" cy="98" r="12" className={styles.sealInner} />
      </g>
    </g>
  ),
};
