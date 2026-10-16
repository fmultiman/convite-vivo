import { describe, expect, it } from "vitest";
import { buildEventMetadata, resolveOgImage } from "@/lib/metadata";
import { parsed, rawDemo, rawMaite } from "./helpers";

describe("metadados", () => {
  it("gera canonical, Open Graph e imagem gerada quando não há arte aprovada", () => {
    const meta = buildEventMetadata(parsed(rawDemo()), "public");
    expect(meta.alternates?.canonical).toBe("/e/demo-clara-e-davi");
    expect(meta.openGraph).toMatchObject({
      title: "Clara & Davi — 20.03.2027",
      url: "/e/demo-clara-e-davi",
      locale: "pt_BR",
      images: [{ url: "/og/demo-clara-e-davi", width: 1200, height: 630 }],
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("usa a arte OG aprovada quando existir", () => {
    const raw = rawMaite();
    Object.assign(raw.assets["og-capa"], {
      status: "approved",
      src: "/events/maite-1-ano/og.jpg",
      width: 1200,
      height: 630,
    });
    expect(resolveOgImage(parsed(raw)).url).toBe("/events/maite-1-ano/og.jpg");
  });

  it("ignora a arte OG enquanto estiver pendente", () => {
    expect(resolveOgImage(parsed(rawMaite())).url).toBe("/og/maite-1-ano");
  });

  it("prévia nunca é indexável e é identificada no título", () => {
    const raw = rawMaite();
    raw.seo.indexable = true;
    const meta = buildEventMetadata(parsed(raw), "preview");
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.title).toEqual({ absolute: "[Prévia] Maitê faz 1 aninho!" });
  });

  it("indexa somente com opt-in explícito", () => {
    const raw = rawMaite();
    raw.seo.indexable = true;
    expect(buildEventMetadata(parsed(raw), "public").robots).toEqual({ index: true, follow: true });
  });
});
