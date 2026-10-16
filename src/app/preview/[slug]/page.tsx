import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { events } from "@/events";
import { buildEventMetadata, buildEventViewport } from "@/lib/metadata";
import { isDraftPreviewEnabled } from "@/lib/site";
import { EventExperience } from "@/renderer/EventExperience";
import { resolveExperience } from "@/renderer/model";

type Props = { params: Promise<{ slug: string }> };

/**
 * Prévia de qualquer estado editorial (draft incluso), com pendências
 * marcadas. Desligada em produção salvo ENABLE_DRAFT_PREVIEW=true.
 * Nunca indexável.
 */
export const instant = false;

export function generateStaticParams() {
  return events.listAll().map((event) => ({ slug: event.slug }));
}

function loadPreview(slug: string) {
  if (!isDraftPreviewEnabled()) notFound();
  const event = events.getEventForPreview(slug);
  if (!event) notFound();
  return event;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return buildEventMetadata(loadPreview(slug), "preview");
}

export async function generateViewport({ params }: Props): Promise<Viewport> {
  const { slug } = await params;
  return buildEventViewport(loadPreview(slug));
}

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params;
  return <EventExperience model={resolveExperience(loadPreview(slug), "preview")} />;
}
