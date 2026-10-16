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

/** Cena (mutável) da config bruta, por id: os testes não dependem da ordem das cenas. */
export function sceneOf(raw: Record<string, any>, id: string): Record<string, any> {
  const scene = raw.scenes.find((s: { id: string }) => s.id === id);
  if (!scene) throw new Error(`cena "${id}" não existe na config`);
  return scene;
}
