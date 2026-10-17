"use client";

import Image from "next/image";
import type { ReadyImage } from "../model";
import styles from "./layer-image.module.css";

/**
 * Imagem de camada: decorativa por padrão (alt vazio, aria-hidden); com `alt` passa
 * a ser conteúdo (ex.: o personagem revelado). Usa só atributos do
 * DOM (sem estado React): funciona também se `load`/`error` ocorrerem antes
 * da hidratação.
 */
export function LayerImage({
  image,
  className,
  priority = false,
  lazy = false,
  alt,
}: {
  image: ReadyImage;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
  alt?: string;
}) {
  return (
    <Image
      ref={(el) => {
        if (!el || !el.complete) return;
        if (el.naturalWidth > 0) el.dataset.loaded = "1";
        else el.dataset.failed = "1";
      }}
      src={image.src}
      width={image.width}
      height={image.height}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : "true"}
      unoptimized
      priority={priority}
      loading={priority ? undefined : lazy ? "lazy" : "eager"}
      fetchPriority={priority ? "high" : "low"}
      draggable={false}
      className={`${styles.img} ${className ?? ""}`}
      onLoad={(e) => {
        e.currentTarget.dataset.loaded = "1";
      }}
      onError={(e) => {
        e.currentTarget.dataset.failed = "1";
      }}
    />
  );
}
