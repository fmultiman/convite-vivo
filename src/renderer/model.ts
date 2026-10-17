/**
 * Config → modelo de experiência.
 *
 * Camada pura (sem React) que resolve referências (assets, ações), formata datas
 * e aplica a política de exibição:
 * - modo "public": valores não confirmados e ações pendentes são REMOVIDOS
 *   (nunca chegam ao HTML);
 * - modo "preview": aparecem marcados como "a confirmar" para revisão.
 *
 * Os componentes recebem apenas este modelo e não conhecem o formato da config.
 */
import type {
  Asset,
  ContentScene,
  DecorItem,
  Feature,
  EventAction,
  EventConfig,
  Phase,
  Placement,
  Scene,
  Theme,
} from "../contract/event.schema";
import { confirmedStartInstant } from "../contract/lifecycle";
import { buildWhatsAppUrl } from "../contract/safe-url";
import { getPublicationIssues, isActionReady, type PublicationIssue } from "../contract/rules";

export type RenderMode = "public" | "preview";

// ---------------------------------------------------------------------------
// Tipos resolvidos
// ---------------------------------------------------------------------------

export interface ReadyImage {
  id: string;
  kind: "image";
  ready: true;
  src: string;
  width: number;
  height: number;
  alt: string;
}

export type ResolvedAsset =
  | ReadyImage
  | { id: string; kind: "video"; ready: true; src: string; alt: string; width?: number; height?: number; poster: ReadyImage | null }
  | { id: string; kind: "audio"; ready: true; src: string; alt: string; width?: undefined; height?: undefined }
  | {
      id: string;
      kind: Asset["kind"];
      ready: false;
      alt: string;
      /** Rótulo do placeholder. Em modo público vira um texto neutro. */
      label: string;
      /** Para vídeo indisponível: poster aprovado usado como fallback. */
      poster: ReadyImage | null;
      width?: number;
      height?: number;
    };

/** Valor exibível: confirmado, pendente (só em prévia) ou oculto (null). */
export type Shown<T> = { state: "confirmed"; value: T } | { state: "pending"; candidate: T | null; note?: string } | null;

export interface ResolvedAction {
  id: string;
  kind: EventAction["kind"];
  label: string;
  /** null quando pendente (renderizado desabilitado, apenas em prévia). */
  href: string | null;
  external: boolean;
  pending: boolean;
  note?: string;
}

type WithAsset<S, K extends string> = Omit<S, K> & { [P in K]: ResolvedAsset };

type ResolvedContentSceneOf<S> = S extends { kind: "image" | "video" }
  ? WithAsset<S, "asset">
  : S extends { kind: "actions" }
    ? Omit<S, "actions"> & { actions: ResolvedAction[] }
    : S;

export type ResolvedContentScene = ResolvedContentSceneOf<ContentScene>;

/** Camada decorativa já resolvida: só entram imagens prontas (aprovadas). */
export type ResolvedDecor = Omit<DecorItem, "asset"> & { image: ReadyImage };

/**
 * Arte da entrada em camadas (fundo + motivo em imagem + decoração). Só existe
 * quando o fundo está pronto E há motivo em imagem ou decoração; caso
 * contrário a entrada usa o layout simples (motivo SVG).
 */
export interface EntryArt {
  background: ReadyImage;
  motif: ReadyImage | null;
  open: ReadyImage | null;
  tag: ReadyImage | null;
  motifPlacement: Placement;
  tagPlacement: Placement;
  decor: ResolvedDecor[];
}

/**
 * Destaque já resolvido. `image` é null enquanto o asset está pendente: em prévia
 * vira placeholder (com `label`); na versão pública o destaque é omitido.
 */
export type ResolvedFeature = Omit<Feature, "asset"> & { image: ReadyImage | null; label: string; alt: string };

/** Palco em camadas já resolvido (cena "stage"). Só existe com o fundo pronto. */
export interface StageArt {
  background: ReadyImage;
  decor: ResolvedDecor[];
  feature: ResolvedFeature | null;
  /** Camada atmosférica em canvas: sprites de microbolhas (vazio = desenhadas) + densidades. */
  canvas: { sprites: ReadyImage[]; density: number; motes: number } | null;
}

