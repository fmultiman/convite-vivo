import type { Shown } from "../model";
import styles from "./primitives.module.css";

/** Marca "a confirmar" usada apenas no modo prévia. */
export function PendingBadge({ note }: { note?: string }) {
  return (
    <span className={styles.pendingBadge} title={note}>
      a confirmar
    </span>
  );
}

/** Renderiza um valor confirmado; em prévia mostra o candidato marcado como pendente. */
export function ShownValue({ value }: { value: Shown<string> }) {
  if (!value) return null;
  if (value.state === "confirmed") return <>{value.value}</>;
  return (
    <span className={styles.pending}>
      {value.candidate ?? "—"} <PendingBadge note={value.note} />
    </span>
  );
}
