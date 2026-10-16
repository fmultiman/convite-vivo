import Link from "next/link";
import { events } from "@/events";
import { BRAND_NAME, isDraftPreviewEnabled } from "@/lib/site";
import styles from "./site.module.css";

/**
 * Página institucional mínima. Convites nunca são listados publicamente; a
 * lista abaixo só aparece com a prévia de rascunhos ligada (desenvolvimento).
 */
export default function Home() {
  const showIndex = isDraftPreviewEnabled();
  return (
    <main className={styles.page}>
      <p className={styles.brand}>{BRAND_NAME}</p>
      <h1 className={styles.title}>Experiências digitais para eventos</h1>
      <p className={styles.text}>Se você recebeu um convite, abra o link enviado pelos anfitriões.</p>

      {showIndex ? (
        <section className={styles.devIndex} aria-labelledby="dev-index">
          <h2 id="dev-index">Eventos configurados (somente desenvolvimento)</h2>
          <ul>
            {events.listAll().map((event) => (
              <li key={event.slug}>
                <strong>{event.title}</strong> <span className={styles.status}>{event.status}</span>
                <span className={styles.links}>
                  {event.status === "published" ? <Link href={`/e/${event.slug}`}>/e/{event.slug}</Link> : null}
                  <Link href={`/preview/${event.slug}`}>/preview/{event.slug}</Link>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
