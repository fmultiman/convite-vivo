"use client";

import { useEffect, useRef, useState } from "react";
import { EXPERIENCE_EVENTS } from "./hooks";
import styles from "./client.module.css";

/**
 * Trilha opcional. Nunca toca sozinha: começa por toque no botão ou, se
 * configurado, no toque de entrada (que já é um gesto do visitante).
 */
export function AudioToggle({ src, label, playOnEnter }: { src: string; label: string; playOnEnter: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playOnEnter) return;
    const onEnter = () => {
      audioRef.current?.play().catch(() => setPlaying(false));
    };
    window.addEventListener(EXPERIENCE_EVENTS.enter, onEnter);
    return () => window.removeEventListener(EXPERIENCE_EVENTS.enter, onEnter);
  }, [playOnEnter]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className={styles.audioToggle}
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? `Pausar: ${label}` : `Tocar: ${label}`}
      >
        <span aria-hidden="true">{playing ? "❚❚" : "♪"}</span>
      </button>
    </>
  );
}
