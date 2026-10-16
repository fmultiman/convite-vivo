"use client";

import { useSyncExternalStore } from "react";
import type { Phase } from "@/contract/event.schema";
import { daysUntilEvent, resolvePhase, type PhaseInput } from "@/contract/lifecycle";

/** Eventos DOM trocados entre componentes independentes da experiência. */
export const EXPERIENCE_EVENTS = {
  /** Visitante entrou (gesto do usuário): pode iniciar áudio. */
  enter: "cv:enter",
  /** Pedido para rever o convite desde a entrada. */
  replay: "cv:replay",
} as const;

function subscribeMinute(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  return () => window.clearInterval(timer);
}

/**
 * Fase temporal calculada no navegador (o HTML estático não sabe a hora da
 * visita). Retorna null durante SSR/hidratação.
 */
export function usePhase(input: PhaseInput): { phase: Phase; daysLeft: number } | null {
  const snapshot = useSyncExternalStore(
    subscribeMinute,
    () => {
      const now = new Date();
      return `${resolvePhase(input, now)}|${daysUntilEvent(input, now)}`;
    },
    () => null,
  );
  if (!snapshot) return null;
  const [phase, days] = snapshot.split("|");
  return { phase: phase as Phase, daysLeft: Number(days) };
}

function mediaQueryStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    get: () => window.matchMedia(query).matches,
  };
}

const reducedMotion = mediaQueryStore("(prefers-reduced-motion: reduce)");

/** true no servidor (padrão conservador: sem movimento até sabermos). */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(reducedMotion.subscribe, reducedMotion.get, () => true);
}

/** Economia de dados declarada pelo navegador (Save-Data / conexões 2G). */
export function prefersLightweightMedia(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  return Boolean(connection?.saveData || connection?.effectiveType?.includes("2g"));
}
