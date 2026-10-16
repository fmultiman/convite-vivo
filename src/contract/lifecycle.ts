/**
 * Datas no fuso do evento e estado temporal (invitation → event_day →
 * post_event → archive). Comparações são feitas pela data local no fuso do
 * evento, nunca pelo "dia do mês" do visitante.
 */
import type { EventConfig, Phase } from "./event.schema.ts";

/** Data local (YYYY-MM-DD) de um instante no fuso informado. */
export function localDateInZone(instant: Date, timeZone: string): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function toUtcDay(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** Dias de calendário de `from` até `to` (positivo se `to` é futuro). */
export function calendarDaysBetween(from: string, to: string): number {
  return toUtcDay(to) - toUtcDay(from);
}

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Converte data + horário locais do evento em instante absoluto. */
export function zonedDateTimeToInstant(isoDate: string, time: string, timeZone: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - zoneOffsetMs(new Date(guess), timeZone);
  // Segunda passada corrige casos próximos a mudanças de horário de verão.
  return new Date(guess - zoneOffsetMs(new Date(first), timeZone));
}

/** Instante de início, somente quando o horário está confirmado. */
export function confirmedStartInstant(event: EventConfig): Date | null {
  const start = event.schedule.startTime;
  if (!start.confirmed || !start.value) return null;
  return zonedDateTimeToInstant(event.schedule.date, start.value, event.schedule.timezone);
}

export interface PhaseInput {
  date: string;
  timezone: string;
  phaseOverride: Phase | null;
  archiveAfterDays: number | null;
}

export function phaseInputFromEvent(event: Pick<EventConfig, "schedule" | "lifecycle">): PhaseInput {
  return {
    date: event.schedule.date,
    timezone: event.schedule.timezone,
    phaseOverride: event.lifecycle.phaseOverride,
    archiveAfterDays: event.lifecycle.archiveAfterDays,
  };
}

/** Dias de calendário restantes até a data do evento, no fuso do evento. */
export function daysUntilEvent(input: Pick<PhaseInput, "date" | "timezone">, now: Date): number {
  return calendarDaysBetween(localDateInZone(now, input.timezone), input.date);
}

export function resolvePhase(input: PhaseInput, now: Date): Phase {
  if (input.phaseOverride) return input.phaseOverride;
  const diff = daysUntilEvent(input, now);
  if (diff > 0) return "invitation";
  if (diff === 0) return "event_day";
  if (input.archiveAfterDays !== null && -diff > input.archiveAfterDays) return "archive";
  return "post_event";
}
