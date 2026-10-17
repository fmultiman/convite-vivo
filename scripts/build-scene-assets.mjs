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
  "maite-1-ano/scene-02": [
    // Fundo submarino e sprites de profundidade (sem a criança). Bolhas: reutilizam as da cena 01.
    ["bg-mar", "backgrounds/fundo-do-mar-cenário-principal.png", "background"],
    ["alga-ondulada", "plantas/alga-marinha-ondulada-01.png", "sprite"],
    ["alga-verde", "plantas/alga-marinha-verde-01.png", "sprite"],
    ["coral-azul", "corais/coral-azul-ramificado-com-perolas-01.png", "sprite"],
    ["coral-leque", "corais/coral-roxo-em-leque-com-perolas-01.png", "sprite"],
    ["estrela-rosa", "estrelas-do-mar/estrela-do-mar-rosa-com-perolas-01.png", "sprite"],
    ["cordao-espiral", "perolas/cordao-de-perolas-espiral-01.png", "sprite"],
    ["conchas-corais", "decorativos/arranjo-de-conchas-corais-e-perolas-01.png", "sprite"],
    // v2: plantas que balançam (mais variedade de silhueta e cor).
    ["alga-rosa", "plantas/alga-marinha-rosa-01.png", "sprite"],
    ["alga-turquesa", "plantas/alga-marinha-turquesa-01.png", "sprite"],
    ["folha-rosa", "plantas/folhagem-marinha-delicada-01.png", "sprite"],
    ["folha-roxa", "plantas/folhagem-marinha-ramificada-01.png", "sprite"],
  ],
  "maite-1-ano/scene-04": [
    // Cenário do convite, a grande concha (protagonista), a moldura do cartão e o divisor. Sem a criança.
    ["bg-convite", "backgrounds/cenário-do-convite-revelação final.png", "background"],
    ["concha-perola", "conchas-e-perolas/concha-aberta-com-perola-gigante-01.png", "sprite"],
    ["moldura-convite", "molduras-e-placas/moldura-principal-com-conchas-e-corais-01.png", "sprite"],
    ["divisor-conchas", "molduras-e-placas/divisor-horizontal-com-concha-e-arabescos-01.png", "sprite"],
  ],
  // PRIVADO: contém a criança. Sai em assets/_prepared/ (ignorado pelo Git), nunca em public/.
  // Só vai para public/ depois da autorização da família (ver docs/SCENE_02_V2.md).
  "maite-1-ano/scene-03-private": [["maite-cavalo-marinho", "maite/maite-cavalo-marinho.png", "sprite"]],
};
const PRIVATE_TARGETS = new Set(["maite-1-ano/scene-03-private"]);

const target = process.argv[2] ?? "maite-1-ano/scene-01";
const list = SCENES[target];
if (!list) {
  console.error(`Cena desconhecida: ${target}. Opções: ${Object.keys(SCENES).join(", ")}`);
  process.exit(1);
}

const outDir = PRIVATE_TARGETS.has(target)
  ? join(root, "assets", "_prepared", ...target.split("/"))
  : join(root, "public", "events", ...target.split("/"));
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
    const source = sharp(data, { raw: info }).trim({ threshold: 1 });
    pipeline = source.webp({ quality: 84, alphaQuality: 92, effort: 6 });
  }
  const meta = await pipeline.toFile(out);
  totalIn += statSync(src).size / 1024;
  totalOut += statSync(out).size / 1024;
  console.log(`${id.padEnd(16)} ${kb(src).padStart(6)}KB ${kb(out).padStart(5)}KB  ${meta.width}×${meta.height}`);
}
console.log(`${"TOTAL".padEnd(16)} ${totalIn.toFixed(0).padStart(6)}KB ${totalOut.toFixed(0).padStart(5)}KB`);
