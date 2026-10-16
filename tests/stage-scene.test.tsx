import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { eventConfigSchema } from "@/contract/event.schema";
import { events } from "@/events";
import { EventExperience } from "@/renderer/EventExperience";
import { resolveExperience } from "@/renderer/model";
import { parsed, rawDemo, rawMaite, sceneOf } from "./helpers";

vi.mock("@/renderer/fonts", () => {
  const font = (name: string) => ({ className: name, variable: name, cssVar: `--font-${name}` });
  return { fonts: { fraunces: font("fraunces"), nunito: font("nunito"), cormorant: font("cormorant"), jost: font("jost") } };
});
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ priority: _p, unoptimized: _u, ...props }: Record<string, unknown>) => <img {...props} />,
}));

const issuesOf = (raw: unknown) => {
  const r = eventConfigSchema.safeParse(raw);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
};
const stageOf = (raw: Record<string, any>) => {
  const s = resolveExperience(parsed(raw), "public").scenes.find((x) => x.kind === "stage");
  if (s?.kind !== "stage") throw new Error("sem cena stage");
  return s;
};

describe("cena stage — contrato", () => {
  it("a Maitê (com cena submarina e tinta do mergulho) é válida", () => {
    expect(issuesOf(rawMaite())).toEqual([]);
  });

  it("exige fundo imagem existente, decoração e sprites de canvas válidos", () => {
    const raw = rawMaite();
    const stage = sceneOf(raw, "mergulho");
    stage.background = "nao-existe";
    stage.canvas.sprites = ["teaser"]; // vídeo
    stage.decor[0].asset = "tambem-nao-existe";
    const issues = issuesOf(raw);
    expect(issues.some((i) => i.includes('asset "nao-existe" não existe'))).toBe(true);
    expect(issues.some((i) => i.includes("deveria ser image"))).toBe(true);
    expect(issues.some((i) => i.includes('asset "tambem-nao-existe" não existe'))).toBe(true);
  });

  it("limita densidade do canvas e rejeita tinta fora do formato", () => {
    const raw = rawMaite();
    sceneOf(raw, "mergulho").canvas.density = 5;
    sceneOf(raw, "praia").transitionTint = "azul";
    const issues = issuesOf(raw);
    expect(issues.some((i) => i.includes("canvas.density"))).toBe(true);
    expect(issues.some((i) => i.includes("transitionTint"))).toBe(true);
  });

  it("as bolhas CSS ficam em primeiro plano (sempre presentes) e o canvas é opcional", () => {
    const raw = rawMaite();
    const rising = sceneOf(raw, "mergulho").decor.filter((d: { motion?: string }) => d.motion === "rise");
    expect(rising.length).toBeGreaterThanOrEqual(8);
    expect(rising.every((d: { plane?: string; appear?: string }) => d.plane === "front" && d.appear !== "withoutCanvas")).toBe(true);
    delete sceneOf(raw, "mergulho").canvas;
    expect(issuesOf(raw)).toEqual([]);
    expect(stageOf(raw).art?.canvas).toBeNull();
  });
});

describe("cena stage — modelo", () => {
  it("resolve fundo, decoração e sprites do canvas", () => {
    const art = stageOf(rawMaite()).art!;
    expect(art.background.src).toBe("/events/maite-1-ano/scene-02/bg-mar.webp");
    expect(art.decor.filter((d) => d.plane === "front" && d.motion === "rise").length).toBeGreaterThanOrEqual(8);
    expect(art.canvas!.motes).toBe(1);
    expect(art.canvas!.sprites.map((s) => s.src)).toEqual([
      "/events/maite-1-ano/scene-01/bolha-g.webp",
      "/events/maite-1-ano/scene-01/bolha-m.webp",
      "/events/maite-1-ano/scene-01/bolha-p.webp",
    ]);
  });

  it("sem o fundo pronto não há arte (a cena vira só texto) e sprites indisponíveis são descartados", () => {
    const raw = rawMaite();
    raw.assets["bolha-g"].status = "pending";
    raw.assets["bolha-g"].src = undefined;
    expect(stageOf(raw).art!.canvas!.sprites).toHaveLength(2);
    raw.assets["bg-mar"].status = "pending";
    raw.assets["bg-mar"].src = undefined;
    expect(stageOf(raw).art).toBeNull();
  });
});