type EntryConfigScene = Extract<Scene, { kind: "entry" }>;
type StageConfigScene = Extract<Scene, { kind: "stage" }>;

export type ResolvedScene =
  | ResolvedContentScene
  | (Omit<EntryConfigScene, "background" | "motifAsset" | "openAsset" | "tagAsset" | "decor"> & {
      background: ResolvedAsset | null;
      art: EntryArt | null;
    })
  | (Omit<StageConfigScene, "background" | "decor" | "canvas" | "feature" | "panel"> & {
      art: StageArt | null;
      /** Painel revelado por botão (conteúdo aninhado já resolvido) e a moldura, se aprovada. */
      panel: { prompt: string; frame: ReadyImage | null; children: ResolvedContentScene[] } | null;
    })
  | (Omit<Extract<Scene, { kind: "reveal" }>, "children"> & { children: ResolvedContentScene[] });

export interface LifecycleInfo {
  date: string;
  timezone: string;
  startsAt: string | null;
  phaseOverride: Phase | null;
  archiveAfterDays: number | null;
  eventDayMessage: string;
  postEvent: { enabled: boolean; headline: string; body?: string };
}

export interface ExperienceModel {
  mode: RenderMode;
  event: Pick<EventConfig, "id" | "slug" | "type" | "status" | "demo" | "name" | "title" | "revision">;
  theme: Theme;
  details: {
    dateLabel: string;
    time: Shown<string>;
    endTime: Shown<string>;
    venueName: Shown<string>;
    venueAddress: Shown<string>;
    practicalInfo: { id: string; label: string; text: string; pending: boolean }[];
  };
  gifts: { intro?: string; note?: string; items: { text: string; pending: boolean }[] } | null;
  audio: { src: string; label: string; playOnEnter: boolean } | null;
  lifecycle: LifecycleInfo;
  scenes: ResolvedScene[];
  /** Pendências de publicação (somente em prévia). */
  issues: PublicationIssue[];
}

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

/** "domingo, 8 de novembro de 2026" — data do calendário, sem conversão de fuso. */
export function formatEventDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "13:00" → "13h"; "19:30" → "19h30". */
export function formatClockTime(time: string): string {
  const [hh, mm] = time.split(":");
  return `${Number(hh)}h${mm === "00" ? "" : mm}`;
}

// ---------------------------------------------------------------------------
// Resolução
// ---------------------------------------------------------------------------

function shown<T, R>(
  field: { value: T | null; confirmed: boolean; note?: string } | undefined,
  mode: RenderMode,
  map: (value: T) => R,
): Shown<R> {
  if (!field) return null;
  if (field.confirmed && field.value !== null) return { state: "confirmed", value: map(field.value) };
  if (mode === "public") return null;
  return { state: "pending", candidate: field.value === null ? null : map(field.value), note: field.note };
}

function resolveAsset(event: EventConfig, id: string, mode: RenderMode): ResolvedAsset {
  const asset = event.assets[id];
  const readyImage = (imageId: string | undefined): ReadyImage | null => {
    if (!imageId) return null;
    const img = event.assets[imageId];
    if (img?.kind !== "image" || img.status !== "approved" || !img.src || !img.width || !img.height) return null;
    return { id: imageId, kind: "image", ready: true, src: img.src, width: img.width, height: img.height, alt: img.alt };
  };

  if (asset.status === "approved" && asset.src) {
    switch (asset.kind) {
      case "image": {
        const img = readyImage(id);
        if (img) return img;
        break;
      }
      case "video":
        return {
          id,
          kind: "video",
          ready: true,
          src: asset.src,
          alt: asset.alt,
          width: asset.width,
          height: asset.height,
          poster: readyImage(asset.poster),
        };
      case "audio":
        return { id, kind: "audio", ready: true, src: asset.src, alt: asset.alt };
    }
  }

  return {
    id,
    kind: asset.kind,
    ready: false,
    alt: asset.alt,
    // Rótulos internos (ex.: "KF-03") só aparecem em prévia.
    label: mode === "preview" ? asset.placeholderLabel : "",
    poster: asset.kind === "video" ? readyImage(asset.poster) : null,
    width: asset.kind === "audio" ? undefined : asset.width,
    height: asset.kind === "audio" ? undefined : asset.height,
  };
}

