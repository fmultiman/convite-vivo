import type { ResolvedScene } from "../model";
import { AssetImage } from "../primitives/AssetImage";
import styles from "./scenes.module.css";

type ImageModel = Extract<ResolvedScene, { kind: "image" }>;

/** Image Scene: imagem (ou placeholder) com texto real e editável. */
export function ImageScene({ scene }: { scene: ImageModel }) {
  const titleId = scene.headline ? `${scene.id}-title` : undefined;
  return (
    <section id={scene.id} className={styles.section} data-layout={scene.layout} aria-labelledby={titleId}>
      <figure className={styles.figure}>
        <div className={styles.media}>
          <AssetImage asset={scene.asset} />
        </div>
        {scene.eyebrow || scene.headline || scene.body ? (
          <figcaption className={styles.caption}>
            {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
            {scene.headline ? (
              <h2 id={titleId} className={styles.headline}>
                {scene.headline}
              </h2>
            ) : null}
            {scene.body ? <p className={styles.body}>{scene.body}</p> : null}
          </figcaption>
        ) : null}
      </figure>
    </section>
  );
}
