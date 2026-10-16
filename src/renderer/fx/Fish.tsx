import type { CSSProperties } from "react";
import type { Fish as FishConfig } from "@/contract/event.schema";
import styles from "./fish.module.css";

/**
 * Peixinhos decorativos em SVG, independentes do fundo. Cada peixe é uma camada
 * própria: atravessa o palco (CSS, só transform), balança o corpo e bate a cauda.
 * Sem JavaScript por quadro e sem imagens: leve, nítido em qualquer densidade de
 * pixels e fácil de recolorir por evento (variantes de paleta).
 */

type Variant = FishConfig["variant"];

const PALETTES: Record<Variant, { body: [string, string, string]; fin: [string, string] }> = {
  coral: { body: ["#ff8fb8", "#ffb7a3", "#fff1e4"], fin: ["#ff7ab0", "#ffd0a8"] },
  lilas: { body: ["#a98bff", "#d6a8ff", "#fbeaff"], fin: ["#9a7bff", "#f3b6ff"] },
  aqua: { body: ["#46d6d6", "#8fece0", "#eafffb"], fin: ["#3ec6e8", "#b0f5ee"] },
  perola: { body: ["#f1dcff", "#cfe6ff", "#ffffff"], fin: ["#e7c6ff", "#ffe3b5"] },
};

const gradientId = (prefix: string, kind: "body" | "fin", variant: Variant) => `${prefix}-${kind}-${variant}`;

/** Gradientes compartilhados (uma vez por cena); os peixes só os referenciam. */
export function FishDefs({ prefix, variants }: { prefix: string; variants: Variant[] }) {
  return (
    <svg className={styles.defs} width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {variants.map((v) => (
          <g key={v}>
            <linearGradient id={gradientId(prefix, "body", v)} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={PALETTES[v].body[0]} />
              <stop offset="0.55" stopColor={PALETTES[v].body[1]} />
              <stop offset="1" stopColor={PALETTES[v].body[2]} />
            </linearGradient>
            <linearGradient id={gradientId(prefix, "fin", v)} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={PALETTES[v].fin[0]} stopOpacity="0.85" />
              <stop offset="1" stopColor={PALETTES[v].fin[1]} stopOpacity="0.7" />
            </linearGradient>
          </g>
        ))}
      </defs>
    </svg>
  );
}

function FishDrawing({ shape, body, fin }: { shape: FishConfig["shape"]; body: string; fin: string }) {
  const bodyFill = `url(#${body})`;
  const finFill = `url(#${fin})`;
  if (shape === "disco") {
    return (
      <svg viewBox="0 0 100 56" className={styles.svg} aria-hidden="true" focusable="false">
        <g className={styles.tail}>
          <path d="M32 28 C22 21 12 10 2 6 C8 19 8 37 2 50 C12 46 22 35 32 28 Z" fill={finFill} />
        </g>
        <path d="M40 11 C46 -1 62 -1 70 9 C60 8 49 8 40 11 Z" fill={finFill} />
        <path d="M44 45 C48 55 60 56 66 46 C58 46 50 46 44 45 Z" fill={finFill} />
        <path d="M30 28 C32 10 56 3 76 11 C90 17 95 24 95 30 C94 40 80 50 62 51 C42 52 29 42 30 28 Z" fill={bodyFill} />
        <path d="M50 8 C46 20 46 38 50 49" stroke="#fff" strokeOpacity="0.3" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M59 7 C56 20 56 38 59 50" stroke="#fff" strokeOpacity="0.22" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M40 19 C52 10 70 10 82 18 C68 15 52 15 40 19 Z" fill="#fff" fillOpacity="0.4" />
        <path d="M69 16 C65 26 65 36 69 46" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <g className={styles.fin}>
          <path d="M66 30 C59 33 55 39 57 43 C64 41 68 36 66 30 Z" fill={finFill} fillOpacity="0.85" />
        </g>
        <circle cx="82" cy="24" r="3.6" fill="#2a3a66" />
        <circle cx="83.2" cy="22.8" r="1.2" fill="#fff" />
        <path d="M94 30.5 C92 32 90 32 88.5 31.4" stroke="#b55b8a" strokeWidth="1" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 56" className={styles.svg} aria-hidden="true" focusable="false">
      <g className={styles.tail}>
        <path d="M26 28 C18 22 9 14 2 9 C6 20 6 36 2 47 C9 42 18 34 26 28 Z" fill={finFill} />
      </g>
      <path d="M38 15 C44 3 58 2 66 13 C58 11 47 11 38 15 Z" fill={finFill} />
      <path d="M42 41 C46 51 55 53 60 43 C54 44 48 43 42 41 Z" fill={finFill} />
      <path d="M24 28 C28 13 48 8 68 13 C82 17 91 23 96 28 C91 33 82 39 68 43 C48 48 28 43 24 28 Z" fill={bodyFill} />
      <path d="M33 22 C47 13 65 15 79 21 C64 19 47 19 33 22 Z" fill="#fff" fillOpacity="0.42" />
      <circle cx="44" cy="29" r="1.3" fill="#fff" fillOpacity="0.6" />
      <circle cx="51" cy="29.6" r="1.3" fill="#fff" fillOpacity="0.55" />
      <circle cx="58" cy="29" r="1.3" fill="#fff" fillOpacity="0.5" />
      <path d="M70 19 C67 26 67 31 70 38" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <g className={styles.fin}>
        <path d="M64 30 C58 33 54 38 56 41 C62 39 66 35 64 30 Z" fill={finFill} fillOpacity="0.85" />
      </g>
      <circle cx="84" cy="26" r="3.3" fill="#2a3a66" />
      <circle cx="85.1" cy="24.9" r="1.1" fill="#fff" />
      <path d="M95 30 C93 31.2 91 31.2 89.5 30.6" stroke="#b55b8a" strokeWidth="0.9" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/**
 * Um peixe em sua pista. Posição, tamanho e ritmo vêm da configuração; os
 * detalhes que variam entre peixes (batida da cauda, ondulação) derivam do índice,
 * sem aleatoriedade (servidor e cliente geram o mesmo HTML).
 */
export function FishSprite({ fish, prefix, index }: { fish: FishConfig; prefix: string; index: number }) {
  const rest = fish.direction === "ltr" ? 12 + fish.phase * 76 : 88 - fish.phase * 76;
  const style = {
    "--y": fish.y,
    "--w": fish.size,
    "--dur": `${fish.duration}s`,
    "--delay": `${(-fish.phase * fish.duration).toFixed(2)}s`,
    "--rest": rest.toFixed(1),
    "--wag": `${(0.62 + (index % 4) * 0.13).toFixed(2)}s`,
    "--bob": `${(3 + (index % 5) * 0.7).toFixed(1)}s`,
    "--bob-delay": `${(-(index % 7) * 0.9).toFixed(1)}s`,
  } as CSSProperties;
  return (
    <div className={styles.lane} style={style} data-plane={fish.plane} data-dir={fish.direction} data-fish>
      <div className={styles.bob}>
        <div className={styles.flip}>
          <FishDrawing
            shape={fish.shape}
            body={gradientId(prefix, "body", fish.variant)}
            fin={gradientId(prefix, "fin", fish.variant)}
          />
        </div>
      </div>
    </div>
  );
}

/** Variantes distintas usadas pelos peixes (para emitir só os gradientes necessários). */
export function usedVariants(fish: FishConfig[]): Variant[] {
  return [...new Set(fish.map((f) => f.variant))];
}
