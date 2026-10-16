import { ImageResponse } from "next/og";
import { events } from "@/events";
import { OG_IMAGE_SIZE } from "@/lib/metadata";
import { isDraftPreviewEnabled } from "@/lib/site";
import { formatEventDate } from "@/renderer/model";

/**
 * Imagem Open Graph gerada a partir da identidade visual do evento, usada
 * quando não há uma arte OG aprovada. Contém apenas título e data — nunca
 * imagens da criança ou dados não confirmados.
 */
export function generateStaticParams() {
  return events.listAll().map((event) => ({ slug: event.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = isDraftPreviewEnabled() ? events.getEventForPreview(slug) : events.getPublishedEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const c = event.theme.colors;
  const bubbles = [
    { x: 80, y: 420, r: 46 },
    { x: 180, y: 90, r: 22 },
    { x: 1040, y: 120, r: 54 },
    { x: 1110, y: 470, r: 26 },
    { x: 960, y: 540, r: 14 },
    { x: 300, y: 540, r: 16 },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: `linear-gradient(180deg, ${c.backdropFrom}, ${c.backdropTo})`,
          color: c.text,
          position: "relative",
        }}
      >
        {bubbles.map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x,
              top: b.y,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: "50%",
              border: `2px solid ${c.accent}`,
              opacity: 0.35,
            }}
          />
        ))}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "56px 80px",
            borderRadius: 40,
            backgroundColor: c.surface,
            border: `3px solid ${c.highlight}`,
            maxWidth: 960,
          }}
        >
          <div style={{ fontSize: 30, color: c.textMuted, letterSpacing: 4, textTransform: "uppercase" }}>Convite</div>
          <div style={{ fontSize: 84, fontWeight: 700, color: c.accent, textAlign: "center", lineHeight: 1.1, marginTop: 12 }}>
            {event.og.title}
          </div>
          <div style={{ fontSize: 34, marginTop: 24 }}>{formatEventDate(event.schedule.date)}</div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}
