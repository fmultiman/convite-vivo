import demo from "../content/events/demo-clara-e-davi.json";
import maite from "../content/events/maite-1-ano.json";
import { eventConfigSchema, type EventConfig } from "@/contract/event.schema";

/** Cópia profunda e mutável de uma config bruta, para testes de mutação. */
export function rawMaite(): Record<string, any> {
  return structuredClone(maite) as Record<string, any>;
}

export function rawDemo(): Record<string, any> {
  return structuredClone(demo) as Record<string, any>;
}

export function parsed(raw: unknown): EventConfig {
  return eventConfigSchema.parse(raw);
}
