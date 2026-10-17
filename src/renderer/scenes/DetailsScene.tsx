import type { ExperienceModel, ResolvedScene } from "../model";
import { PendingBadge, ShownValue } from "../primitives/Pending";
import styles from "./scenes.module.css";

type DetailsModel = Extract<ResolvedScene, { kind: "details" }>;

/** Event Details: data, horário, local e informações práticas em HTML real. */
export function DetailsScene({ scene, details }: { scene: DetailsModel; details: ExperienceModel["details"] }) {
  const titleId = `${scene.id}-title`;
  const show = (field: "date" | "time" | "venue" | "practical") => !scene.fields || scene.fields.includes(field);
  // O título grande é do bloco principal (com a data); blocos só de "onde" usam o tamanho comum.
  const large = !scene.fields || scene.fields.includes("date");
  const hasVenue = show("venue") && (details.venueName || details.venueAddress);
  return (
    <section id={scene.id} className={`${styles.section} ${styles.card}`} aria-labelledby={titleId}>
      {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
      <h2 id={titleId} className={`${styles.headline} ${large ? styles.headlineLarge : ""}`}>
        {scene.headline ?? "Detalhes"}
      </h2>

      <dl className={styles.details}>
        {show("date") ? (
          <div className={styles.detailRow}>
            <dt>Data</dt>
            <dd>{details.dateLabel}</dd>
          </div>
        ) : null}
        {show("time") && details.time ? (
          <div className={styles.detailRow}>
            <dt>Horário</dt>
            <dd>
              <ShownValue value={details.time} />
              {details.endTime ? (
                <>
                  {" "}
                  às <ShownValue value={details.endTime} />
                </>
              ) : null}
            </dd>
          </div>
        ) : null}
        {hasVenue ? (
          <div className={styles.detailRow}>
            <dt>Local</dt>
            <dd>
              {details.venueName ? (
                <span className={styles.venueName}>
                  <ShownValue value={details.venueName} />
                </span>
              ) : null}
              {details.venueAddress ? (
                <span className={styles.venueAddress}>
                  <ShownValue value={details.venueAddress} />
                </span>
              ) : null}
            </dd>
          </div>
        ) : null}
        {(show("practical") ? details.practicalInfo : []).map((info) => (
          <div key={info.id} className={styles.detailRow}>
            <dt>{info.label}</dt>
            <dd>
              {info.text} {info.pending ? <PendingBadge /> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
