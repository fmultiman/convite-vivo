import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildEventJsonSchema } from "@/contract/json-schema";

describe("JSON Schema publicado", () => {
  it("content/event.schema.json está sincronizado com o contrato (rode npm run schema)", () => {
    const committed = JSON.parse(readFileSync(new URL("../content/event.schema.json", import.meta.url), "utf8"));
    expect(committed).toEqual(JSON.parse(JSON.stringify(buildEventJsonSchema())));
  });
});
