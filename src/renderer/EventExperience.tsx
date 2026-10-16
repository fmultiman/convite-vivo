import { BRAND_NAME } from "@/lib/site";
import type { ExperienceModel } from "./model";
import { SceneView } from "./SceneView";
import { EntryScene } from "./scenes/EntryScene";
import { AudioToggle } from "./client/AudioToggle";
import { PhaseNotice } from "./client/PhaseNotice";
import { Particles } from "./primitives/Particles";
import { PreviewPanel } from "./PreviewPanel";
import { themeFontClasses, themeStyle } from "./theme";
import styles from "./experience.module.css";

const MAIN_ID = "conteudo";

/**
 * Event Renderer: monta qualquer evento a partir do modelo resolvido.
 * Não há código específico por evento — tudo vem da configuração.
 */
export function EventExperience({ model }: { model: ExperienceModel }) {
  const [first, ...rest] = model.scenes;
  const entry = first?.kind === "entry" ? first : null;
  const scenes = entry ? rest : model.scenes;

  return (
    <div
      className={`${styles.experience} ${themeFontClasses(model.theme)}`}
      style={themeStyle(model.theme)}
      data-event={model.event.slug}
      data-shape={model.theme.shape}
    >
      <Particles kind={model.theme.particles} />

      {model.event.demo ? <p className={styles.demoBadge}>Evento fictício de demonstração</p> : null}
      {model.audio ? <AudioToggle {...model.audio} /> : null}

      {entry ? <EntryScene scene={entry} mainId={MAIN_ID} /> : null}

      <main id={MAIN_ID} tabIndex={-1} className={styles.main}>
        {entry ? null : <h1 className="visually-hidden">{model.event.title}</h1>}
        <PhaseNotice lifecycle={model.lifecycle} />
        {scenes.map((scene) => (
          <SceneView key={scene.id} scene={scene} model={model} />
        ))}
      </main>

      <footer className={styles.footer}>
        <p>
          Feito com carinho · <span className={styles.brand}>{BRAND_NAME}</span>
        </p>
      </footer>

      {model.mode === "preview" ? <PreviewPanel model={model} /> : null}
    </div>
  );
}
