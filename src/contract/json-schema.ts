import { z } from "zod";
import { eventConfigSchema } from "./event.schema.ts";

/**
 * JSON Schema derivado do contrato zod, para editores e para a futura
 * Experience Platform. Regras cruzadas (referências, publicação) existem só
 * no contrato TypeScript.
 */
export function buildEventJsonSchema() {
  return {
    title: "Convite Vivo — configuração de evento",
    ...z.toJSONSchema(eventConfigSchema, { io: "input", unrepresentable: "any" }),
  };
}
