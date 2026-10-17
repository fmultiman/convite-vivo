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

/** Dois palcos com o mesmo fundo compartilham o fundo desfocado das laterais. */
function sameBackground(a: unknown, b: unknown): boolean {
  const id = (s: unknown) => (s as { art?: { background?: { id?: string } } }).art?.background?.id;
  return Boolean(id(a)) && id(a) === id(b);
}

/** Agrupa palcos consecutivos (o mundo deles é contínuo); as demais cenas ficam sozinhas. */
function groupScenes<T extends { kind: string }>(scenes: T[]): { scene: T; index: number }[][] {
  const groups: { scene: T; index: number }[][] = [];
  scenes.forEach((scene, index) => {
    const prev = groups.at(-1);
    if (scene.kind === "stage" && prev && prev[0].scene.kind === "stage") prev.push({ scene, index });
    else groups.push([{ scene, index }]);
  });
  return groups;
}

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
        {groupScenes(scenes).map((group, g) =>
          group.length > 1 ? (
            <div key={`group-${g}`} className={styles.stageGroup} data-stage-group data-first={(Boolean(entry) && group[0].index === 0) || undefined}>
              {group.map(({ scene, index }, k) => (
                <SceneView
                  key={scene.id}
                  scene={scene}
                  model={model}
                  first={Boolean(entry) && index === 0}
                  stack={{ after: k > 0, last: k === group.length - 1, shareFill: k > 0 && sameBackground(scene, group[k - 1].scene) }}
                />
              ))}
            </div>
          ) : (
            group.map(({ scene, index }) => (
              <SceneView key={scene.id} scene={scene} model={model} first={Boolean(entry) && index === 0} />
            ))
          ),
        )}
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
