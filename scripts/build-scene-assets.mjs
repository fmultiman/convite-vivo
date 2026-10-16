/**
 * Gera os derivados web de UMA cena a partir da biblioteca bruta (assets/).
 *
 *   npm run assets:scene-01
 *
 * - Lê apenas os arquivos listados abaixo (nunca varre a biblioteca).
 * - Não altera os originais.
 * - Recortes: zera alfa <= 8 (névoa invisível), apara margens transparentes,
 *   WebP com alfa. Fundos: WebP sem alfa. Sem ampliar a resolução.
 * - Só entram imagens SEM a criança. Nada de assets/private, keyframes ou
 *   referências aqui.
 */
import { mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIBRARY = join(root, "assets", "elements");

const SCENES = {
  "maite-1-ano/scene-01": [
    // id, arquivo de origem (relativo a assets/elements), tipo
    ["bg-praia", "backgrounds/praia-encantada-abertura.png", "background"],
    ["env-fechado", "envelopes/envelope-fechado-frontal-com-perolas-01.png", "sprite"],
    ["env-aberto", "envelopes/envelope-aberto-com-brilho-e-bolhas-01.png", "sprite"],
    ["placa-tag", "molduras-e-placas/placa-horizontal-arredondada-com-conchas-01.png", "sprite"],
    ["bolhas-trilha", "bolhas/trilha-diagonal-de-bolhas-01.png", "sprite"],
    ["bolhas-grupo", "bolhas/grupo-de-bolhas-02.png", "sprite"],
    ["bolha-g", "bolhas/uma-bolha-04.png", "sprite"],
    ["bolha-m", "bolhas/uma-bolha-09.png", "sprite"],
    ["bolha-p", "bolhas/uma-bolha-01.png", "sprite"],
    ["conchas-leque", "conchas/conchas-leque-com-perolas-01.png", "sprite"],
    ["cordao-perolas", "perolas/cordao-de-perolas-curvado-01.png", "sprite"],
    ["perola-a", "perolas/uma-perola-01.png", "sprite"],
    ["perola-b", "perolas/uma-perola-07.png", "sprite"],
  ],
};

const target = process.argv[2] ?? "maite-1-ano/scene-01";
const list = SCENES[target];
if (!list) {
  console.error(`Cena desconhecida: ${target}. Opções: ${Object.keys(SCENES).join(", ")}`);
  process.exit(1);
}

const outDir = join(root, "public", "events", ...target.split("/"));
mkdirSync(outDir, { recursive: true });

const kb = (path) => (statSync(path).size / 1024).toFixed(0);
let totalIn = 0;
let totalOut = 0;
console.log(`${"id".padEnd(16)} ${"origem".padStart(8)} ${"webp".padStart(7)}  dimensões`);

for (const [id, rel, kind] of list) {
  const src = join(LIBRARY, rel);
  const out = join(outDir, `${id}.webp`);
  let pipeline;
  if (kind === "background") {
    pipeline = sharp(src).removeAlpha().webp({ quality: 82, effort: 6 });
  } else {
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] <= 8) {
        data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
      }
    }
    pipeline = sharp(data, { raw: info })
      .trim({ threshold: 1 })
      .webp({ quality: 84, alphaQuality: 92, effort: 6 });
  }
  const meta = await pipeline.toFile(out);
  totalIn += statSync(src).size / 1024;
  totalOut += statSync(out).size / 1024;
  console.log(`${id.padEnd(16)} ${kb(src).padStart(6)}KB ${kb(out).padStart(5)}KB  ${meta.width}×${meta.height}`);
}
console.log(`${"TOTAL".padEnd(16)} ${totalIn.toFixed(0).padStart(6)}KB ${totalOut.toFixed(0).padStart(5)}KB`);
