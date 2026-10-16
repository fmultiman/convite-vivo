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
});
