import { describe, expect, it } from "vitest";
import { formatClockTime, formatEventDate, resolveExperience } from "@/renderer/model";
import { CANDIDATOS_FICTICIOS, parsed, rawDemo, rawMaite, rawMaiteComCandidatos } from "./helpers";

describe("modelo de experiência", () => {
  it("formata data e horário em pt-BR", () => {
    expect(formatEventDate("2026-11-08")).toBe("domingo, 8 de novembro de 2026");
    expect(formatClockTime("13:00")).toBe("13h");
    expect(formatClockTime("19:30")).toBe("19h30");
  });

  it("modo público remove valores não confirmados, notas internas e rótulos de produção", () => {
    const model = resolveExperience(parsed(rawMaiteComCandidatos()), "public");
    const serialized = JSON.stringify(model);
    expect(model.details.time).toBeNull();
    expect(model.details.venueAddress).toBeNull();
    expect(serialized).not.toContain("13h");
    expect(serialized).not.toContain("A-013");
    expect(serialized).not.toContain("KF-03");
    expect(serialized).not.toContain("Rua Exemplo");
    expect(serialized).not.toContain("Presente exemplo");
  });

  it("modo público não oferece ações pendentes", () => {
    const model = resolveExperience(parsed(rawMaite()), "public");
    const concha = model.scenes.find((s) => s.id === "concha");
    const actions = concha?.kind === "stage" ? concha.panel?.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions).toEqual([]);
  });

  it("prévia mostra candidatos marcados como pendentes", () => {
    const model = resolveExperience(parsed(rawMaiteComCandidatos()), "preview");
    // Horário e endereço candidatos (ainda sem confirmação): aparecem na prévia como pendentes.
    expect(model.details.time).toEqual(expect.objectContaining({ state: "pending", candidate: "13h" }));
    expect(model.details.venueAddress).toEqual(expect.objectContaining({ state: "pending", candidate: CANDIDATOS_FICTICIOS.endereco }));
    expect(model.details.venueName).toEqual(expect.objectContaining({ state: "pending", candidate: null })); // o nome do local não foi informado
    expect(model.issues.some((i) => i.severity === "blocker")).toBe(true);
    const concha = model.scenes.find((s) => s.id === "concha");
    const actions = concha?.kind === "stage" ? concha.panel?.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions.map((a) => [a.id, a.pending])).toEqual([
      ["confirmar", true],
      ["mapa", true],
      ["presentes", true],
    ]);
  });

  it("assets pendentes viram placeholders; aprovados viram imagem", () => {
    const maite = resolveExperience(parsed(rawMaite()), "public");
    const teaser = maite.scenes.find((s) => s.id === "teaser");
    expect(teaser?.kind === "video" && teaser.asset.ready).toBe(false);
    // A arte da Maitê está aprovada para o piloto: aparece como imagem, no público e na prévia.
    const chegada = maite.scenes.find((s) => s.id === "chegada");
    expect(chegada?.kind === "stage" && chegada.art?.feature?.image?.src).toBe("/events/maite-1-ano/scene-03/maite-cavalo-marinho.webp");
    // Se voltasse a pendente: omitido no público, placeholder só na prévia.
    const pending = rawMaite();
    pending.assets["kf03-maite-cavalo-marinho"].status = "pending";
    pending.assets["kf03-maite-cavalo-marinho"].src = undefined;
    const pub = resolveExperience(parsed(pending), "public").scenes.find((s) => s.id === "chegada");
    expect(pub?.kind === "stage" && pub.art?.feature).toBeNull();
    const prev = resolveExperience(parsed(pending), "preview").scenes.find((s) => s.id === "chegada");
    expect(prev?.kind === "stage" && prev.art?.feature).toEqual(expect.objectContaining({ image: null }));

    const demo = resolveExperience(parsed(rawDemo()), "public");
    const historia = demo.scenes.find((s) => s.id === "historia");
    expect(historia?.kind === "image" && historia.asset).toEqual(
      expect.objectContaining({ ready: true, src: "/events/demo-clara-e-davi/constelacao.svg" }),
    );
  });

  it("vídeo pendente cai no poster aprovado", () => {
    const demo = resolveExperience(parsed(rawDemo()), "public");
    const filme = demo.scenes.find((s) => s.id === "filme");
    expect(filme?.kind === "video" && !filme.asset.ready && filme.asset.poster?.id).toBe("constelacao");
  });

  it("áudio pendente não gera player", () => {
    expect(resolveExperience(parsed(rawMaite()), "preview").audio).toBeNull();
  });

  it("ações prontas geram links seguros", () => {
    const demo = resolveExperience(parsed(rawDemo()), "public");
    const acoes = demo.scenes.find((s) => s.kind === "actions");
    const hrefs = acoes?.kind === "actions" ? acoes.actions.map((a) => a.href) : [];
    expect(hrefs).toEqual([
      "https://example.com/demo/rsvp",
      "https://example.com/demo/mapa",
      "https://example.com/demo/lista",
      "https://example.com/demo/hospedagem",
    ]);
  });

  it("ação de presentes sem URL aponta para a seção da própria página", () => {
    const raw = rawMaite();
    raw.actions[2].confirmed = true;
    raw.gifts.items[0].confirmed = true;
    const model = resolveExperience(parsed(raw), "public");
    const concha = model.scenes.find((s) => s.id === "concha");
    const actions = concha?.kind === "stage" ? concha.panel?.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions[0]).toEqual(
      expect.objectContaining({ id: "presentes", href: "#presentes", external: false }),
    );
  });

  it("ação de presentes some se a seção de presentes não tiver itens confirmados", () => {
    const raw = rawMaite();
    raw.actions[2].confirmed = true;
    const model = resolveExperience(parsed(raw), "public");
    const concha = model.scenes.find((s) => s.id === "concha");
    const actions = concha?.kind === "stage" ? concha.panel?.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions).toEqual([]);
  });
});
