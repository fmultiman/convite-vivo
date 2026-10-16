/**
 * Smoke test HTTP contra um servidor em execução.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/smoke.mjs http://localhost:3100            # produção (prévia desligada)
 *   node scripts/smoke.mjs http://localhost:3000 --preview  # next dev (prévia ligada)
 *
 * Verifica status, metatags na PRIMEIRA resposta HTML (o que o WhatsApp lê),
 * headers de segurança e que dados pendentes não vazam.
 */
const [base = "http://localhost:3100", flag] = process.argv.slice(2);
const previewOn = flag === "--preview";
const failures = [];
let passed = 0;

function check(name, condition, detail = "") {
  if (condition) passed++;
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`${condition ? "✓" : "✗"} ${name}`);
}

async function get(path, headers = {}) {
  const res = await fetch(new URL(path, base), { redirect: "manual", headers });
  const type = res.headers.get("content-type") ?? "";
  const body = type.startsWith("text") ? await res.text() : Buffer.from(await res.arrayBuffer());
  return { res, body };
}

const meta = (html, attr, key) => {
  const re = new RegExp(`<meta[^>]*${attr}="${key}"[^>]*content="([^"]*)"`, "i");
  const re2 = new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${key}"`, "i");
  return (html.match(re) ?? html.match(re2))?.[1];
};

// Evento publicado — acessado como o crawler do WhatsApp.
{
  const { res, body } = await get("/e/demo-clara-e-davi", { "user-agent": "WhatsApp/2.23.20.0" });
  const head = body.slice(0, body.indexOf("</head>"));
  check("publicado: 200", res.status === 200, `status ${res.status}`);
  check("publicado: html lang pt-BR", body.includes('<html lang="pt-BR"'));
  check("publicado: og:title no <head>", meta(head, "property", "og:title") === "Clara &amp; Davi — 20.03.2027");
  check("publicado: og:description no <head>", Boolean(meta(head, "property", "og:description")));
  check("publicado: og:image absoluta", /^https?:\/\/[^/]+\/og\/demo-clara-e-davi$/.test(meta(head, "property", "og:image") ?? ""), meta(head, "property", "og:image"));
  check("publicado: og:url absoluta", /\/e\/demo-clara-e-davi$/.test(meta(head, "property", "og:url") ?? ""));
  check("publicado: twitter card", meta(head, "name", "twitter:card") === "summary_large_image");
  check("publicado: canonical", /<link rel="canonical" href="https?:\/\/[^"]+\/e\/demo-clara-e-davi"/.test(head));
  check("publicado: robots noindex", meta(head, "name", "robots") === "noindex, nofollow", meta(head, "name", "robots"));
  check("publicado: theme-color do evento", meta(head, "name", "theme-color") === "#0D1828");
  check("publicado: texto crítico em HTML", body.includes("sábado, 20 de março de 2027") && body.includes("19h30"));
  check("publicado: link externo seguro", body.includes('target="_blank" rel="noopener noreferrer"'));
  check("publicado: info não confirmada ausente", !body.includes("Espaço kids"));
  check("header: nosniff", res.headers.get("x-content-type-options") === "nosniff");
  check("header: sem x-powered-by", !res.headers.has("x-powered-by"));
}

// Imagem OG gerada.
{
  const { res, body } = await get("/og/demo-clara-e-davi");
  check("og image: 200 image/png", res.status === 200 && res.headers.get("content-type") === "image/png", `${res.status} ${res.headers.get("content-type")}`);
  check("og image: PNG válido", Buffer.isBuffer(body) && body.subarray(1, 4).toString() === "PNG");
}

// Draft da Maitê nunca é público.
{
  const { res, body } = await get("/e/maite-1-ano");
  check("draft na rota pública: 404", res.status === 404, `status ${res.status}`);
  check("draft na rota pública: sem conteúdo do evento", !String(body).includes("Abrir o envelope"));
}

// Slug inexistente.
{
  const { res, body } = await get("/e/slug-que-nao-existe");
  check("slug inexistente: 404", res.status === 404, `status ${res.status}`);
  check("slug inexistente: página amigável", String(body).includes("Convite não encontrado"));
  check("slug inexistente: noindex", /<meta name="robots" content="noindex/.test(String(body)));
}

// Prévia de rascunho.
{
  const { res, body } = await get("/preview/maite-1-ano");
  if (previewOn) {
    check("prévia: 200", res.status === 200, `status ${res.status}`);
    check("prévia: marca pendências", body.includes("a confirmar") && body.includes("Prévia"));
    check("prévia: noindex", /<meta name="robots" content="noindex, nofollow"/.test(body));
    check("prévia: título identificado", body.includes("<title>[Prévia] Maitê faz 1 aninho!</title>"));
  } else {
    check("prévia desligada em produção: 404", res.status === 404, `status ${res.status}`);
    const og = await get("/og/maite-1-ano");
    check("og de draft desligada em produção: 404", og.res.status === 404, `status ${og.res.status}`);
  }
}

// robots.txt e home.
{
  const { body } = await get("/robots.txt");
  check("robots.txt bloqueia /preview/", body.includes("Disallow: /preview/"));
  const home = await get("/");
  check("home: 200", home.res.status === 200);
  if (!previewOn) check("home: não lista eventos em produção", !home.body.includes("/preview/"));
}

console.log(`\n${passed} verificações ok, ${failures.length} falha(s).`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
