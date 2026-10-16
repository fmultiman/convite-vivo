/**
 * Repositório de eventos. Nesta fase as configurações são arquivos JSON locais,
 * validados na carga (o build falha se uma configuração for inválida ou se um
 * evento publicado tiver pendências bloqueantes).
 *
 * A interface (`getPublishedEvent`, `getEventForPreview`, ...) é o ponto de
 * troca futuro por um banco/API da Experience Platform.
 */
import { z } from "zod";
import { eventConfigSchema, type EventConfig } from "../contract/event.schema";
import { getPublicationIssues } from "../contract/rules";

export class EventConfigError extends Error {
  constructor(source: string, detail: string) {
    super(`Configuração de evento inválida (${source}):\n${detail}`);
    this.name = "EventConfigError";
  }
}

export function parseEventConfig(source: string, raw: unknown): EventConfig {
  const result = eventConfigSchema.safeParse(raw);
  if (!result.success) throw new EventConfigError(source, z.prettifyError(result.error));
  return result.data;
}

export interface EventRepository {
  listAll(): EventConfig[];
  listPublishedSlugs(): string[];
  /** Somente eventos com status "published". Drafts e inexistentes retornam null. */
  getPublishedEvent(slug: string): EventConfig | null;
  /** Qualquer estado editorial — usado apenas pela rota de prévia. */
  getEventForPreview(slug: string): EventConfig | null;
}

export function createEventRepository(sources: Record<string, unknown>): EventRepository {
  const bySlug = new Map<string, EventConfig>();
  const ids = new Set<string>();

  for (const [source, raw] of Object.entries(sources)) {
    const event = parseEventConfig(source, raw);
    if (source !== event.slug) {
      throw new EventConfigError(source, `o nome do arquivo deve ser igual ao slug ("${event.slug}")`);
    }
    if (ids.has(event.id)) throw new EventConfigError(source, `id duplicado "${event.id}"`);
    if (event.status === "published") {
      const blockers = getPublicationIssues(event).filter((i) => i.severity === "blocker");
      if (blockers.length > 0) {
        throw new EventConfigError(
          source,
          `evento publicado com pendências bloqueantes:\n${blockers.map((b) => `- ${b.path}: ${b.message}`).join("\n")}`,
        );
      }
    }
    ids.add(event.id);
    bySlug.set(event.slug, event);
  }

  return {
    listAll: () => [...bySlug.values()],
    listPublishedSlugs: () => [...bySlug.values()].filter((e) => e.status === "published").map((e) => e.slug),
    getPublishedEvent: (slug) => {
      const event = bySlug.get(slug);
      return event?.status === "published" ? event : null;
    },
    getEventForPreview: (slug) => bySlug.get(slug) ?? null,
  };
}
