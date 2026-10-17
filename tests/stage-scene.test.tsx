import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { eventConfigSchema } from "@/contract/event.schema";
import { events } from "@/events";
import { EventExperience } from "@/renderer/EventExperience";
import { referencedActionIds, referencedAssetIds } from "@/contract/rules";
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

  // A cena de mergulho (primeira); a de chegada tem os seus próprios testes (revelação).
  const mergulho = html.slice(html.indexOf('id="mergulho"'), html.indexOf('id="chegada"'));

  it("no servidor não há canvas (aprimoramento no cliente); bolhas, peixes, luz e partículas em CSS já vêm no HTML", () => {
    expect(html).not.toContain("<canvas");
    expect((mergulho.match(/data-plane="front"/g) ?? []).length).toBeGreaterThanOrEqual(8); // bolhas CSS em primeiro plano
    expect((mergulho.match(/data-fish/g) ?? []).length).toBe(9); // peixes SVG independentes
    expect((mergulho.match(/data-layer="(bg|far|mid|near|front)"/g) ?? []).length).toBe(5); // planos de profundidade
    expect(mergulho).toMatch(/class="[^"]*ray[^"]*"/); // raios de luz
    expect(mergulho).not.toContain("data-feature"); // sem destaque nesta cena
  });

  it("peixes são decorativos: SVG oculto aos leitores de tela, sem texto nem imagem externa", () => {
    const stage = mergulho;
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
      expect((html.match(new RegExp(`id="chegada-fish-body-${v}"`, "g")) ?? []).length).toBeLessThanOrEqual(1); // ids por cena
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

  it("o asset da Maitê é a única imagem da criança: caminho exato, sem arquivos originais", () => {
    const raw = rawMaite();
    const a = raw.assets["kf03-maite-cavalo-marinho"];
    expect(a).toMatchObject({ status: "approved", src: "/events/maite-1-ano/scene-03/maite-cavalo-marinho.webp", width: 956, height: 1357 });
    const json = JSON.stringify(raw);
    expect(json).not.toMatch(/\.png|assets\/|_prepared|\.pdf/i);
    expect((json.match(/maite-cavalo-marinho\.webp/g) ?? []).length).toBe(1);
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

describe("cena stage — revelação de destaque (feature)", () => {
  const preview = () => renderToStaticMarkup(<EventExperience model={resolveExperience(events.getEventForPreview("maite-1-ano")!, "preview")} />);
  const publicHtml = (raw: unknown) => renderToStaticMarkup(<EventExperience model={resolveExperience(parsed(raw), "public")} />);
  const chegada = (html: string) => html.slice(html.indexOf('id="chegada"'), html.indexOf('id="concha"') > 0 ? html.indexOf('id="concha"') : undefined);

  it("a Maitê tem um destaque configurado, em segundo palco, sem criar novo tipo de cena", () => {
    const sc = sceneOf(rawMaite(), "chegada");
    expect(sc.kind).toBe("stage");
    expect(sc.feature).toMatchObject({ asset: "kf03-maite-cavalo-marinho", sparkles: 14, glow: true });
    expect(sc.view.zoom).toBeGreaterThan(1);
    expect(sc.decor.filter((d: { appear?: string }) => d.appear === "onReveal").length).toBeGreaterThanOrEqual(6);
  });

  it("palcos consecutivos formam um grupo: mundo fixo, entrada por sentinela, só o segundo é 'after'", () => {
    const html = preview();
    expect(html).toMatch(/data-stage-group/);
    expect(html).toMatch(/id="mergulho"[^>]*data-grouped/);
    expect(html).not.toMatch(/id="mergulho"[^>]*data-after-stage/);
    expect(html).toMatch(/id="chegada"[^>]*data-grouped=""[^>]*data-after-stage="true"/);
    expect(html).not.toMatch(/id="chegada"[^>]*data-group-last/); // o último do grupo é a concha
    expect(html).toMatch(/id="concha"[^>]*data-grouped=""[^>]*data-after-stage="true"[^>]*data-group-last/);
    expect(html).toMatch(/id="chegada"[\s\S]*?data-sentinel/);
    expect(html).not.toMatch(/id="mergulho"[\s\S]{0,400}?data-sentinel/);
  });

  it("o segundo palco repete o mundo do primeiro (decoração e peixes idênticos): a dissolução é imperceptível", () => {
    const raw = rawMaite();
    const a = sceneOf(raw, "mergulho");
    const b = sceneOf(raw, "chegada");
    const key = (d: Record<string, unknown>) => JSON.stringify([d.asset, d.x, d.y, d.width, d.plane ?? "mid", d.motion ?? "none", d.delay ?? 0, d.flip ?? false, d.tilt ?? 0, d.rotate ?? 0]);
    const inB = new Set(b.decor.map(key));
    for (const d of a.decor) expect(inB.has(key(d)), key(d)).toBe(true);
    expect(b.fish).toEqual(a.fish);
    expect(b.ambience.light).toBe(a.ambience.light);
    expect(b.canvas).toEqual(a.canvas);
    // o que é novo no segundo palco: só o que pertence à revelação
    const extra = b.decor.filter((d: Record<string, unknown>) => !a.decor.some((x: Record<string, unknown>) => key(x) === key(d)));
    expect(extra.every((d: { appear?: string }) => d.appear === "onReveal")).toBe(true);
  });

  it("o mundo fixo só vale com JS; sem JS fica o empilhamento antigo; sem máscaras no mundo fixo", () => {
    const css = readFileSync(join(process.cwd(), "src/renderer/scenes/stage.module.css"), "utf8");
    expect(css).toMatch(/:global\(\.js\) \.stage\[data-grouped\] \.box,\s*:global\(\.js\) \.stage\[data-grouped\] \.fill\s*\{[^}]*position:\s*fixed/);
    expect(css).toMatch(/:global\(\.js\) \.stage\[data-grouped\] \.box\s*\{[^}]*mask-image:\s*none/);
    expect(css).toMatch(/:global\(html:not\(\.js\)\) \.stage\[data-after-stage\]\s*\{[^}]*margin-top:\s*-16dvh/);
    const exp = readFileSync(join(process.cwd(), "src/renderer/experience.module.css"), "utf8");
    expect(exp).toMatch(/\.stageGroup\s*\{[^}]*clip-path:\s*inset\(0\)/);
  });

  it("clara & davi não é afetado: sem grupos nem sentinelas", () => {
    const demo = renderToStaticMarkup(<EventExperience model={resolveExperience(events.getPublishedEvent("demo-clara-e-davi")!, "public")} />);
    expect(demo).not.toContain("data-stage-group");
    expect(demo).not.toContain("data-sentinel");
  });

  it("com a arte aprovada, o destaque é a imagem da Maitê (prévia e público) com texto alternativo", () => {
    for (const html of [chegada(preview()), chegada(publicHtml(rawMaite()))]) {
      expect(html).toContain("data-feature");
      expect(html).toMatch(/id="chegada"[^>]*data-has-feature/);
      expect(html).toMatch(/<img[^>]*alt="Ilustração da Maitê[^"]*"[^>]*maite-cavalo-marinho\.webp|<img[^>]*maite-cavalo-marinho\.webp[^>]*alt="Ilustração da Maitê/);
      expect(html).not.toContain("data-asset-placeholder");
    }
  });

  it("se o asset voltar a pendente: placeholder animável na prévia e destaque omitido no público", () => {
    const raw = rawMaite();
    raw.assets["kf03-maite-cavalo-marinho"].status = "pending";
    raw.assets["kf03-maite-cavalo-marinho"].src = undefined;
    const pv = chegada(renderToStaticMarkup(<EventExperience model={resolveExperience(parsed(raw), "preview")} />));
    expect(pv).toContain("data-asset-placeholder");
    expect(pv).toContain("Maitê e o cavalo-marinho");
    const pub = chegada(publicHtml(raw));
    expect(pub).not.toContain("data-feature");
    expect(pub).not.toContain("data-has-feature");
    expect(pub).toContain("Olá! Eu sou a Maitê"); // o texto continua legível
  });

  it("com asset aprovado, o destaque é uma imagem com texto alternativo real (conteúdo, não decoração)", () => {
    const raw = rawMaite();
    raw.assets["kf03-maite-cavalo-marinho"] = {
      kind: "image", status: "approved", src: "/events/maite-1-ano/scene-03/stand-in.webp", width: 700, height: 1000,
      alt: "Personagem de teste sobre um cavalo-marinho.", placeholderLabel: "teste", source: "teste",
    };
    const html = chegada(publicHtml(raw));
    expect(html).toMatch(/<img[^>]*alt="Personagem de teste sobre um cavalo-marinho\."/);
    expect(html).not.toMatch(/<img[^>]*alt=""[^>]*stand-in/);
    expect(html).not.toContain("data-asset-placeholder");
  });

  it("o estado inicial vem do contrato (de onde o destaque parte) e o brilho/faíscas são decorativos", () => {
    const html = chegada(preview());
    expect(html).toMatch(/--fx:-6/);
    expect(html).toMatch(/--fy:-14/);
    expect(html).toMatch(/--fs:0\.5/);
    expect(html).toMatch(/--fdelay:0\.9s/);
    expect((html.match(/data-reach=/g) ?? []).length).toBe(14);
    expect(html).toMatch(/class="[^"]*glow[^"]*" aria-hidden="true"/);
    expect(html).toMatch(/class="[^"]*sparks[^"]*"[^>]*aria-hidden="true"/);
  });

  it("limites do contrato: posição, escala inicial e faíscas", () => {
    const raw = rawMaite();
    const f = sceneOf(raw, "chegada").feature;
    f.width = 300;
    f.from = { scale: 3 };
    f.sparkles = 99;
    f.delay = 60;
    const issues = issuesOf(raw);
    for (const key of ["feature.width", "feature.from.scale", "feature.sparkles", "feature.delay"]) {
      expect(issues.some((i) => i.includes(key)), key).toBe(true);
    }
  });

  it("é reutilizável: o evento fictício ganha o mesmo destaque sem tocar no código", () => {
    const raw = rawDemo();
    const art = Object.entries(raw.assets).find(([, a]) => (a as { kind: string; status: string }).kind === "image" && (a as { status: string }).status === "approved")!;
    raw.scenes.splice(2, 0, {
      kind: "stage", id: "presente", headline: "Uma surpresa chegou", background: art[0],
      feature: { asset: art[0], x: 50, y: 55, width: 40, sparkles: 6 },
    });
    expect(issuesOf(raw)).toEqual([]);
    const html = publicHtml(raw);
    expect(html).toMatch(/<section[^>]*id="presente"[^>]*data-has-feature/);
    expect(html).toContain("Uma surpresa chegou");
    expect((html.match(/data-reach=/g) ?? []).length).toBe(6);
  });
});

describe("revelação — regras de código (CSS e hook)", () => {
  const css = readFileSync(join(process.cwd(), "src/renderer/scenes/stage.module.css"), "utf8");
  const tsx = readFileSync(join(process.cwd(), "src/renderer/scenes/StageScene.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("sem JavaScript o destaque aparece pronto: o estado recolhido só vale com a classe .js", () => {
    const hidden = css.match(/([^{}]*)\.approach\s*\{[^}]*opacity:\s*0/g) ?? [];
    expect(hidden.length).toBeGreaterThan(0);
    for (const rule of hidden) expect(rule).toContain(":global(.js)");
  });

  it("a aproximação usa transições de translate/scale/rotate/opacity (compositor), com origem no contrato", () => {
    const rule = css.match(/\.approach\s*\{[\s\S]*?\n\}/)![0];
    expect(rule).toMatch(/transition:[\s\S]*translate[\s\S]*scale[\s\S]*rotate[\s\S]*opacity/);
    expect(rule).not.toMatch(/\b(top|left|width|height|margin|filter)\s*[:,]/);
    expect(css).toMatch(/translate:\s*calc\(var\(--fx\)/);
  });

  it("reduced motion: destaque pronto, sem idle, faíscas nem brilho pulsando", () => {
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const piece of [".approach", ".idle", ".sparks", ".glow", "transition: none"]) expect(reduced, piece).toContain(piece);
    expect(tsx).toMatch(/if \(reduced\) \{\s*el\.setAttribute\("data-revealed"/);
  });

  it("a revelação roda uma vez, sem estado React, e é rearmada pelo replay", () => {
    expect(tsx).toContain("IntersectionObserver");
    expect(tsx).toMatch(/io\?\.disconnect\(\)/);
    expect(tsx).toContain("EXPERIENCE_EVENTS.replay");
    expect(tsx).toContain("removeEventListener");
    const hook = tsx.slice(tsx.indexOf("function useReveal"), tsx.indexOf("function Sparkles"));
    expect(hook).not.toMatch(/useState|setState/);
  });

  it("nenhum keyframe novo usa var() (para continuar no compositor)", () => {
    for (const name of ["bloom", "breathe", "fly-s", "fly-m", "fly-l"]) {
      const body = css.match(new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`))?.[1] ?? "";
      expect(body.length, name).toBeGreaterThan(10);
      expect(body, name).not.toMatch(/var\(|\b(top|left|width|height|margin|filter)\b/);
    }
  });
});

describe("desempenho — causas medidas que não podem voltar", () => {
  const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
  const css = read("src/renderer/scenes/stage.module.css");
  const fishCss = read("src/renderer/fx/fish.module.css");
  const noComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "");

  it("a deriva dos planos fica numa camada interna, separada do parallax (translate) e da câmera (scale)", () => {
    const code = noComments(css);
    expect(code).toMatch(/\.plane\[data-layer="far"\] > \.drift\s*\{[^}]*animation:\s*drift-far/);
    // nenhum seletor .plane[...] (o elemento que recebe translate/scale) anima transform
    for (const m of code.matchAll(/(\.plane(?:\[data-layer="\w+"\])?)\s*\{([^}]*)\}/g)) {
      expect(m[2], m[1]).not.toMatch(/animation:/);
    }
    const html = renderToStaticMarkup(<EventExperience model={resolveExperience(events.getEventForPreview("maite-1-ano")!, "preview")} />);
    expect((html.match(/data-layer="(bg|far|mid|near|front)"[^>]*><div class="[^"]*drift/g) ?? []).length).toBe(15); // 5 planos × 3 palcos
  });

  it("sem unidades de container nem container-type no mundo (impedem o compositor de animar)", () => {
    // Unidades de container só no cartão do convite (estático, sem animação dentro): `.frame`.
    for (const m of noComments(css).matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (/container-type|cqw|cqh/.test(m[2])) expect(m[1].trim(), "cq fora do cartão").toMatch(/^\.frame/);
    }
    expect(noComments(fishCss)).not.toMatch(/container-type|cqw|@supports/);
  });

  it("peixes: cauda, corpo e nadadeira são três <svg> próprios; nada de animação em <g> dentro do SVG", () => {
    const html = renderToStaticMarkup(<EventExperience model={resolveExperience(events.getEventForPreview("maite-1-ano")!, "preview")} />);
    const stage = html.slice(html.indexOf('id="mergulho"'), html.indexOf('id="chegada"'));
    const lane = stage.match(/<div[^>]*data-fish[^>]*>[\s\S]*?<\/div><\/div><\/div>/)![0];
    expect((lane.match(/<svg/g) ?? []).length).toBe(3);
    expect(lane).not.toMatch(/<g[^>]*class=/);
    expect(noComments(fishCss)).toMatch(/\.tail\s*\{[^}]*animation:\s*wag/);
    expect(noComments(fishCss)).toMatch(/@keyframes swim-ltr\s*\{[^}]*translate3d\(-38%/);
  });

  it("mundo fora de cena é display:none (não anima nem custa); ao voltar, as animações são ressincronizadas", () => {
    const code = noComments(css);
    expect(code).toMatch(/\[data-after-stage\]:not\(\[data-live\]\) \.box\s*\{[^}]*display:\s*none/);
    expect(code).toMatch(/\.stage\[data-grouped\]\[data-covered\] \.box\s*\{[^}]*display:\s*none/);
    expect(code).toMatch(/\[data-after-stage\]:not\(\[data-entered\]\) \.box,[\s\S]*?\{[^}]*opacity:\s*0/);
    expect(code).toMatch(/\.stage\[data-share-fill\] \.fill\s*\{[^}]*display:\s*none/);
    const tsx = noComments(read("src/renderer/scenes/StageScene.tsx"));
    expect(tsx).toContain("function syncWorld");
    expect(tsx).toMatch(/syncWorld\(prevWorld\(\), myWorld\(\)\)/);
    expect(tsx).toMatch(/syncWorld\(myWorld\(\), prevWorld\(\)\)/);
    expect(tsx).toMatch(/void el\.offsetHeight/); // fixa o estado inicial da dissolução
    const html = renderToStaticMarkup(<EventExperience model={resolveExperience(events.getEventForPreview("maite-1-ano")!, "preview")} />);
    expect((html.match(/data-world/g) ?? []).length).toBe(3);
    expect(html).toMatch(/id="chegada"[^>]*data-share-fill/); // mesmo fundo: o desfocado das laterais é um só
    expect(html).not.toMatch(/id="mergulho"[^>]*data-share-fill/);
  });

  it("cada canvas só roda enquanto o seu mundo é visto (coberto/ao vivo), com limpeza do observador", () => {
    const src = noComments(read("src/renderer/fx/BubbleCanvas.tsx"));
    expect(src).toContain("data-covered");
    expect(src).toContain("data-live");
    expect(src).toMatch(/const shouldRun = \(\) => inView && tabVisible && entered && worldLive\(\)/);
    expect(src).toMatch(/mo\.disconnect\(\)/);
    const reveal = noComments(read("src/renderer/scenes/StageScene.tsx"));
    expect(reveal).toContain('setAttribute("data-covered"');
    expect(reveal).toContain('removeAttribute("data-covered")');
    expect(reveal).toMatch(/window\.clearTimeout\(coverTimer\)/);
  });
});

describe("cena 04 — a grande concha e o convite (stage com painel)", () => {
  const read = (f: string) => readFileSync(join(process.cwd(), f), "utf8");
  const noComments = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, "");
  const render = (mode: "preview" | "public") =>
    renderToStaticMarkup(<EventExperience model={resolveExperience(mode === "preview" ? events.getEventForPreview("maite-1-ano")! : parsed(rawMaite()), mode)} />);
  const concha = (html: string) => html.slice(html.indexOf('id="concha"'), html.indexOf('id="final"'));

  it("a concha é o 3º palco do mesmo grupo e o teaser deixou de ser etapa obrigatória (vem depois do convite)", () => {
    const raw = rawMaite();
    expect(raw.scenes.map((x: { id: string }) => x.id)).toEqual(["praia", "mergulho", "chegada", "concha", "teaser", "final"]);
    expect(sceneOf(raw, "teaser").enabled).toBe(false); // opcional e desativado na jornada principal
    const sc = sceneOf(raw, "concha");
    expect(sc.kind).toBe("stage");
    expect(sc.background).toBe("bg-convite");
    expect(sc.feature.asset).toBe("concha-perola");
    expect(sc.panel).toMatchObject({ prompt: "Revelar meu convite", frame: "moldura-convite" });
    expect(sc.headline).toBe("Toque na pérola"); // a concha já está aberta: nada de "abrir a concha"
    expect(sc.panel.children.map((c: { kind: string }) => c.kind)).toEqual(["details", "details", "countdown", "actions", "gifts"]);
    // "quando" (compacto) na moldura; "onde" (pode ficar longo) em cartão próprio: a moldura nunca precisa crescer
    expect(sc.panel.children[0].fields).toEqual(["date", "time"]);
    expect(sc.panel.children[1].fields).toEqual(["venue", "practical"]);
    expect(render("preview")).toMatch(/id="concha"[^>]*data-grouped=""[^>]*data-after-stage="true"[^>]*data-group-last/);
  });

  it("o botão é real, acessível e controla o painel; o conteúdo está no HTML (informação real, não imagem)", () => {
    const html = concha(render("preview"));
    expect(html).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-controls="concha-panel"[^>]*>Revelar meu convite<\/button>/);
    expect(html).toMatch(/id="concha-panel"[^>]*tabindex="-1"/);
    for (const txt of ["1 aninho", "domingo, 8 de novembro de 2026", "Horário", "Local", "Confirmar presença", "Ver no mapa", "Sugestões de presente"]) {
      expect(html, txt).toContain(txt);
    }
    // pendências claras na prévia; a moldura é só fundo (o texto não está na imagem)
    expect(html).toContain("a confirmar");
    expect(html).toMatch(/--frame:url\(\/events\/maite-1-ano\/scene-04\/moldura-convite\.webp\)/);
  });

  it("na versão pública nada pendente chega ao HTML do convite", () => {
    const html = concha(render("public"));
    expect(html).toContain("domingo, 8 de novembro de 2026");
    expect(html).not.toContain("a confirmar");
    expect(html).not.toContain("Texto a confirmar");
  });

  it("o painel só fica escondido com JS; sem JS tudo visível e o botão some; reduced motion sem animação", () => {
    const css = noComments(read("src/renderer/scenes/stage.module.css"));
    expect(css).toMatch(/:global\(\.js\) \.stage\[data-has-panel\]:not\(\[data-open\]\) \.panel\s*\{[^}]*display:\s*none/);
    expect(css).toMatch(/:global\(html:not\(\.js\)\) \.gate\s*\{[^}]*display:\s*none/);
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain(".stage[data-open] .panel");
    expect(reduced).toContain(".pearl");
  });

  it("abrir move o foco para o painel, rola até ele (sem animação com reduced motion) e avisa o canvas; replay fecha", () => {
    const tsx = noComments(read("src/renderer/scenes/StageScene.tsx"));
    const open = tsx.slice(tsx.indexOf("const openPanel"), tsx.indexOf("useStageParallax(stageRef"));
    expect(open).toContain("el?.focus({ preventScroll: true })");
    expect(open).toMatch(/scrollIntoView\(\{ behavior: reduced \? "auto" : "smooth"/);
    expect(open).toContain("REVEAL_EVENT");
    expect(tsx).toContain("EXPERIENCE_EVENTS.replay");
    expect(tsx).toMatch(/window\.addEventListener\(EXPERIENCE_EVENTS\.replay, close\)/);
  });

  it("cartões do painel não usam desfoque do fundo (o mundo atrás anima)", () => {
    const css = noComments(read("src/renderer/scenes/stage.module.css"));
    expect(css).toMatch(/\.panel > section\s*\{[^}]*backdrop-filter:\s*none/);
  });

  it("contrato: o painel exige texto do botão, moldura de imagem e conteúdo; ações e assets do painel contam como usados", () => {
    const raw = rawMaite();
    const sc = sceneOf(raw, "concha");
    sc.panel.prompt = "";
    sc.panel.frame = "teaser"; // vídeo
    sc.panel.children = [];
    const issues = issuesOf(raw);
    for (const key of ["panel.prompt", "panel.frame", "panel.children"]) expect(issues.some((i) => i.includes(key)), key).toBe(true);
    const ok = parsed(rawMaite());
    expect([...referencedActionIds(ok.scenes)]).toEqual(expect.arrayContaining(["confirmar", "mapa", "presentes"]));
    expect(referencedAssetIds(ok).has("moldura-convite")).toBe(true);
  });

  it("derivados da Cena 04 são só WebP públicos sem a criança, e o Clara & Davi segue com o reveal clássico", () => {
    const raw = rawMaite();
    for (const id of ["bg-convite", "concha-perola", "moldura-convite", "divisor-conchas"]) {
      expect(raw.assets[id]).toMatchObject({ status: "approved", src: `/events/maite-1-ano/scene-04/${id}.webp` });
    }
    const demo = renderToStaticMarkup(<EventExperience model={resolveExperience(events.getPublishedEvent("demo-clara-e-davi")!, "public")} />);
    expect(demo).toContain("data-motif");
    expect(demo).not.toContain("data-has-panel");
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
