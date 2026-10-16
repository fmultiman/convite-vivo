/**
 * Prova de reutilização: os dois eventos passam pelo MESMO EventExperience,
 * sem código específico por evento.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { events } from "@/events";
import { EventExperience } from "@/renderer/EventExperience";
import { resolveExperience } from "@/renderer/model";

// next/font só existe no compilador do Next; nos testes basta o contrato do catálogo.
vi.mock("@/renderer/fonts", () => {
  const font = (name: string) => ({ className: name, variable: name, cssVar: `--font-${name}` });
  return { fonts: { fraunces: font("fraunces"), nunito: font("nunito"), cormorant: font("cormorant"), jost: font("jost") } };
});
vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: ({ priority: _p, unoptimized: _u, ...props }: Record<string, unknown>) => <img {...props} />,
}));

function render(slug: string, mode: "public" | "preview") {
  const event = mode === "public" ? events.getPublishedEvent(slug) : events.getEventForPreview(slug);
  if (!event) throw new Error(`evento ${slug} não encontrado`);
  return renderToStaticMarkup(<EventExperience model={resolveExperience(event, mode)} />);
}

describe("EventExperience (renderer único)", () => {
  it("renderiza o evento demo publicado com identidade própria", () => {
    const html = render("demo-clara-e-davi", "public");
    expect(html).toContain('data-event="demo-clara-e-davi"');
    expect(html).toContain("--cv-accent:#D7B26C");
    expect(html).toContain('data-shape="sharp"');
    expect(html).toContain("Clara &amp; Davi");
    expect(html).toContain("sábado, 20 de março de 2027");
    expect(html).toContain("19h30");
    expect(html).toContain('href="https://example.com/demo/rsvp" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain("/events/demo-clara-e-davi/constelacao.svg");
    expect(html).toContain("Evento fictício de demonstração");
    // Info prática não confirmada fica fora do HTML público.
    expect(html).not.toContain("Espaço kids");
  });

  it("renderiza a prévia da Maitê com a mesma engine, tema e organização diferentes", () => {
    const html = render("maite-1-ano", "preview");
    expect(html).toContain('data-event="maite-1-ano"');
    expect(html).toContain("--cv-accent:#8A5BB5");
    expect(html).toContain('data-shape="round"');
    expect(html).toContain("Maitê — 1 aninho");
    expect(html).toContain("domingo, 8 de novembro de 2026");
    expect(html).toContain("a confirmar");
    expect(html).toContain('data-motif="envelope"');
    expect(html).toContain('data-motif="shell"');
    expect(html).toContain("Prévia · rascunho");
  });

  it("o HTML da Maitê em modo público não contém dados pendentes", () => {
    const event = events.getEventForPreview("maite-1-ano")!;
    const html = renderToStaticMarkup(<EventExperience model={resolveExperience(event, "public")} />);
    expect(html).toContain("Maitê — 1 aninho");
    expect(html).not.toContain("13h");
    expect(html).not.toContain("a confirmar");
    expect(html).not.toContain("KF-0");
    expect(html).not.toContain("Prévia");
  });

  it("nenhum código da aplicação é específico de um evento", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) walk(path);
        else files.push(path);
      }
    };
    walk(join(__dirname, "../src"));
    const allowed = join("src", "events", "index.ts"); // registro das configs
    const offenders = files.filter(
      (file) => !file.endsWith(allowed) && /maite|clara-e-davi/i.test(readFileSync(file, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
