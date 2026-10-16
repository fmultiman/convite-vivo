"use client";

import Image from "next/image";
import type { ReadyImage } from "../model";
import styles from "./layer-image.module.css";

/**
 * Imagem decorativa de camada (alt vazio, aria-hidden). Usa só atributos do
 * DOM (sem estado React): funciona também se `load`/`error` ocorrerem antes
 * da hidratação.
 */
export function LayerImage({
  image,
  className,
  priority = false,
  lazy = false,
}: {
  image: ReadyImage;
  className?: string;
  priority?: boolean;
  lazy?: boolean;
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
      alt=""
      aria-hidden="true"
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
