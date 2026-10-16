import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { events } from "@/events";
import { buildEventMetadata, buildEventViewport } from "@/lib/metadata";
import { EventExperience } from "@/renderer/EventExperience";
import { resolveExperience } from "@/renderer/model";

type Props = { params: Promise<{ slug: string }> };

/**
 * Convites são abertos por link direto (WhatsApp), não por navegação interna;
 * metadata/viewport por evento dependem do slug. Aceitamos rota "bloqueante".
 */
export const instant = false;

/** Placeholder exigido pelo Cache Components quando não há eventos publicados. */
const NO_EVENTS = "__sem-eventos__";

/**
 * Eventos publicados são pré-renderizados no build (HTML estático com OG).
 * Qualquer outro slug — inexistente ou draft — cai em notFound() (404).
 * Obs.: `dynamicParams = false` não é compatível com Cache Components.
 */
export function generateStaticParams() {
  const slugs = events.listPublishedSlugs();
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: NO_EVENTS }];
}

function loadPublished(slug: string) {
  const event = events.getPublishedEvent(slug);
  if (!event) notFound();
  return event;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return buildEventMetadata(loadPublished(slug), "public");
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params;
  return buildEventViewport(loadPublished(slug));
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = loadPublished(slug);
  return <EventExperience model={resolveExperience(event, "public")} />;
}
