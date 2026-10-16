import type { ExperienceModel, ResolvedContentScene, ResolvedScene } from "./model";
import { ActionsScene } from "./scenes/ActionsScene";
import { CountdownScene } from "./scenes/CountdownScene";
import { DetailsScene } from "./scenes/DetailsScene";
import { GiftsScene } from "./scenes/GiftsScene";
import { ImageScene } from "./scenes/ImageScene";
import { MessageScene } from "./scenes/MessageScene";
import { RevealScene } from "./scenes/RevealScene";
import { StageScene } from "./scenes/StageScene";
import { VideoScene } from "./scenes/VideoScene";

/**
 * Registro de cenas: cada `kind` do contrato mapeia para um componente de
 * comportamento. O `switch` é exaustivo — um novo tipo de cena no contrato
 * não compila até ganhar um componente aqui.
 */
export function SceneView({
  scene,
  model,
  first = false,
}: {
  scene: ResolvedScene | ResolvedContentScene;
  model: ExperienceModel;
  /** Primeira cena depois da entrada (recebe a animação de chegada). */
  first?: boolean;
}) {
  switch (scene.kind) {
    case "entry":
      // A entrada é montada fora do <main> pelo EventExperience.
      return null;
    case "stage": {
      const entry = model.scenes.find((s) => s.kind === "entry");
      return <StageScene scene={scene} first={first} tint={entry?.kind === "entry" ? entry.transitionTint : undefined} />;
    }
    case "reveal":
      return (
        <RevealScene id={scene.id} motif={scene.motif} prompt={scene.prompt} eyebrow={scene.eyebrow} headline={scene.headline}>
          {scene.children.map((child) => (
            <SceneView key={child.id} scene={child} model={model} />
          ))}
        </RevealScene>
      );
    case "image":
      return <ImageScene scene={scene} />;
    case "video":
      return <VideoScene scene={scene} mode={model.mode} />;
    case "details":
      return <DetailsScene scene={scene} details={model.details} />;
    case "actions":
      return <ActionsScene scene={scene} />;
    case "gifts":
      return <GiftsScene scene={scene} gifts={model.gifts} />;
    case "countdown":
      return <CountdownScene scene={scene} lifecycle={model.lifecycle} dateLabel={model.details.dateLabel} />;
    case "message":
      return <MessageScene scene={scene} />;
    default: {
      const unhandled: never = scene;
      throw new Error(`Cena sem componente: ${JSON.stringify(unhandled)}`);
    }
  }
}