describe("cena stage — HTML", () => {
  const html = renderToStaticMarkup(
    <EventExperience model={resolveExperience(events.getEventForPreview("maite-1-ano")!, "preview")} />,
  );

  it("texto e dica de rolagem são HTML real; a cena é a primeira após a entrada", () => {
    expect(html).toContain("Bem-vindo ao fundo do mar encantado");
    expect(html).toContain("Deslize para continuar");
    expect(html).toMatch(/<section[^>]*id="mergulho"[^>]*data-first/);
    expect(html).toMatch(/aria-labelledby="mergulho-title"/);
  });

  it("no servidor não há canvas (aprimoramento no cliente); bolhas, peixes, luz e partículas em CSS já vêm no HTML", () => {
    expect(html).not.toContain("<canvas");
    expect((html.match(/data-plane="front"/g) ?? []).length).toBeGreaterThanOrEqual(8); // bolhas CSS em primeiro plano
    expect((html.match(/data-fish/g) ?? []).length).toBe(9); // peixes SVG independentes
    expect((html.match(/data-layer="(bg|far|mid|near|front)"/g) ?? []).length).toBe(5); // planos de profundidade
    expect(html).toMatch(/class="[^"]*ray[^"]*"/); // raios de luz
  });

  it("peixes são decorativos: SVG oculto aos leitores de tela, sem texto nem imagem externa", () => {
    const stage = html.slice(html.indexOf('id="mergulho"'));
    const fish = stage.match(/<div[^>]*data-fish[^>]*>[\s\S]*?<\/svg>/g) ?? [];
    expect(fish).toHaveLength(9);
    for (const f of fish) {
      expect(f).toContain('aria-hidden="true"');
      expect(f).not.toMatch(/<img|<text|<title/);
    }
  });

  it("os gradientes dos peixes são emitidos uma vez por variante usada", () => {
    for (const v of ["coral", "lilas", "aqua", "perola"]) {
      expect((html.match(new RegExp(`id="mergulho-fish-body-${v}"`, "g")) ?? []).length).toBe(1);
    }
  });

  it("o fundo só entra depois do essencial da entrada (não compete com a Cena 01)", () => {
    expect(html).not.toContain("scene-02/bg-mar.webp");
  });

  it("Clara & Davi não ganha nada da cena submarina", () => {
    const demo = renderToStaticMarkup(
      <EventExperience model={resolveExperience(events.getPublishedEvent("demo-clara-e-davi")!, "public")} />,
    );
    expect(demo).not.toContain("data-stage");
    expect(demo).not.toContain("<canvas");
    expect(rawDemo().scenes.some((s: { kind: string }) => s.kind === "stage")).toBe(false);
  });
});

