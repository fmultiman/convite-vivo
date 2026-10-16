import { describe, expect, it } from "vitest";
import { formatClockTime, formatEventDate, resolveExperience } from "@/renderer/model";
import { parsed, rawDemo, rawMaite } from "./helpers";

describe("modelo de experiência", () => {
  it("formata data e horário em pt-BR", () => {
    expect(formatEventDate("2026-11-08")).toBe("domingo, 8 de novembro de 2026");
    expect(formatClockTime("13:00")).toBe("13h");
    expect(formatClockTime("19:30")).toBe("19h30");
  });

  it("modo público remove valores não confirmados, notas internas e rótulos de produção", () => {
    const model = resolveExperience(parsed(rawMaite()), "public");
    const serialized = JSON.stringify(model);
    expect(model.details.time).toBeNull();
    expect(model.details.venueAddress).toBeNull();
    expect(serialized).not.toContain("13h");
    expect(serialized).not.toContain("A-013");
    expect(serialized).not.toContain("KF-03");
    expect(serialized).not.toContain("Roupa tamanho");
  });

  it("modo público não oferece ações pendentes", () => {
    const model = resolveExperience(parsed(rawMaite()), "public");
    const reveal = model.scenes.find((s) => s.kind === "reveal");
    const actions = reveal?.kind === "reveal" ? reveal.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions).toEqual([]);
  });

  it("prévia mostra candidatos marcados como pendentes", () => {
    const model = resolveExperience(parsed(rawMaite()), "preview");
    expect(model.details.time).toEqual(expect.objectContaining({ state: "pending", candidate: null }));
    expect(model.issues.some((i) => i.severity === "blocker")).toBe(true);
    const reveal = model.scenes.find((s) => s.kind === "reveal");
    const actions = reveal?.kind === "reveal" ? reveal.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions.map((a) => [a.id, a.pending])).toEqual([
      ["confirmar", true],
      ["mapa", true],
      ["presentes", true],
    ]);
  });

  it("assets pendentes viram placeholders; aprovados viram imagem", () => {
    const maite = resolveExperience(parsed(rawMaite()), "public");
    const chegada = maite.scenes.find((s) => s.id === "chegada");
    expect(chegada?.kind === "image" && chegada.asset.ready).toBe(false);

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
    const reveal = model.scenes.find((s) => s.kind === "reveal");
    const actions = reveal?.kind === "reveal" ? reveal.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions[0]).toEqual(
      expect.objectContaining({ id: "presentes", href: "#presentes", external: false }),
    );
  });

  it("ação de presentes some se a seção de presentes não tiver itens confirmados", () => {
    const raw = rawMaite();
    raw.actions[2].confirmed = true;
    const model = resolveExperience(parsed(raw), "public");
    const reveal = model.scenes.find((s) => s.kind === "reveal");
    const actions = reveal?.kind === "reveal" ? reveal.children.find((c) => c.kind === "actions") : undefined;
    expect(actions?.kind === "actions" && actions.actions).toEqual([]);
  });
});
