/**
 * Regras de publicação. O schema garante a forma; estas regras garantem que um
 * evento publicado não exponha informação provisória como definitiva.
 */
import type { ContentScene, EventAction, EventConfig, Scene } from "./event.schema.ts";

export type IssueSeverity = "blocker" | "warning";

export interface PublicationIssue {
  severity: IssueSeverity;
  path: string;
  message: string;
}

/** Ações efetivamente usadas pelas cenas (inclusive dentro de revelações). */
export function referencedActionIds(scenes: Scene[]): Set<string> {
  const ids = new Set<string>();
  const visit = (scene: Scene | ContentScene) => {
    if (scene.kind === "actions") scene.actions.forEach((id) => ids.add(id));
    if (scene.kind === "reveal") scene.children.forEach(visit);
  };
  scenes.forEach(visit);
  return ids;
}

function hasScene(scenes: (Scene | ContentScene)[], kind: Scene["kind"]): boolean {
  return scenes.some((scene) => scene.kind === kind || (scene.kind === "reveal" && hasScene(scene.children, kind)));
}

export function referencedAssetIds(event: EventConfig): Set<string> {
  const ids = new Set<string>();
  const visit = (scene: Scene | ContentScene) => {
    if (scene.kind === "entry") {
      if (scene.background) ids.add(scene.background);
      for (const id of [scene.motifAsset, scene.openAsset, scene.tagAsset]) if (id) ids.add(id);
      scene.decor.forEach((item) => ids.add(item.asset));
    }
    if (scene.kind === "stage") {
      ids.add(scene.background);
      scene.decor.forEach((item) => ids.add(item.asset));
      scene.canvas?.sprites.forEach((id) => ids.add(id));
      if (scene.feature) ids.add(scene.feature.asset);
    }
    if (scene.kind === "image" || scene.kind === "video") ids.add(scene.asset);
    if (scene.kind === "reveal") scene.children.forEach(visit);
  };
  event.scenes.forEach(visit);
  if (event.og.image) ids.add(event.og.image);
  if (event.audio) ids.add(event.audio.asset);
  return ids;
}

/** Uma ação está pronta quando foi confirmada e tem destino definido. */
export function isActionReady(action: EventAction): boolean {
  if (!action.confirmed) return false;
  switch (action.kind) {
    case "rsvp":
      return action.target.channel === "whatsapp" ? action.target.phone !== null : action.target.url !== null;
    case "gifts":
      return true; // sem URL, leva à seção de presentes da própria página
    case "map":
    case "link":
      return action.url !== null;
  }
}

export function getPublicationIssues(event: EventConfig): PublicationIssue[] {
  const issues: PublicationIssue[] = [];
  const blocker = (path: string, message: string) => issues.push({ severity: "blocker", path, message });
  const warning = (path: string, message: string) => issues.push({ severity: "warning", path, message });

  if (!event.schedule.startTime.confirmed) blocker("schedule.startTime", "Horário ainda não confirmado");
  if (event.schedule.endTime && !event.schedule.endTime.confirmed) {
    warning("schedule.endTime", "Horário de término não confirmado (ficará oculto)");
  }
  if (!event.venue.name.confirmed) blocker("venue.name", "Local ainda não confirmado");
  if (!event.venue.address.confirmed) blocker("venue.address", "Endereço ainda não confirmado");

  const used = referencedActionIds(event.scenes);
  const hasGiftsSection = hasScene(event.scenes, "gifts") && (event.gifts?.items ?? []).some((item) => item.confirmed);
  for (const action of event.actions) {
    if (!used.has(action.id)) continue;
    if (!isActionReady(action)) blocker(`actions.${action.id}`, `Ação "${action.label}" sem confirmação ou destino`);
    else if (action.kind === "gifts" && !action.url && !hasGiftsSection) {
      blocker(`actions.${action.id}`, `Ação "${action.label}" sem URL e sem seção de presentes com itens confirmados`);
    }
  }

  event.practicalInfo.forEach((info) => {
    if (!info.confirmed) warning(`practicalInfo.${info.id}`, `"${info.label}" não confirmado (ficará oculto)`);
  });
  event.gifts?.items.forEach((item, i) => {
    if (!item.confirmed) warning(`gifts.items.${i}`, `Sugestão de presente "${item.text}" não confirmada (ficará oculta)`);
  });

  for (const id of referencedAssetIds(event)) {
    const asset = event.assets[id];
    if (asset && asset.status !== "approved") {
      warning(`assets.${id}`, `Asset "${id}" pendente — será exibido placeholder`);
    }
  }
  if (!event.og.image) warning("og.image", "Sem imagem OG aprovada — será usada imagem gerada pela identidade visual");

  return issues;
}

export function canPublish(event: EventConfig): boolean {
  return getPublicationIssues(event).every((issue) => issue.severity !== "blocker");
}
