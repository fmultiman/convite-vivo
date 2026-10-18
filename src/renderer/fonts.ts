/**
 * Catálogo de fontes do renderer. A config do evento escolhe chaves deste
 * catálogo (`theme.fonts.display` / `theme.fonts.body`); nenhuma fonte é
 * carregada de fora em tempo de execução (next/font hospeda os arquivos).
 *
 * `preload: false`: como várias famílias convivem no mesmo app, evitamos
 * pré-carregar fontes que o evento atual não usa.
 */
import { Cormorant_Garamond, Fraunces, Jost, Nunito } from "next/font/google";
import type { FontKey } from "@/contract/event.schema";

// Eixos opcionais: SOFT (terminais arredondados, o ar "de conto"), WONK (itálico mais gracioso) e opsz
// (o desenho se adapta ao tamanho: em corpo pequeno fica mais robusto e legível sobre a arte).
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap", preload: false });

export const fonts: Record<FontKey, { className: string; variable: string; cssVar: string }> = {
  fraunces: { className: fraunces.className, variable: fraunces.variable, cssVar: "--font-fraunces" },
  nunito: { className: nunito.className, variable: nunito.variable, cssVar: "--font-nunito" },
  cormorant: { className: cormorant.className, variable: cormorant.variable, cssVar: "--font-cormorant" },
  jost: { className: jost.className, variable: jost.variable, cssVar: "--font-jost" },
};
