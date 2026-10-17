import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canPublish, getPublicationIssues } from "@/contract/rules";
import { events, eventSources } from "@/events";
import { createEventRepository, EventConfigError } from "@/events/repository";
import { resolveExperience } from "@/renderer/model";
import { parsed, rawDemo, rawMaite, rawMaiteComCandidatos } from "./helpers";

describe("resolução de slugs", () => {
  it("resolve o evento publicado pelo slug", () => {
    const event = events.getPublishedEvent("demo-clara-e-davi");
    expect(event?.id).toBe("evt_d3m0c1d2");
    expect(event?.status).toBe("published");
  });

  it("a Maitê está publicada como PILOTO (reconhecimento explícito de pendências)", () => {
    const event = events.getPublishedEvent("maite-1-ano");
    expect(event?.pilot?.acknowledgePending).toBe(true);
    expect(events.listPublishedSlugs()).toContain("maite-1-ano");
  });

  it("resolve a Maitê na prévia", () => {
    const event = events.getEventForPreview("maite-1-ano");
    expect(event?.status).toBe("published");
    expect(event?.schedule.date).toBe("2026-11-08");
  });

  it("retorna null para slug inexistente", () => {
    expect(events.getPublishedEvent("nao-existe")).toBeNull();
    expect(events.getEventForPreview("nao-existe")).toBeNull();
    expect(events.getPublishedEvent("")).toBeNull();
  });

  it("registra todos os arquivos de content/events", () => {
    const files = readdirSync(new URL("../content/events", import.meta.url))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
    expect(Object.keys(eventSources).sort()).toEqual(files.sort());
  });
});

describe("regras de publicação", () => {
  it("bloqueia a publicação da Maitê enquanto horário, local e RSVP não forem confirmados", () => {
    const maite = parsed(rawMaite());
    const blockers = getPublicationIssues(maite)
      .filter((i) => i.severity === "blocker")
      .map((i) => i.path);
    expect(blockers).toEqual(
      expect.arrayContaining(["schedule.startTime", "venue.name", "venue.address", "actions.confirmar", "actions.mapa"]),
    );
    expect(canPublish(maite)).toBe(false);
  });

  it("libera o evento demo", () => {
    expect(canPublish(parsed(rawDemo()))).toBe(true);
  });

  it("falha a carga quando um evento publicado (sem piloto) tem pendências bloqueantes", () => {
    const raw = rawMaite();
    delete raw.pilot;
    raw.status = "published";
    expect(() => createEventRepository({ "maite-1-ano": raw })).toThrow(EventConfigError);
    expect(() => createEventRepository({ "maite-1-ano": raw })).toThrow(/Horário ainda não confirmado/);
  });

  it("piloto: publica com pendências só com reconhecimento explícito, e o público segue sem dados pendentes", () => {
    const raw = rawMaiteComCandidatos();
    delete raw.pilot;
    raw.status = "published";
    expect(() => createEventRepository({ "maite-1-ano": raw })).toThrow(/pendências bloqueantes/);
    raw.pilot = { acknowledgePending: true, note: "Piloto para testes visuais." };
    const repo = createEventRepository({ "maite-1-ano": raw });
    const event = repo.getPublishedEvent("maite-1-ano")!;
    expect(event.status).toBe("published");
    const model = resolveExperience(event, "public");
    expect(JSON.stringify(model)).not.toContain("Rua Exemplo");
    expect(model.details.time).toBeNull();
  });

  it("falha a carga quando nome do arquivo e slug divergem", () => {
    expect(() => createEventRepository({ "outro-nome": rawDemo() })).toThrow(/igual ao slug/);
  });

  it("falha a carga com ids duplicados", () => {
    const copy = rawDemo();
    copy.slug = "demo-copia";
    copy.assets.constelacao.src = "/events/demo-copia/constelacao.svg";
    expect(() => createEventRepository({ "demo-clara-e-davi": rawDemo(), "demo-copia": copy })).toThrow(/id duplicado/);
  });

  it("publicar a Maitê exige apenas confirmar os dados — sem mudar código", () => {
    const raw = rawMaite();
    raw.status = "published";
    raw.schedule.startTime = { value: "13:00", confirmed: true };
    raw.venue.name = { value: "Local de teste", confirmed: true };
    raw.venue.address = { value: "Endereço de teste", confirmed: true };
    raw.actions[0].confirmed = true;
    raw.actions[0].target.phone = "5500000000000";
    raw.actions[1].confirmed = true;
    raw.actions[1].url = "https://example.com/mapa";
    raw.actions[2].confirmed = true;
    raw.gifts.items.forEach((item: { confirmed: boolean }) => (item.confirmed = true));
    const repo = createEventRepository({ "maite-1-ano": raw });
    expect(repo.getPublishedEvent("maite-1-ano")?.status).toBe("published");
  });
});
