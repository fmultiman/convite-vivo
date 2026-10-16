import { NextResponse, type NextRequest } from "next/server";
import { events } from "@/events";
import { isDraftPreviewEnabled } from "@/lib/site";

/**
 * Status 404 real para convites inexistentes ou não publicados.
 *
 * Com Partial Prerendering, um slug fora do generateStaticParams recebe o
 * shell estático já em streaming (status 200) antes do notFound() da página.
 * A checagem aqui acontece antes da renderização, sem I/O: as listas vêm do
 * registro de eventos em memória. A página continua chamando notFound() como
 * segunda linha de defesa.
 */
const publishedSlugs = new Set(events.listPublishedSlugs());
const allSlugs = new Set(events.listAll().map((event) => event.slug));

/** Caminho sem rota: o Next responde com a página not-found e status 404. */
const NOT_FOUND_PATH = "/__convite-nao-encontrado";

function slugFrom(pathname: string): string | null {
  const segment = pathname.split("/")[2];
  if (!segment) return null;
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = slugFrom(pathname);
  const exists = pathname.startsWith("/e/")
    ? slug !== null && publishedSlugs.has(slug)
    : slug !== null && isDraftPreviewEnabled() && allSlugs.has(slug);

  if (exists) return NextResponse.next();
  return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
}

export const config = {
  matcher: ["/e/:slug", "/preview/:slug"],
};
