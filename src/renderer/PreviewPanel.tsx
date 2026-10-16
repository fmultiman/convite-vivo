import type { ExperienceModel } from "./model";
import styles from "./experience.module.css";

const statusLabel: Record<ExperienceModel["event"]["status"], string> = {
  draft: "rascunho",
  preview: "em revisão",
  published: "publicado",
  paused: "pausado",
  archived: "arquivado",
};

/** Painel do operador na rota /preview: estado editorial e pendências de publicação. */
export function PreviewPanel({ model }: { model: ExperienceModel }) {
  const blockers = model.issues.filter((i) => i.severity === "blocker");
  const warnings = model.issues.filter((i) => i.severity === "warning");
  return (
    <details className={styles.previewPanel}>
      <summary>
        Prévia · {statusLabel[model.event.status]} · rev. {model.event.revision}
        {blockers.length ? ` · ${blockers.length} bloqueio(s)` : " · pronto para publicar"}
      </summary>
      <p>Esta página não é pública nem indexável. Itens “a confirmar” não aparecem na versão publicada.</p>
      {blockers.length ? (
        <>
          <h2>Impedem a publicação</h2>
          <ul>
            {blockers.map((issue) => (
              <li key={issue.path}>
                <code>{issue.path}</code> — {issue.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {warnings.length ? (
        <>
          <h2>Avisos</h2>
          <ul>
            {warnings.map((issue) => (
              <li key={issue.path}>
                <code>{issue.path}</code> — {issue.message}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </details>
  );
}
