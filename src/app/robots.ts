import type { MetadataRoute } from "next";

/**
 * Convites são privados por padrão (noindex por página) e prévias não são
 * rastreadas. /og/ continua liberado: crawlers de preview (WhatsApp etc.)
 * precisam baixar a imagem social.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: ["/preview/"] },
  };
}