describe("cena stage — peixes, ambiência e idle (contrato)", () => {
  it("valida peixes: posição, tamanho, duração e fase dentro dos limites", () => {
    const raw = rawMaite();
    sceneOf(raw, "mergulho").fish[0].size = 80;
    sceneOf(raw, "mergulho").fish[1].phase = 2;
    sceneOf(raw, "mergulho").fish[2].variant = "dourado";
    sceneOf(raw, "mergulho").ambience = { light: 3 };
    const issues = issuesOf(raw);
    for (const key of ["fish.0.size", "fish.1.phase", "fish.2.variant", "ambience.light"]) {
      expect(issues.some((i) => i.includes(key)), key).toBe(true);
    }
  });

  it("peixes e ambiência são opcionais (a cena continua válida sem eles)", () => {
    const raw = rawMaite();
    delete sceneOf(raw, "mergulho").fish;
    delete sceneOf(raw, "mergulho").ambience;
    expect(issuesOf(raw)).toEqual([]);
    const s = stageOf(raw);
    expect(s.fish).toEqual([]);
    expect(s.ambience).toEqual({ light: 0.6, motes: 10, parallax: true });
  });

  it("aceita o movimento idle (personagem principal) e o plano front", () => {
    const raw = rawMaite();
    const item = sceneOf(raw, "mergulho").decor[0];
    item.motion = "idle";
    item.plane = "front";
    expect(issuesOf(raw)).toEqual([]);
    const html = renderToStaticMarkup(<EventExperience model={resolveExperience(parsed(raw), "preview")} />);
    expect(html).toContain('data-motion="idle"');
  });

  it("a Maitê (criança) continua pendente: nenhum asset dela é público ou resolvido", () => {
    const raw = rawMaite();
    expect(raw.assets["kf03-maite-cavalo-marinho"].status).toBe("pending");
    expect(raw.assets["kf03-maite-cavalo-marinho"].src).toBeUndefined();
    expect(JSON.stringify(raw)).not.toMatch(/maite-cavalo-marinho\.(webp|png)/);
    const html = renderToStaticMarkup(
      <EventExperience model={resolveExperience(events.getEventForPreview("maite-1-ano")!, "preview")} />,
    );
    expect(html).not.toMatch(/maite-cavalo-marinho\.(webp|png)/);
  });

  it("a luz, os planos e os peixes respeitam reduced motion (CSS)", () => {
    const css = readFileSync(join(process.cwd(), "src/renderer/scenes/stage.module.css"), "utf8");
    const fishCss = readFileSync(join(process.cwd(), "src/renderer/fx/fish.module.css"), "utf8");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const sel of [".ray", ".surface", ".caustics", ".plane", ".motes span"]) expect(reduced, sel).toContain(sel);
    expect(fishCss.slice(fishCss.indexOf("@media (prefers-reduced-motion: reduce)"))).toMatch(/animation:\s*none/);
  });

  it("só transform/opacity nas animações de luz, planos e peixes (nada de layout)", () => {
    const css = readFileSync(join(process.cwd(), "src/renderer/scenes/stage.module.css"), "utf8");
    const fishCss = readFileSync(join(process.cwd(), "src/renderer/fx/fish.module.css"), "utf8");
    for (const name of ["ray-pulse", "surface", "caustics", "mote", "drift-bg", "drift-far", "drift-mid", "drift-near", "drift-front", "idle", "sway"]) {
      const body = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
      expect(body, name).not.toMatch(/\b(top|left|right|bottom|width|height|margin|filter|var\()/);
    }
    for (const name of ["swim-ltr", "swim-rtl", "bob", "wag", "flutter"]) {
      const body = fishCss.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
      expect(body, name).toMatch(/transform/);
      expect(body, name).not.toMatch(/\b(top|left|width|height|margin|filter|var\()/);
    }
  });
});

describe("BubbleCanvas — regras que não podem regredir", () => {
  // Só o código conta: comentários que mencionam as regras não devem disparar a guarda.
  const src = readFileSync(join(process.cwd(), "src/renderer/fx/BubbleCanvas.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("não captura eventos: ouvintes passivos, sem preventDefault", () => {
    expect(src).not.toMatch(/preventDefault|stopPropagation/);
    const listeners = src.match(/addEventListener\("pointer\w+",[^)]*\{ passive: true \}\)/g) ?? [];
    expect(listeners.length).toBeGreaterThanOrEqual(4);
  });

  it("não usa estado React por quadro", () => {
    expect(src).not.toMatch(/useState|useReducer|setState/);
  });

  it("limpa tudo ao desmontar", () => {
    for (const piece of ["cancelAnimationFrame", "removeEventListener", "disconnect()", "removeAttribute"]) {
      expect(src, piece).toContain(piece);
    }
  });

  it("respeita a visibilidade da aba e a resolução máxima", () => {
    expect(src).toContain("visibilitychange");
    expect(src).toMatch(/DPR_CAP\s*=\s*1\.5/);
  });

  it("o canvas nunca recebe ponteiro (CSS)", () => {
    const css = readFileSync(join(process.cwd(), "src/renderer/scenes/stage.module.css"), "utf8");
    expect(css).toMatch(/\.canvas\s*\{[^}]*pointer-events:\s*none/);
  });
});
