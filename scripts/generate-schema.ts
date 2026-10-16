/**
 * Gera content/event.schema.json a partir do contrato zod (fonte da verdade).
 * Uso: npm run schema — o teste schema.test.ts acusa se o arquivo ficar desatualizado.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildEventJsonSchema } from "../src/contract/json-schema.ts";

const target = new URL("../content/event.schema.json", import.meta.url);
writeFileSync(target, `${JSON.stringify(buildEventJsonSchema(), null, 2)}\n`);
console.log(`Schema gerado em ${fileURLToPath(target)}`);
