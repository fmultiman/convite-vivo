import type { CSSProperties } from "react";
import type { ResolvedAction, ResolvedScene } from "../model";
import { PendingBadge } from "../primitives/Pending";
import styles from "./scenes.module.css";

type ActionsModel = Extract<ResolvedScene, { kind: "actions" }>;

/**
 * Action Buttons: RSVP, mapa, presentes e links. Links externos abrem em nova
 * aba com rel="noopener noreferrer"; as URLs já foram validadas como https no
 * contrato. Ações pendentes só aparecem em prévia, desabilitadas.
 */
export function ActionsScene({ scene }: { scene: ActionsModel }) {
  if (scene.actions.length === 0) return null;
  const titleId = scene.headline ? `${scene.id}-title` : undefined;
  return (
    <section id={scene.id} className={styles.section} aria-labelledby={titleId} aria-label={titleId ? undefined : "Ações"}>
      {scene.headline ? (
        <h2 id={titleId} className={styles.headline}>
          {scene.headline}
        </h2>
      ) : null}
      <ul className={styles.actions}>
        {scene.actions.map((action, i) => (
          <li key={action.id} className={styles.actionItem} style={{ "--i": i } as CSSProperties}>
            <ActionButton action={action} primary={i === 0} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionButton({ action, primary }: { action: ResolvedAction; primary: boolean }) {
  const className = `${styles.action} ${primary ? styles.actionPrimary : ""}`;
  const content = (
    <>
      <ActionIcon kind={action.kind} />
      <span>{action.label}</span>
    </>
  );

  if (!action.href) {
    return (
      <span className={`${className} ${styles.actionDisabled}`} aria-disabled="true">
        {content} <PendingBadge note={action.note} />
      </span>
    );
  }
  if (!action.external) {
    return (
      <a className={className} href={action.href}>
        {content}
      </a>
    );
  }
  return (
    <a className={className} href={action.href} target="_blank" rel="noopener noreferrer">
      {content}
      <span className="visually-hidden"> (abre em nova aba)</span>
    </a>
  );
}

function ActionIcon({ kind }: { kind: ResolvedAction["kind"] }) {
  const paths: Record<ResolvedAction["kind"], string> = {
    rsvp: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
    map: "M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    gifts: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7S10.5 3 8 3.5 7 7 12 7zm0 0s1.5-4 4-3.5S17 7 12 7z",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  };
  return (
    <svg className={styles.actionIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[kind]} />
    </svg>
  );
}
