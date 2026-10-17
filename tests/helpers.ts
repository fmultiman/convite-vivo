import demo from "../content/events/demo-clara-e-davi.json";
import maite from "../content/events/maite-1-ano.json";
import { eventConfigSchema, type EventConfig } from "@/contract/event.schema";

/** Cópia profunda e mutável de uma config bruta, para testes de mutação. */
export function rawMaite(): Record<string, any> {
  return structuredClone(maite) as Record<string, any>;
}

/**
 * A Maitê com candidatos FICTÍCIOS ainda não confirmados (horário, endereço, presentes).
 * O JSON versionado não carrega os dados reais da família (repositório público); os testes
 * exercitam a política "prévia mostra a confirmar / público omite" com estes valores de exemplo.
 */
export const CANDIDATOS_FICTICIOS = {
  horario: "13:00",
  endereco: "Rua Exemplo, 100 — Bairro Teste",
  presentes: ["Presente exemplo A", "Presente exemplo B", "Presente exemplo C"],
} as const;

export function rawMaiteComCandidatos(): Record<string, any> {
  const raw = rawMaite();
  raw.schedule.startTime.value = CANDIDATOS_FICTICIOS.horario;
  raw.venue.address.value = CANDIDATOS_FICTICIOS.endereco;
  raw.gifts.items = CANDIDATOS_FICTICIOS.presentes.map((text) => ({ text, confirmed: false }));
  return raw;
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
