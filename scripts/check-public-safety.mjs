/**
 * Trava de segurança para repositório PÚBLICO.
 *
 *   npm run safety
 *
 * Examina tudo que o git versionaria hoje (rastreado + não ignorado) e falha se
 * encontrar mídia que não deveria ser pública, pastas privadas, arquivos grandes
 * ou dados que costumam vazar (caminhos locais, telefones em conteúdo).
 * Não substitui revisão humana antes do primeiro push.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const BLOCKED_EXT = new Set([".pdf", ".mp4", ".mov", ".webm", ".wav", ".mp3", ".psd", ".kra", ".xcf", ".png", ".jpg", ".jpeg", ".gif", ".heic", ".zip"]);
const BLOCKED_PATH = /(^|\/)(assets|private|_private|raw|originals)\//i;
const BLOCKED_NAME = /(^|\/)foto_[^/]*$/i;
/** Derivados públicos: só WebP/SVG dentro de public/events/<slug>/. */
const PUBLIC_MEDIA = /^public\/events\/[a-z0-9-]+\/.+\.(webp|svg)$/;
const MAX_BYTES = 1_500_000;
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".css", ".txt", ".example"]);

const problems = [];
for (const file of files) {
  const ext = extname(file).toLowerCase();
  if (BLOCKED_PATH.test(file)) problems.push(`${file}: pasta privada/bruta`);
  if (BLOCKED_NAME.test(file)) problems.push(`${file}: nome de foto`);
  if (BLOCKED_EXT.has(ext)) problems.push(`${file}: tipo de arquivo não permitido (${ext})`);
  if ((ext === ".webp" || ext === ".svg") && !PUBLIC_MEDIA.test(file)) problems.push(`${file}: mídia fora de public/events/<slug>/`);
  const size = statSync(join(root, file)).size;
  if (size > MAX_BYTES) problems.push(`${file}: ${(size / 1e6).toFixed(1)} MB (limite ${MAX_BYTES / 1e6} MB)`);

  if (!TEXT_EXT.has(ext) && !file.endsWith(".example")) continue;
  const text = readFileSync(join(root, file), "utf8");
  if (/[A-Za-z]:\\(Users|Trabalhos)|\/Users\/[^/\s]+\/|\/d\/Trabalhos/.test(text)) problems.push(`${file}: caminho local absoluto`);
  // Telefones reais tendem a aparecer em conteúdo/documentação, não em testes de formato.
  if (/^(content|docs)\//.test(file) && /(?<!\d)55\d{10,11}(?!\d)/.test(text)) problems.push(`${file}: possível telefone`);
}

if (problems.length > 0) {
  console.error(`✗ Segurança: ${problems.length} problema(s) em ${files.length} arquivos a versionar:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`✓ Segurança: ${files.length} arquivos a versionar, sem mídia privada, pastas brutas, arquivos grandes ou caminhos locais.`);
