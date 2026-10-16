import Image from "next/image";
import type { ResolvedAsset } from "../model";
import styles from "./primitives.module.css";

/**
 * Imagem de um asset aprovado ou, se indisponível, um placeholder elegante.
 * O placeholder é decorativo (aria-hidden): não descreve uma imagem que não
 * existe. Em prévia ele exibe o rótulo de produção (ex.: "KF-03").
 */
export function AssetImage({
  asset,
  sizes = "(max-width: 720px) 100vw, 720px",
  priority = false,
  className,
}: {
  asset: ResolvedAsset;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (asset.ready && asset.kind === "image") {
    return (
      <Image
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt={asset.alt}
        sizes={sizes}
        priority={priority}
        className={`${styles.image} ${className ?? ""}`}
        // SVG e URLs externas não passam pelo otimizador.
        unoptimized={asset.src.endsWith(".svg") || asset.src.startsWith("https://")}
      />
    );
  }
  const poster = !asset.ready ? asset.poster : null;
  if (poster) return <AssetImage asset={poster} sizes={sizes} priority={priority} className={className} />;
  return <AssetPlaceholder label={asset.ready ? "" : asset.label} width={asset.width} height={asset.height} className={className} />;
}

export function AssetPlaceholder({
  label,
  width,
  height,
  className,
}: {
  label: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={`${styles.placeholder} ${className ?? ""}`}
      style={{ aspectRatio: width && height ? `${width} / ${height}` : undefined }}
      aria-hidden={label ? undefined : true}
      data-asset-placeholder
    >
      <span className={styles.placeholderShine} />
      {label ? <span className={styles.placeholderLabel}>{label}</span> : null}
    </div>
  );
}
