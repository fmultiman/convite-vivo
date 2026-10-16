/**
 * Contrato de configuração de evento — Convite Vivo, schema v1.
 *
 * Este arquivo é a fonte da verdade do formato de um evento. Ele não depende de
 * React nem do Next.js: pode ser reutilizado pela futura Experience Platform
 * (admin), por scripts de validação e por testes.
 *
 * Regras de forma (tipos, formatos, referências) vivem aqui. Regras de negócio
 * que dependem do estado editorial (ex.: "um evento publicado não pode ter
 * horário a confirmar") vivem em `rules.ts`.
 */
import { z } from "zod";
import { isSafeExternalUrl } from "./safe-url.ts";

export const SCHEMA_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// Primitivos
// ---------------------------------------------------------------------------

export const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug deve usar a-z, 0-9 e hífens");

const idSchema = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "id deve usar a-z, 0-9 e hífens");

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "cor deve ser hexadecimal #rrggbb");

const isoDate = z.iso.date();

const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "horário deve ser HH:MM");

const externalUrl = z
  .string()
  .refine(isSafeExternalUrl, "URL externa deve ser https:// (sem credenciais)");

/** Caminho de asset público servido pela própria aplicação (pasta /public/events). */
const publicAssetPath = z
  .string()
  .regex(/^\/events\/[a-z0-9-]+\/[A-Za-z0-9._/-]+$/, "asset público deve estar em /events/<slug>/...");

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Um dado que precisa de confirmação explícita do cliente/família antes de ser
 * divulgado. `value` pode guardar um candidato de trabalho; o renderer público
 * nunca exibe valores com `confirmed: false`.
 */
export function confirmable(schema: z.ZodString) {
  return z
    .object({
      value: schema.nullable(),
      confirmed: z.boolean(),
      /** Nota interna do operador. Nunca é renderizada no modo público. */
      note: z.string().optional(),
    })
    .refine((v) => !v.confirmed || v.value !== null, {
      message: "um valor confirmado não pode ser nulo",
    });
}

// ---------------------------------------------------------------------------
// Identidade visual
// ---------------------------------------------------------------------------

/** Fontes disponíveis no renderer. Cada chave é carregada em `src/renderer/fonts.ts`. */
export const fontKeys = ["fraunces", "nunito", "cormorant", "jost"] as const;

export const themeSchema = z.object({
  colors: z.object({
    /** Topo e base do gradiente de fundo da experiência. */
    backdropFrom: hexColor,
    backdropTo: hexColor,
    surface: hexColor,
    text: hexColor,
    textMuted: hexColor,
    accent: hexColor,
    /** Cor de texto legível sobre `accent`. */
    accentContrast: hexColor,
    highlight: hexColor,
  }),
  fonts: z.object({
    display: z.enum(fontKeys),
    body: z.enum(fontKeys),
  }),
  shape: z.enum(["soft", "round", "sharp"]),
  /** Partículas decorativas (desligadas automaticamente com reduced motion). */
  particles: z.enum(["bubbles", "sparkles", "petals", "none"]),
});

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

const assetStatus = z.enum(["pending", "approved"]);

const assetBase = {
  status: assetStatus,
  /** Texto alternativo / descrição acessível. */
  alt: z.string().min(1),
  /** Rótulo exibido pelo placeholder enquanto o asset não está aprovado. */
  placeholderLabel: z.string().min(1),
  /** Origem rastreável (ex.: "Content Studio · KF-03"). Uso interno. */
  source: z.string().optional(),
};

export const imageAssetSchema = z.object({
  kind: z.literal("image"),
  ...assetBase,
  src: z.union([publicAssetPath, externalUrl]).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const videoAssetSchema = z.object({
  kind: z.literal("video"),
  ...assetBase,
  src: z.union([publicAssetPath, externalUrl]).optional(),
  /** Asset de imagem usado como poster e como fallback sem vídeo. */
  poster: idSchema.optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const audioAssetSchema = z.object({
  kind: z.literal("audio"),
  ...assetBase,
  src: z.union([publicAssetPath, externalUrl]).optional(),
});

export const assetSchema = z.discriminatedUnion("kind", [
  imageAssetSchema,
  videoAssetSchema,
  audioAssetSchema,
]);

// ---------------------------------------------------------------------------
// Ações (RSVP, mapa, presentes, links)
// ---------------------------------------------------------------------------

const actionBase = {
  id: idSchema,
  label: z.string().min(1).max(40),
  /** Ação só aparece publicamente quando confirmada pelo cliente. */
  confirmed: z.boolean(),
  note: z.string().optional(),
};

export const actionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("rsvp"),
    ...actionBase,
    target: z.discriminatedUnion("channel", [
      z.object({
        channel: z.literal("whatsapp"),
        /** Número em formato internacional, só dígitos (ex.: 5531999999999). */
        phone: z
          .string()
          .regex(/^\d{10,15}$/)
          .nullable(),
        message: z.string().max(300),
      }),
      z.object({ channel: z.literal("link"), url: externalUrl.nullable() }),
    ]),
  }),
  z.object({ kind: z.literal("map"), ...actionBase, url: externalUrl.nullable() }),
  z.object({
    kind: z.literal("gifts"),
    ...actionBase,
    /** Lista externa. Quando nulo, a ação leva à seção de presentes da página. */
    url: externalUrl.nullable(),
  }),
  z.object({ kind: z.literal("link"), ...actionBase, url: externalUrl.nullable() }),
]);

