export const BRAND_NAME = "Convite Vivo";

/**
 * URL pública base usada em canonical e Open Graph.
 * Prioridade: NEXT_PUBLIC_SITE_URL (domínio aprovado) > URL do deployment na Vercel > localhost (dev).
 */
export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured);
  const vercel = process.env.VERCEL_URL;
  return new URL(vercel ? `https://${vercel}` : "http://localhost:3000");
}

/**
 * Rota /preview/[slug] (rascunhos). Ligada em desenvolvimento; em produção só
 * com ENABLE_DRAFT_PREVIEW=true explícito (ex.: ambiente de preview protegido).
 */
export function isDraftPreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.ENABLE_DRAFT_PREVIEW === "true";
}
