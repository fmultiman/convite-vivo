/**
 * Registro das configurações locais. Para adicionar um evento:
 * 1. criar `content/events/<slug>.json` (validado por `content/event.schema.json`);
 * 2. importar e registrar abaixo (o teste `registry.test.ts` acusa arquivos esquecidos).
 *
 * Imports estáticos mantêm as configs no bundle do servidor, sem I/O em tempo
 * de requisição.
 */
import demoClaraEDavi from "../../content/events/demo-clara-e-davi.json";
import maite1Ano from "../../content/events/maite-1-ano.json";
import { createEventRepository } from "./repository";

export const eventSources: Record<string, unknown> = {
  "maite-1-ano": maite1Ano,
  "demo-clara-e-davi": demoClaraEDavi,
};

export const events = createEventRepository(eventSources);