// ---------------------------------------------------------------------------
// Cenas e módulos
// ---------------------------------------------------------------------------

/** Motivos gráficos genéricos usados por cenas de entrada e revelação. */
export const motifs = ["envelope", "shell", "curtain", "gift", "seal"] as const;

const sceneBase = { id: idSchema };

const imageScene = z.object({
  kind: z.literal("image"),
  ...sceneBase,
  asset: idSchema,
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  layout: z.enum(["full-bleed", "framed"]).default("framed"),
});

const videoScene = z.object({
  kind: z.literal("video"),
  ...sceneBase,
  asset: idSchema,
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
  body: z.string().optional(),
  /** true = vídeo ambiente (mudo, em loop, sem controles). false = player com controles. */
  ambient: z.boolean().default(false),
});

const detailsScene = z.object({
  kind: z.literal("details"),
  ...sceneBase,
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
});

const actionsScene = z.object({
  kind: z.literal("actions"),
  ...sceneBase,
  headline: z.string().optional(),
  /** Ids de `event.actions`, na ordem de exibição. */
  actions: z.array(idSchema).min(1),
});

const giftsScene = z.object({
  kind: z.literal("gifts"),
  ...sceneBase,
  headline: z.string().optional(),
});

const countdownScene = z.object({
  kind: z.literal("countdown"),
  ...sceneBase,
  headline: z.string().optional(),
});

const messageScene = z.object({
  kind: z.literal("message"),
  ...sceneBase,
  eyebrow: z.string().optional(),
  headline: z.string(),
  body: z.string().optional(),
  /** Mostra botão "rever o convite" que volta ao início. */
  replay: z.boolean().default(false),
});

/** Cenas que podem aparecer soltas ou dentro de uma revelação. */
export const contentSceneSchema = z.discriminatedUnion("kind", [
  imageScene,
  videoScene,
  detailsScene,
  actionsScene,
  giftsScene,
  countdownScene,
  messageScene,
]);

/**
 * Posição de uma camada no "palco": a caixa da arte de fundo, que acompanha a
 * imagem em qualquer tela. x/y = centro, em % do palco; width em % da largura.
 */
export const placementSchema = z.object({
  x: z.number().min(-10).max(110),
  y: z.number().min(-10).max(110),
  width: z.number().min(1).max(100),
  /** Rotação no plano da imagem, em graus. */
  rotate: z.number().min(-180).max(180).default(0),
  /** Inclinação para "deitar" o objeto no chão (perspectiva), em graus. */
  tilt: z.number().min(0).max(60).default(0),
});

/** Camada decorativa sobre a arte de fundo (concha, pérola, bolha...). */
export const decorItemSchema = placementSchema.extend({
  asset: idSchema,
  /** Profundidade: controla parallax e desfoque de campo. */
  plane: z.enum(["far", "mid", "near"]).default("mid"),
  motion: z.enum(["none", "float", "sway", "rise", "twinkle"]).default("none"),
  /** Sombra de contato (objeto apoiado no chão). */
  shadow: z.boolean().default(false),
  flip: z.boolean().default(false),
  /** Atraso da animação, em segundos. */
  delay: z.number().min(0).max(20).default(0),
  /** "onOpen": só aparece quando a entrada é aberta (ex.: bolhas liberadas). */
  appear: z.enum(["always", "onOpen"]).default("always"),
});

const entryScene = z.object({
  kind: z.literal("entry"),
  ...sceneBase,
  eyebrow: z.string().optional(),
  headline: z.string(),
  body: z.string().optional(),
  /** Pequena etiqueta/selo sobre o motivo (ex.: "Maitê — 1 aninho"). */
  tag: z.string().optional(),
  ctaLabel: z.string().min(1).max(40),
  motif: z.enum(motifs),
  background: idSchema.optional(),
  /** Imagem do motivo (fechado) e do estado aberto: substituem o SVG genérico. */
  motifAsset: idSchema.optional(),
  openAsset: idSchema.optional(),
  /** Placa de fundo para a etiqueta (o texto continua sendo HTML). */
  tagAsset: idSchema.optional(),
  motifPlacement: placementSchema.optional(),
  tagPlacement: placementSchema.optional(),
  decor: z.array(decorItemSchema).default([]),
  /** Transição ao entrar. Com reduced motion vira um fade curto. */
  transition: z.enum(["bubbles", "sparkles", "fade"]),
});

