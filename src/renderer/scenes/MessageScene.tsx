import type { ResolvedScene } from "../model";
import { ReplayButton } from "../client/ReplayButton";
import styles from "./scenes.module.css";

type MessageModel = Extract<ResolvedScene, { kind: "message" }>;

/** Mensagem de texto (encerramento, traje, agradecimento...). */
export function MessageScene({ scene }: { scene: MessageModel }) {
  const titleId = `${scene.id}-title`;
  return (
    <section id={scene.id} className={`${styles.section} ${styles.message}`} aria-labelledby={titleId}>
      {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
      <h2 id={titleId} className={styles.headline}>
        {scene.headline}
      </h2>
      {scene.body ? <p className={styles.body}>{scene.body}</p> : null}
      {scene.replay ? <ReplayButton /> : null}
    </section>
  );
}
