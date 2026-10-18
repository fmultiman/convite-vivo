import type { CSSProperties } from "react";
import type { ResolvedScene } from "../model";
import { ReplayButton } from "../client/ReplayButton";
import { LayerImage } from "../primitives/LayerImage";
import styles from "./scenes.module.css";

type MessageModel = Extract<ResolvedScene, { kind: "message" }>;

/** Brilhos pontuais do encerramento (posições fixas: mesmo HTML no servidor e no cliente). */
const ENDING_GLINTS = [
  { x: 18, y: 58, s: 7, d: 0 },
  { x: 74, y: 52, s: 9, d: 1.4 },
  { x: 52, y: 66, s: 6, d: 2.3 },
  { x: 86, y: 72, s: 7, d: 0.8 },
  { x: 30, y: 78, s: 8, d: 1.9 },
  { x: 64, y: 84, s: 6, d: 2.9 },
] as const;

/** Mensagem de texto (encerramento, traje, agradecimento...). Com `backdrop`, vira o encerramento ilustrado. */
export function MessageScene({ scene }: { scene: MessageModel }) {
  const titleId = `${scene.id}-title`;
  const illustrated = Boolean(scene.backdrop);
  return (
    <section
      id={scene.id}
      className={`${styles.section} ${styles.message} ${illustrated ? styles.ending : ""}`}
      aria-labelledby={titleId}
      data-illustrated={illustrated || undefined}
    >
      {scene.backdrop ? (
        <div className={styles.endStage} aria-hidden="true">
          <LayerImage image={scene.backdrop} className={styles.endBg} lazy />
          <div className={styles.endWarm} />
          {ENDING_GLINTS.map((g, i) => (
            <span key={i} className={styles.endGlint} style={{ left: `${g.x}%`, top: `${g.y}%`, width: g.s, height: g.s, animationDelay: `${g.d}s` }} />
          ))}
          {scene.ornaments.map((o, i) => (
            <div
              key={i}
              className={styles.endOrn}
              data-motion={o.motion}
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${o.width}%`, "--rot": `${o.rotate}deg`, "--flip": o.flip ? -1 : 1 } as CSSProperties}
            >
              <LayerImage image={o.image} lazy />
            </div>
          ))}
        </div>
      ) : null}
      {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
      <h2 id={titleId} className={styles.headline}>
        {scene.headline}
      </h2>
      {scene.body ? <p className={styles.body}>{scene.body}</p> : null}
      {scene.replay ? <ReplayButton /> : null}
    </section>
  );
}