const revealScene = z.object({
  kind: z.literal("reveal"),
  ...sceneBase,
  motif: z.enum(motifs),
  /** Rótulo do botão que revela o conteúdo (ex.: "Abrir a concha"). */
  prompt: z.string().min(1).max(40),
  eyebrow: z.string().optional(),
  headline: z.string().optional(),
  /** Conteúdo revelado. Sem JavaScript, tudo fica visível. */
  children: z.array(contentSceneSchema).min(1),
});

export const sceneSchema = z.discriminatedUnion("kind", [
  entryScene,
  revealScene,
  imageScene,
  videoScene,
  detailsScene,
  actionsScene,
  giftsScene,
  countdownScene,
  messageScene,
]);

// ---------------------------------------------------------------------------
// Ciclo de vida
// ---------------------------------------------------------------------------

/** Estado editorial, controlado pelo operador. */
export const editorialStatuses = ["draft", "preview", "published", "paused", "archived"] as const;

/** Estado temporal, derivado de data/fuso (ou forçado por `phaseOverride`). */
export const phases = ["invitation", "event_day", "post_event", "archive"] as const;

export const lifecycleSchema = z.object({
  phaseOverride: z.enum(phases).nullable().default(null),
  eventDay: z.object({ message: z.string() }),
  postEvent: z.object({
    /** Quando false, a página mostra uma mensagem neutra após a data. */
    enabled: z.boolean(),
    headline: z.string(),
    body: z.string().optional(),
  }),
  /** Dias após o evento para entrar em "archive". null = sem arquivamento automático. */
  archiveAfterDays: z.number().int().positive().nullable().default(null),
});

// ---------------------------------------------------------------------------
// Evento
// ---------------------------------------------------------------------------