const DEFAULT_MOTIF_PLACEMENT: Placement = { x: 50, y: 58, width: 52, rotate: 0, tilt: 0 };
const DEFAULT_TAG_PLACEMENT: Placement = { x: 50, y: 80, width: 40, rotate: 0, tilt: 0 };

function resolveEntryArt(
  event: EventConfig,
  backgroundId: string | undefined,
  ids: { motifAsset?: string; openAsset?: string; tagAsset?: string },
  scene: EntryConfigScene,
  decor: DecorItem[],
): EntryArt | null {
  const ready = (id: string | undefined): ReadyImage | null => {
    if (!id) return null;
    const asset = resolveAsset(event, id, "public");
    return asset.ready && asset.kind === "image" ? asset : null;
  };
  const background = ready(backgroundId);
  const motif = ready(ids.motifAsset);
  const readyDecor = decor.flatMap((item): ResolvedDecor[] => {
    const { asset, ...rest } = item;
    const image = ready(asset);
    return image ? [{ ...rest, image }] : [];
  });
  if (!background || (!motif && readyDecor.length === 0)) return null;
  return {
    background,
    motif,
    open: ready(ids.openAsset),
    tag: ready(ids.tagAsset),
    motifPlacement: scene.motifPlacement ?? DEFAULT_MOTIF_PLACEMENT,
    tagPlacement: scene.tagPlacement ?? DEFAULT_TAG_PLACEMENT,
    decor: readyDecor,
  };
}

function resolveStageArt(
  event: EventConfig,
  backgroundId: string,
  decor: DecorItem[],
  canvas: StageConfigScene["canvas"],
  feature: StageConfigScene["feature"],
  mode: RenderMode,
): StageArt | null {
  const ready = (id: string): ReadyImage | null => {
    const asset = resolveAsset(event, id, "public");
    return asset.ready && asset.kind === "image" ? asset : null;
  };
  const background = ready(backgroundId);
  if (!background) return null;
  const resolveFeature = (): ResolvedFeature | null => {
    if (!feature) return null;
    const { asset, ...rest } = feature;
    const resolved = resolveAsset(event, asset, mode);
    if (resolved.ready && resolved.kind === "image") return { ...rest, image: resolved, label: "", alt: resolved.alt };
    // Pendente: só a prévia mostra um placeholder; o público nunca vê "buracos".
    return mode === "preview" ? { ...rest, image: null, label: resolved.ready ? "" : resolved.label, alt: "" } : null;
  };
  return {
    background,
    feature: resolveFeature(),
    decor: decor.flatMap((item): ResolvedDecor[] => {
      const { asset, ...rest } = item;
      const image = ready(asset);
      return image ? [{ ...rest, image }] : [];
    }),
    canvas: canvas
      ? { sprites: canvas.sprites.flatMap((id) => ready(id) ?? []), density: canvas.density, motes: canvas.motes }
      : null,
  };
}

function findGiftsSceneId(scenes: (Scene | ContentScene)[]): string | null {
  for (const scene of scenes) {
    if (scene.enabled === false) continue;
    if (scene.kind === "gifts") return scene.id;
    if (scene.kind === "reveal") {
      const nested = findGiftsSceneId(scene.children);
      if (nested) return nested;
    }
    if (scene.kind === "stage" && scene.panel) {
      const nested = findGiftsSceneId(scene.panel.children);
      if (nested) return nested;
    }
  }
  return null;
}

function resolveAction(action: EventAction, giftsAnchor: string | null): ResolvedAction {
  const ready = isActionReady(action);
  let href: string | null = null;
  if (ready) {
    switch (action.kind) {
      case "rsvp":
        href =
          action.target.channel === "whatsapp"
            ? buildWhatsAppUrl(action.target.phone!, action.target.message)
            : action.target.url;
        break;
      case "gifts":
        href = action.url ?? (giftsAnchor ? `#${giftsAnchor}` : null);
        break;
      case "map":
      case "link":
        href = action.url;
        break;
    }
  }
  return {
    id: action.id,
    kind: action.kind,
    label: action.label,
    href,
    external: href !== null && !href.startsWith("#"),
    pending: href === null,
    note: action.note,
  };
}

