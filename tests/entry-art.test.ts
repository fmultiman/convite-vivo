import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { eventConfigSchema } from "@/contract/event.schema";
import { getPublicationIssues } from "@/contract/rules";
import { eventSources } from "@/events";
import { resolveExperience } from "@/renderer/model";
import { parsed, rawDemo, rawMaite, sceneOf } from "./helpers";

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
    sceneOf(missing, "praia").decor[0].asset = "nao-existe";
    expect(issuesOf(missing).some((i) => i.includes('asset "nao-existe" não existe'))).toBe(true);

    const wrongKind = rawMaite();
    sceneOf(wrongKind, "praia").motifAsset = "teaser"; // vídeo
    expect(issuesOf(wrongKind).some((i) => i.includes("deveria ser image"))).toBe(true);
  });

  it("rejeita posição ou largura fora dos limites", () => {
    const raw = rawMaite();
    sceneOf(raw, "praia").decor[0].x = 400;
    sceneOf(raw, "praia").motifPlacement.width = 0;
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
    const usesPerolaA = sceneOf(rawMaite(), "praia").decor.filter((d: { asset: string }) => d.asset === "perola-a").length;
    expect(entryOf(raw).art!.decor.length).toBe(base - usesPerolaA);
  });

  it("sem envelope em imagem e sem decoração (Clara & Davi) não há arte", () => {
    expect(entryOf(rawDemo()).art).toBeNull();
  });

  it("nunca expõe a criança na entrada: nenhum asset da cena é restrito", () => {
    const raw = rawMaite();
    const ids = new Set<string>([
      sceneOf(raw, "praia").background,
      sceneOf(raw, "praia").motifAsset,
      sceneOf(raw, "praia").openAsset,
      sceneOf(raw, "praia").tagAsset,
      ...sceneOf(raw, "praia").decor.map((d: { asset: string }) => d.asset),
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

  it("a pasta pública da Maitê só tem WebP; o único arquivo da criança é a arte autorizada, com hash fixado", () => {
    const dir = join(publicDir, "events", "maite-1-ano");
    const files = readdirSync(dir, { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile())
      .map((e) => join(e.parentPath, e.name).replace(dir, "").replace(/\\/g, "/"));
    expect(files.length).toBeGreaterThan(0);
    const child = files.filter((f) => /maite|kf0|foto|ref-/.test(f));
    expect(child).toEqual(["/scene-03/maite-cavalo-marinho.webp"]);
    for (const f of files) expect(f, f).toMatch(/\.webp$/);
    // O hash da arte autorizada no verificador de segurança é o do arquivo que está no repositório.
    const safety = readFileSync(join(process.cwd(), "scripts/check-public-safety.mjs"), "utf8");
    const pinned = safety.match(/"public\/events\/maite-1-ano\/scene-03\/maite-cavalo-marinho\.webp",\s*"([0-9a-f]{64})"/)?.[1];
    expect(pinned).toBeTruthy();
    expect(createHash("sha256").update(readFileSync(join(dir, "scene-03/maite-cavalo-marinho.webp"))).digest("hex")).toBe(pinned);
  });
});
