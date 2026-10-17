import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { daysUntilEvent, localDateInZone, resolvePhase, zonedDateTimeToInstant, type PhaseInput } from "@/contract/lifecycle";

const maite: PhaseInput = { date: "2026-11-08", timezone: "America/Sao_Paulo", phaseOverride: null, archiveAfterDays: null };

describe("ciclo de vida temporal", () => {
  it("usa a data no fuso do evento, não a do visitante", () => {
    // 02:30 UTC de 08/11 ainda é 07/11 em São Paulo (UTC-3).
    const instant = new Date("2026-11-08T02:30:00Z");
    expect(localDateInZone(instant, "America/Sao_Paulo")).toBe("2026-11-07");
    expect(resolvePhase(maite, instant)).toBe("invitation");
    expect(daysUntilEvent(maite, instant)).toBe(1);
  });

  it("é event_day durante todo o dia local", () => {
    expect(resolvePhase(maite, new Date("2026-11-08T03:00:00Z"))).toBe("event_day");
    expect(resolvePhase(maite, new Date("2026-11-09T02:59:00Z"))).toBe("event_day");
  });

  it("passa a post_event no dia seguinte", () => {
    expect(resolvePhase(maite, new Date("2026-11-09T03:00:00Z"))).toBe("post_event");
  });

  it("arquiva após o prazo configurado", () => {
    const input = { ...maite, archiveAfterDays: 30 };
    expect(resolvePhase(input, new Date("2026-12-08T12:00:00Z"))).toBe("post_event");
    expect(resolvePhase(input, new Date("2026-12-09T12:00:00Z"))).toBe("archive");
  });

  it("respeita a sobrescrita manual do operador", () => {
    expect(resolvePhase({ ...maite, phaseOverride: "post_event" }, new Date("2026-10-15T12:00:00Z"))).toBe("post_event");
  });

  it("converte horário local do evento em instante absoluto", () => {
    expect(zonedDateTimeToInstant("2026-11-08", "13:00", "America/Sao_Paulo").toISOString()).toBe("2026-11-08T16:00:00.000Z");
    // Fuso com horário de verão (Lisboa, UTC+1 no verão).
    expect(zonedDateTimeToInstant("2026-07-01", "19:30", "Europe/Lisbon").toISOString()).toBe("2026-07-01T18:30:00.000Z");
  });

  describe("contagem regressiva da Maitê (08/11/2026, America/Sao_Paulo)", () => {
    const at = (iso: string) => new Date(iso);
    const days = (iso: string) => daysUntilEvent(maite, at(iso));

    it("conta dias de calendário no fuso do evento", () => {
      expect(days("2026-10-17T15:00:00Z")).toBe(22); // 17/10 12:00 em São Paulo
      expect(days("2026-11-07T14:00:00Z")).toBe(1); // véspera: "É amanhã!"
    });

    it("não vira o dia pelo UTC: 23h do dia 7 em São Paulo ainda é véspera, 00h05 do dia 8 já é o dia", () => {
      expect(days("2026-11-08T01:59:00Z")).toBe(1); // 22:59 de 07/11 em São Paulo
      expect(days("2026-11-08T02:59:00Z")).toBe(1); // 23:59 de 07/11
      expect(days("2026-11-08T03:05:00Z")).toBe(0); // 00:05 de 08/11
      expect(resolvePhase(maite, at("2026-11-08T03:05:00Z"))).toBe("event_day");
    });

    it("depois do evento a fase é post_event e o número de dias nunca é exibido como positivo", () => {
      expect(resolvePhase(maite, at("2026-11-09T03:00:00Z"))).toBe("post_event");
      expect(resolvePhase(maite, at("2027-03-01T12:00:00Z"))).toBe("post_event");
      expect(days("2026-11-09T12:00:00Z")).toBeLessThan(0); // só existe internamente
    });

    it("o componente só mostra o número de dias na fase de convite (nunca negativo ou zero)", () => {
      const src = readFileSync(join(process.cwd(), "src/renderer/scenes/CountdownScene.tsx"), "utf8");
      const uses = src.match(/daysLeft/g) ?? [];
      expect(uses.length).toBe(2); // "=== 1" e o número exibido, ambos dentro de phase === "invitation"
      expect(src).toMatch(/state\?\.phase === "invitation"[\s\S]*?daysLeft === 1[\s\S]*?\{state\.daysLeft\}/);
      expect(src).toContain("Esta celebração já aconteceu.");
    });
  });
});