export function resolveExperience(event: EventConfig, mode: RenderMode): ExperienceModel {
  // A seção de presentes só existe na página se houver algum item exibível.
  const giftsVisible = (event.gifts?.items ?? []).some((item) => mode === "preview" || item.confirmed);
  const giftsAnchor = giftsVisible ? findGiftsSceneId(event.scenes) : null;
  const actionsById = new Map(event.actions.map((a) => [a.id, resolveAction(a, giftsAnchor)]));

  const resolveContent = (scene: ContentScene): ResolvedContentScene => {
    switch (scene.kind) {
      case "image":
      case "video":
        return { ...scene, asset: resolveAsset(event, scene.asset, mode) };
      case "actions":
        return {
          ...scene,
          actions: scene.actions
            .map((id) => actionsById.get(id)!)
            .filter((action) => mode === "preview" || !action.pending),
        };
      default:
        return scene;
    }
  };

  const scenes = event.scenes.filter((scene) => scene.enabled).map((scene): ResolvedScene => {
    switch (scene.kind) {
      case "entry": {
        const { motifAsset, openAsset, tagAsset, decor, ...entry } = scene;
        return {
          ...entry,
          background: scene.background ? resolveAsset(event, scene.background, mode) : null,
          art: resolveEntryArt(event, scene.background, { motifAsset, openAsset, tagAsset }, scene, decor),
        };
      }
      case "stage": {
        const { background, decor, canvas, feature, panel, ...stage } = scene;
        const frame = panel?.frame ? resolveAsset(event, panel.frame, "public") : null;
        return {
          ...stage,
          art: resolveStageArt(event, background, decor, canvas, feature, mode),
          panel: panel
            ? {
                prompt: panel.prompt,
                frame: frame && frame.ready && frame.kind === "image" ? frame : null,
                children: panel.children.filter((c) => c.enabled).map(resolveContent),
              }
            : null,
        };
      }
      case "reveal":
        return { ...scene, children: scene.children.filter((c) => c.enabled).map(resolveContent) };
      default:
        return resolveContent(scene);
    }
  });

  const audioAsset = event.audio ? resolveAsset(event, event.audio.asset, mode) : null;
  const startsAt = confirmedStartInstant(event);

  return {
    mode,
    event: {
      id: event.id,
      slug: event.slug,
      type: event.type,
      status: event.status,
      demo: event.demo,
      name: event.name,
      title: event.title,
      revision: event.revision,
    },
    theme: event.theme,
    details: {
      dateLabel: formatEventDate(event.schedule.date),
      time: shown(event.schedule.startTime, mode, formatClockTime),
      endTime: shown(event.schedule.endTime, mode, formatClockTime),
      venueName: shown(event.venue.name, mode, (v) => v),
      venueAddress: shown(event.venue.address, mode, (v) => v),
      practicalInfo: event.practicalInfo
        .filter((info) => mode === "preview" || info.confirmed)
        .map((info) => ({ id: info.id, label: info.label, text: info.text, pending: !info.confirmed })),
    },
    gifts: event.gifts
      ? {
          intro: event.gifts.intro,
          note: event.gifts.note,
          items: event.gifts.items
            .filter((item) => mode === "preview" || item.confirmed)
            .map((item) => ({ text: item.text, pending: !item.confirmed })),
        }
      : null,
    audio:
      event.audio && audioAsset?.ready && audioAsset.kind === "audio"
        ? { src: audioAsset.src, label: event.audio.label, playOnEnter: event.audio.playOnEnter }
        : null,
    lifecycle: {
      date: event.schedule.date,
      timezone: event.schedule.timezone,
      startsAt: startsAt?.toISOString() ?? null,
      phaseOverride: event.lifecycle.phaseOverride,
      archiveAfterDays: event.lifecycle.archiveAfterDays,
      eventDayMessage: event.lifecycle.eventDay.message,
      postEvent: event.lifecycle.postEvent,
    },
    scenes,
    issues: mode === "preview" ? getPublicationIssues(event) : [],
  };
}