export const eventConfigSchema = z
  .object({
    $schema: z.string().optional(),
    schemaVersion: z.literal(SCHEMA_VERSION),
    /** Revisão da configuração; incrementar a cada alteração publicada. */
    revision: z.number().int().positive(),
    updatedAt: z.iso.datetime({ offset: true }),

    id: z.string().regex(/^evt_[a-z0-9]{6,}$/, "id opaco no formato evt_xxxxxx"),
    slug: slugSchema,
    type: z.enum(["birthday", "wedding", "baby-shower", "corporate", "celebration"]),
    status: z.enum(editorialStatuses),
    /** Evento fictício de demonstração. Exibe aviso e nunca é indexado. */
    demo: z.boolean().default(false),
    locale: z.literal("pt-BR"),

    /** Nome curto do homenageado/evento (ex.: "Maitê"). */
    name: z.string().min(1),
    /** Título principal (ex.: "Maitê — 1 aninho"). */
    title: z.string().min(1),

    schedule: z.object({
      date: isoDate,
      timezone: z.string().refine(isValidTimeZone, "timezone IANA inválida"),
      startTime: confirmable(clockTime),
      endTime: confirmable(clockTime).optional(),
    }),

    venue: z.object({
      name: confirmable(z.string().min(1)),
      address: confirmable(z.string().min(1)),
    }),

    /** Informações práticas adicionais (traje, estacionamento, acessibilidade...). */
    practicalInfo: z
      .array(
        z.object({
          id: idSchema,
          label: z.string().min(1),
          text: z.string().min(1),
          confirmed: z.boolean(),
        }),
      )
      .default([]),

    theme: themeSchema,
    assets: z.record(idSchema, assetSchema),
    scenes: z.array(sceneSchema).min(1),
    actions: z.array(actionSchema).default([]),

    gifts: z
      .object({
        intro: z.string().optional(),
        items: z.array(z.object({ text: z.string().min(1), confirmed: z.boolean() })),
        note: z.string().optional(),
      })
      .optional(),

    /** Trilha opcional. Só toca após gesto do visitante e sempre tem botão de pausa. */
    audio: z
      .object({
        asset: idSchema,
        label: z.string(),
        /** Inicia a trilha no toque de entrada (que já é um gesto do visitante). */
        playOnEnter: z.boolean().default(false),
      })
      .optional(),

    og: z.object({
      title: z.string().min(1).max(90),
      description: z.string().min(1).max(200),
      /** Asset de imagem aprovado. Sem ele, o renderer gera uma imagem a partir da identidade visual. */
      image: idSchema.optional(),
    }),

    seo: z.object({ indexable: z.boolean() }).default({ indexable: false }),

    lifecycle: lifecycleSchema,
  })
  .superRefine((event, ctx) => {
    // Integridade referencial: tudo que é referenciado precisa existir.
    const actionIds = new Set(event.actions.map((a) => a.id));
    const sceneIds = new Set<string>();

    const requireAsset = (id: string, kind: "image" | "video" | "audio", path: (string | number)[]) => {
      const asset = event.assets[id];
      if (!asset) {
        ctx.addIssue({ code: "custom", message: `asset "${id}" não existe`, path });
      } else if (asset.kind !== kind) {
        ctx.addIssue({ code: "custom", message: `asset "${id}" deveria ser ${kind}`, path });
      }
    };

    const checkScene = (scene: z.infer<typeof sceneSchema>, path: (string | number)[]) => {
      if (sceneIds.has(scene.id)) {
        ctx.addIssue({ code: "custom", message: `id de cena duplicado "${scene.id}"`, path: [...path, "id"] });
      }
      sceneIds.add(scene.id);
      switch (scene.kind) {
        case "entry":
          if (scene.background) requireAsset(scene.background, "image", [...path, "background"]);
          for (const key of ["motifAsset", "openAsset", "tagAsset"] as const) {
            const id = scene[key];
            if (id) requireAsset(id, "image", [...path, key]);
          }
          scene.decor.forEach((item, i) => requireAsset(item.asset, "image", [...path, "decor", i, "asset"]));
          break;
        case "image":
          requireAsset(scene.asset, "image", [...path, "asset"]);
          break;
        case "video":
          requireAsset(scene.asset, "video", [...path, "asset"]);
          break;
        case "actions":
          scene.actions.forEach((id, i) => {
            if (!actionIds.has(id)) {
              ctx.addIssue({ code: "custom", message: `ação "${id}" não existe`, path: [...path, "actions", i] });
            }
          });
          break;
        case "reveal":
          scene.children.forEach((child, i) => checkScene(child, [...path, "children", i]));
          break;
      }
    };

    event.scenes.forEach((scene, i) => checkScene(scene, ["scenes", i]));

    if (event.scenes.filter((s) => s.kind === "entry").length > 1) {
      ctx.addIssue({ code: "custom", message: "apenas uma cena de entrada por evento", path: ["scenes"] });
    }
    if (event.scenes.findIndex((s) => s.kind === "entry") > 0) {
      ctx.addIssue({ code: "custom", message: "a cena de entrada deve ser a primeira", path: ["scenes"] });
    }

    for (const [id, asset] of Object.entries(event.assets)) {
      if (asset.kind === "video" && asset.poster) requireAsset(asset.poster, "image", ["assets", id, "poster"]);
      if (asset.status === "approved" && !asset.src) {
        ctx.addIssue({ code: "custom", message: `asset aprovado "${id}" precisa de src`, path: ["assets", id, "src"] });
      }
      if (asset.kind === "image" && asset.status === "approved" && (!asset.width || !asset.height)) {
        ctx.addIssue({ code: "custom", message: `imagem aprovada "${id}" precisa de width/height`, path: ["assets", id] });
      }
      if (asset.src?.startsWith("/events/") && !asset.src.startsWith(`/events/${event.slug}/`)) {
        ctx.addIssue({ code: "custom", message: `asset "${id}" aponta para a pasta de outro evento`, path: ["assets", id, "src"] });
      }
    }

    if (event.og.image) requireAsset(event.og.image, "image", ["og", "image"]);
    if (event.audio) requireAsset(event.audio.asset, "audio", ["audio", "asset"]);

    const actionIdList = event.actions.map((a) => a.id);
    if (new Set(actionIdList).size !== actionIdList.length) {
      ctx.addIssue({ code: "custom", message: "ids de ações duplicados", path: ["actions"] });
    }
    if (event.demo && event.seo.indexable) {
      ctx.addIssue({ code: "custom", message: "evento demo não pode ser indexável", path: ["seo", "indexable"] });
    }
  });

export type EventConfig = z.output<typeof eventConfigSchema>;
export type EventConfigInput = z.input<typeof eventConfigSchema>;
export type Scene = z.output<typeof sceneSchema>;
export type ContentScene = z.output<typeof contentSceneSchema>;
export type SceneKind = Scene["kind"];
export type Asset = z.output<typeof assetSchema>;
export type EventAction = z.output<typeof actionSchema>;
export type Theme = z.output<typeof themeSchema>;
export type FontKey = (typeof fontKeys)[number];
export type Motif = (typeof motifs)[number];
export type Placement = z.output<typeof placementSchema>;
export type DecorItem = z.output<typeof decorItemSchema>;
export type EditorialStatus = (typeof editorialStatuses)[number];
export type Phase = (typeof phases)[number];
