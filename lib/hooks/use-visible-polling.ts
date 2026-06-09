"use client";

import { useCallback, useEffect, useRef } from "react";

type Options = {
  /** Intervalo com aba visível (ms). */
  intervalMs: number;
  /** Intervalo com aba em segundo plano (ms). 0 = pausa. */
  backgroundIntervalMs?: number;
  enabled?: boolean;
};

/**
 * Executa callback em intervalo e reduz/pausa quando a aba não está visível.
 */
export function useVisiblePolling(callback: () => void | Promise<void>, options: Options) {
  const { intervalMs, backgroundIntervalMs = 0, enabled = true } = options;
  const cbRef = useRef(callback);
  cbRef.current = callback;

  const tick = useCallback(() => {
    void cbRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let id: ReturnType<typeof setInterval> | null = null;

    const schedule = () => {
      if (id) clearInterval(id);
      const ms =
        typeof document !== "undefined" && document.visibilityState === "hidden"
          ? backgroundIntervalMs
          : intervalMs;
      if (ms > 0) {
        id = setInterval(tick, ms);
      }
    };

    schedule();
    const onVisibility = () => schedule();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, backgroundIntervalMs, tick]);
}
