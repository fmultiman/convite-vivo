import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eventConfigSchema } from "@/contract/event.schema";
import { getPublicationIssues } from "@/contract/rules";
import { eventSources } from "@/events";
import { resolveExperience } from "@/renderer/model";
import { parsed, rawDemo, rawMaite } from "./helpers";

function issuesOf(raw: unknown): string[] {
  const result = eventConfigSchema.safeParse(raw);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

function entryOf(raw: Record<string, any>, mode: "public" | "preview" = "public") {
  const entry = resolveExperience(parsed(raw), mode).scenes.find((s) => s.kind === "entry");
  if (entry?.kind !== "entry") throw new Error("sem cena de entrada");
  return entry;
}

describe("entrada em camadas — contrato", () => {
  it("aceita a configuração da Maitê com arte, envelope em imagem e decoração", () => {
    expect(issuesOf(rawMaite())).toEqual([]);
  });

  it("rejeita decoração que aponta para asset inexistente ou de outro tipo", () => {
    const missing = rawMaite();
    missing.scenes[0].decor[0].asset = "nao-existe";
    expect(issuesOf(missing).some((i) => i.includes('asset "nao-existe" não existe'))).toBe(true);

    const wrongKind = rawMaite();
    wrongKind.scenes[0].motifAsset = "teaser"; // vídeo
    expect(issuesOf(wrongKind).some((i) => i.includes("deveria ser image"))).toBe(true);
  });

  it("rejeita posição ou largura fora dos limites", () => {
    const raw = rawMaite();
    raw.scenes[0].decor[0].x = 400;
    raw.scenes[0].motifPlacement.width = 0;
    const issues = issuesOf(raw);
    expect(issues.some((i) => i.startsWith("scenes.0.decor.0.x"))).toBe(true);
    expect(issues.some((i) => i.startsWith("scenes.0.motifPlacement.width"))).toBe(true);
  });

  it("assets de decoração pendentes viram aviso de publicação, não bloqueio", () => {
    const raw = rawMaite();
    for (const id of ["bolha-g", "conchas-leque"]) raw.assets[id].status = "pending";
    raw.assets["bolha-g"].src = undefined;
    raw.assets["conchas-leque"].src = undefined;
    const warnings = getPublicationIssues(parsed(raw)).filter((i) => i.severity === "warning").map((i) => i.path);
    expect(warnings).toEqual(expect.arrayContaining(["assets.bolha-g", "assets.conchas-leque"]));
  });
});

describe("entrada em camadas — modelo", () => {
  it("resolve a arte: fundo, envelope fechado/aberto, placa e decoração", () => {
    const { art } = entryOf(rawMaite());
    expect(art).not.toBeNull();
    expect(art!.background.src).toBe("/events/maite-1-ano/scene-01/bg-praia.webp");
    expect(art!.motif?.src).toContain("env-fechado");
    expect(art!.open?.src).toContain("env-aberto");
    expect(art!.tag?.src).toContain("placa-tag");
    expect(art!.decor.filter((d) => d.appear === "onOpen").length).toBeGreaterThan(0);
    expect(art!.decor.filter((d) => d.appear === "always").length).toBeGreaterThan(0);
    expect(art!.motifPlacement.tilt).toBeGreaterThan(0);
  });

  it("sem fundo pronto não há arte: cai no layout simples", () => {
    const raw = rawMaite();
    raw.assets["bg-praia"].status = "pending";
    raw.assets["bg-praia"].src = undefined;
    expect(entryOf(raw).art).toBeNull();
  });

  it("descarta decoração cujo asset não está pronto, sem quebrar a cena", () => {
    const base = entryOf(rawMaite()).art!.decor.length;
    const raw = rawMaite();
    raw.assets["perola-a"].status = "pending";
    raw.assets["perola-a"].src = undefined;
    const usesPerolaA = rawMaite().scenes[0].decor.filter((d: { asset: string }) => d.asset === "perola-a").length;
    expect(entryOf(raw).art!.decor.length).toBe(base - usesPerolaA);
  });

  it("sem envelope em imagem e sem decoração (Clara & Davi) não há arte", () => {
    expect(entryOf(rawDemo()).art).toBeNull();
  });

  it("nunca expõe a criança na entrada: nenhum asset da cena é restrito", () => {
    const raw = rawMaite();
    const ids = new Set<string>([
      raw.scenes[0].background,
      raw.scenes[0].motifAsset,
      raw.scenes[0].openAsset,
      raw.scenes[0].tagAsset,
      ...raw.scenes[0].decor.map((d: { asset: string }) => d.asset),
    ]);
    for (const id of ids) {
      expect(raw.assets[id].src, id).toMatch(/^\/events\/maite-1-ano\/scene-01\/[a-z-]+\.webp$/);
      expect(`${id} ${raw.assets[id].source ?? ""}`.toLowerCase()).not.toMatch(/maite|kf0|private|foto/);
    }
  });
});

describe("assets publicados em public/", () => {
  const publicDir = join(process.cwd(), "public");

  it("todo asset aprovado referenciado por um evento existe em disco", () => {
    const missing: string[] = [];
    for (const [slug, raw] of Object.entries(eventSources)) {
      const event = parsed(raw);
      for (const [id, asset] of Object.entries(event.assets)) {
        if (asset.status === "approved" && asset.src?.startsWith("/events/") && !existsSync(join(publicDir, asset.src))) {
          missing.push(`${slug}:${id} → ${asset.src}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("a pasta pública da Maitê contém somente derivados desta cena, sem arquivos da criança", () => {
    const dir = join(publicDir, "events", "maite-1-ano");
    const files = readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => e.name);
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      expect(name, name).toMatch(/^[a-z-]+\.webp$/);
      expect(name).not.toMatch(/maite|kf0|foto|ref-/);
    }
  });
});
