export const BRAND_NAME = "Convite Vivo";

/** URL pública base usada em canonical e Open Graph. */
export function getSiteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
}

/**
 * Rota /preview/[slug] (rascunhos). Ligada em desenvolvimento; em produção só
 * com ENABLE_DRAFT_PREVIEW=true explícito (ex.: ambiente de preview protegido).
 */
export function isDraftPreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ENABLE_DRAFT_PREVIEW === "true";
}
