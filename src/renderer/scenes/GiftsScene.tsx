import type { ExperienceModel, ResolvedScene } from "../model";
import { PendingBadge } from "../primitives/Pending";
import styles from "./scenes.module.css";

type GiftsModel = Extract<ResolvedScene, { kind: "gifts" }>;

/** Gift Information: orientações de presente em texto. Some se não houver nada confirmado. */
export function GiftsScene({ scene, gifts }: { scene: GiftsModel; gifts: ExperienceModel["gifts"] }) {
  if (!gifts || gifts.items.length === 0) return null;
  const titleId = `${scene.id}-title`;
  return (
    <section id={scene.id} className={`${styles.section} ${styles.card}`} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.headline}>
        {scene.headline ?? "Presentes"}
      </h2>
      {gifts.intro ? <p className={styles.body}>{gifts.intro}</p> : null}
      <ul className={styles.giftList}>
        {gifts.items.map((item) => (
          <li key={item.text}>
            {item.text} {item.pending ? <PendingBadge /> : null}
          </li>
        ))}
      </ul>
      {gifts.note ? <p className={styles.note}>{gifts.note}</p> : null}
    </section>
  );
}
