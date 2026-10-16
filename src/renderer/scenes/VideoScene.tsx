"use client";

import { useState, useSyncExternalStore } from "react";
import type { ResolvedScene } from "../model";
import type { RenderMode } from "../model";
import { AssetImage } from "../primitives/AssetImage";
import { prefersLightweightMedia, usePrefersReducedMotion } from "../client/hooks";
import styles from "./scenes.module.css";

type VideoModel = Extract<ResolvedScene, { kind: "video" }>;

const noopSubscribe = () => () => {};

/**
 * Video Scene com fallback:
 * - asset pendente → poster aprovado ou placeholder (rótulo só em prévia);
 * - falha de carregamento → poster + aviso discreto;
 * - vídeo ambiente (mudo/loop) não carrega com reduced motion ou economia de dados;
 * - vídeo com controles usa preload="none": nada é baixado até o play.
 */
export function VideoScene({ scene, mode }: { scene: VideoModel; mode: RenderMode }) {
  const [failed, setFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const lightweight = useSyncExternalStore(noopSubscribe, prefersLightweightMedia, () => true);
  const asset = scene.asset;

  const video = asset.ready && asset.kind === "video" ? asset : null;
  const allowAmbient = !reducedMotion && !lightweight;
  const showVideo = video && !failed && (!scene.ambient || allowAmbient);
  const titleId = scene.headline ? `${scene.id}-title` : undefined;

  return (
    <section id={scene.id} className={styles.section} aria-labelledby={titleId}>
      {scene.eyebrow ? <p className={styles.eyebrow}>{scene.eyebrow}</p> : null}
      {scene.headline ? (
        <h2 id={titleId} className={styles.headline}>
          {scene.headline}
        </h2>
      ) : null}

      <div className={styles.media} data-orientation={orientation(asset.width, asset.height)}>
        {showVideo ? (
          <video
            className={styles.video}
            src={video.src}
            poster={video.poster?.src}
            width={video.width}
            height={video.height}
            aria-label={video.alt}
            playsInline
            controls={!scene.ambient}
            muted={scene.ambient}
            loop={scene.ambient}
            autoPlay={scene.ambient}
            preload={scene.ambient ? "auto" : "none"}
            onError={() => setFailed(true)}
          />
        ) : (
          <AssetImage asset={video?.poster ?? asset} />
        )}
      </div>

      {failed ? <p className={styles.mediaNote}>Não foi possível carregar o vídeo agora.</p> : null}
      {!video && mode === "preview" ? <p className={styles.mediaNote}>Vídeo pendente — exibindo fallback.</p> : null}
      {scene.body ? <p className={styles.body}>{scene.body}</p> : null}
    </section>
  );
}

function orientation(width?: number, height?: number) {
  if (!width || !height) return "landscape";
  return height > width ? "portrait" : "landscape";
}
