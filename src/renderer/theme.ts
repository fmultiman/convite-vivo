import type { CSSProperties } from "react";
import type { Theme } from "@/contract/event.schema";
import { fonts } from "./fonts";

const radius: Record<Theme["shape"], string> = { soft: "14px", round: "28px", sharp: "2px" };

/** Identidade visual do evento → custom properties consumidas pelo CSS dos componentes. */
export function themeStyle(theme: Theme): CSSProperties {
  const c = theme.colors;
  return {
    "--cv-backdrop-from": c.backdropFrom,
    "--cv-backdrop-to": c.backdropTo,
    "--cv-surface": c.surface,
    "--cv-text": c.text,
    "--cv-text-muted": c.textMuted,
    "--cv-accent": c.accent,
    "--cv-accent-contrast": c.accentContrast,
    "--cv-highlight": c.highlight,
    "--cv-radius": radius[theme.shape],
    "--cv-font-display": `var(${fonts[theme.fonts.display].cssVar}), Georgia, serif`,
    "--cv-font-body": `var(${fonts[theme.fonts.body].cssVar}), system-ui, sans-serif`,
  } as CSSProperties;
}

export function themeFontClasses(theme: Theme): string {
  return [fonts[theme.fonts.display].variable, fonts[theme.fonts.body].variable].join(" ");
}
