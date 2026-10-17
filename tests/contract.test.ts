import { describe, expect, it } from "vitest";
import { eventConfigSchema } from "@/contract/event.schema";
import { buildWhatsAppUrl, isSafeExternalUrl } from "@/contract/safe-url";
import { rawDemo, rawMaite, sceneOf } from "./helpers";

function issuesOf(raw: unknown): string[] {
  const result = eventConfigSchema.safeParse(raw);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("contrato de evento", () => {
  it("aceita as duas configurações do repositório", () => {
    expect(issuesOf(rawMaite())).toEqual([]);
    expect(issuesOf(rawDemo())).toEqual([]);
  });

  it("rejeita slug inválido", () => {
    const raw = rawMaite();
    raw.slug = "Maitê 1 Ano";
    expect(issuesOf(raw).some((i) => i.startsWith("slug"))).toBe(true);
  });

  it("rejeita versão de schema desconhecida", () => {
    const raw = rawMaite();
    raw.schemaVersion = 2;
    expect(issuesOf(raw).some((i) => i.startsWith("schemaVersion"))).toBe(true);
  });

  it("rejeita cor fora do formato e fonte fora do catálogo", () => {
    const raw = rawMaite();
    raw.theme.colors.accent = "lilac";
    raw.theme.fonts.display = "comic-sans";
    const issues = issuesOf(raw);
    expect(issues.some((i) => i.startsWith("theme.colors.accent"))).toBe(true);
    expect(issues.some((i) => i.startsWith("theme.fonts.display"))).toBe(true);
  });

  it("rejeita timezone inválida", () => {
    const raw = rawMaite();
    raw.schedule.timezone = "Brasil/Belo_Horizonte";
    expect(issuesOf(raw).some((i) => i.startsWith("schedule.timezone"))).toBe(true);
  });

  it("rejeita valor confirmado nulo", () => {
    const raw = rawMaite();
    raw.venue.address = { value: null, confirmed: true };
    expect(issuesOf(raw).some((i) => i.startsWith("venue.address"))).toBe(true);
  });

  it("rejeita links externos inseguros", () => {
    for (const url of ["javascript:alert(1)", "http://example.com/x", "data:text/html,oi", "https://user:pw@example.com"]) {
      const raw = rawDemo();
      raw.actions[1].url = url;
      expect(issuesOf(raw).some((i) => i.startsWith("actions.1.url")), url).toBe(true);
    }
  });

  it("exige que referências de cena apontem para assets e ações existentes", () => {
    const raw = rawMaite();
    sceneOf(raw, "chegada").feature.asset = "nao-existe";
    sceneOf(raw, "concha").children[2].actions.push("acao-fantasma");
    const issues = issuesOf(raw);
    expect(issues.some((i) => i.includes('asset "nao-existe" não existe'))).toBe(true);
    expect(issues.some((i) => i.includes('ação "acao-fantasma" não existe'))).toBe(true);
  });

  it("exige o tipo correto de asset para cada cena", () => {
    const raw = rawMaite();
    sceneOf(raw, "chegada").feature.asset = "teaser"; // destaque apontando para vídeo
    expect(issuesOf(raw).some((i) => i.includes("deveria ser image"))).toBe(true);
  });

  it("rejeita ids de cena duplicados, inclusive dentro de revelações", () => {
    const raw = rawMaite();
    sceneOf(raw, "concha").children[0].id = "chegada";
    expect(issuesOf(raw).some((i) => i.includes('id de cena duplicado "chegada"'))).toBe(true);
  });

  it("exige que a entrada seja a primeira e única", () => {
    const raw = rawMaite();
    raw.scenes.push(structuredClone(raw.scenes[0]));
    raw.scenes.at(-1).id = "outra-entrada";
    expect(issuesOf(raw).some((i) => i.includes("apenas uma cena de entrada"))).toBe(true);
  });

  it("exige src e dimensões para asset aprovado", () => {
    const raw = rawMaite();
    raw.assets["kf04-concha"].status = "approved"; // aprovado sem src
    expect(issuesOf(raw).some((i) => i.includes("precisa de src"))).toBe(true);
  });

  it("impede asset apontando para a pasta de outro evento", () => {
    const raw = rawDemo();
    raw.assets.constelacao.src = "/events/maite-1-ano/constelacao.svg";
    expect(issuesOf(raw).some((i) => i.includes("pasta de outro evento"))).toBe(true);
  });

  it("impede evento demo indexável", () => {
    const raw = rawDemo();
    raw.seo.indexable = true;
    expect(issuesOf(raw).some((i) => i.startsWith("seo.indexable"))).toBe(true);
  });
});

describe("links externos", () => {
  it("aceita somente https sem credenciais", () => {
    expect(isSafeExternalUrl("https://maps.google.com/?q=x")).toBe(true);
    expect(isSafeExternalUrl("http://maps.google.com")).toBe(false);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeExternalUrl("https://localhost")).toBe(false);
    expect(isSafeExternalUrl("não é url")).toBe(false);
  });

  it("monta link de WhatsApp com mensagem codificada", () => {
    const url = buildWhatsAppUrl("55 (31) 99999-0000", "Olá! Vou 💜");
    expect(url.startsWith("https://wa.me/5531999990000?text=")).toBe(true);
    expect(new URL(url).searchParams.get("text")).toBe("Olá! Vou 💜");
  });
});
