import type { Metadata, Viewport } from "next";
import type { EventConfig } from "@/contract/event.schema";
import type { RenderMode } from "@/renderer/model";
import { BRAND_NAME } from "./site";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export function eventPath(slug: string): string {
  return `/e/${slug}`;
}

/** Imagem social: asset aprovado ou imagem gerada a partir da identidade visual. */
export function resolveOgImage(event: EventConfig): { url: string; width: number; height: number; alt: string } {
  const asset = event.og.image ? event.assets[event.og.image] : undefined;
  if (asset?.kind === "image" && asset.status === "approved" && asset.src && asset.width && asset.height) {
    return { url: asset.src, width: asset.width, height: asset.height, alt: asset.alt };
  }
  return { url: `/og/${event.slug}`, ...OG_IMAGE_SIZE, alt: event.og.title };
}

/**
 * Metadados por evento. Convites não são indexáveis por padrão (privacidade);
 * a prévia nunca é. O canonical sempre aponta para a URL pública /e/<slug>.
 */
export function buildEventMetadata(event: EventConfig, mode: RenderMode): Metadata {
  const image = resolveOgImage(event);
  const indexable = mode === "public" && event.seo.indexable && !event.demo;
  const title = mode === "preview" ? `[Prévia] ${event.og.title}` : event.og.title;

  return {
    title: { absolute: title },
    description: event.og.description,
    alternates: { canonical: eventPath(event.slug) },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: BRAND_NAME,
      url: eventPath(event.slug),
      title: event.og.title,
      description: event.og.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: event.og.title,
      description: event.og.description,
      images: [image.url],
    },
  };
}

export function buildEventViewport(event: EventConfig): Viewport {
  return { themeColor: event.theme.colors.backdropFrom };
}
