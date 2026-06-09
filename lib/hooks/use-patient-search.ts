"use client";

import { useEffect, useRef, useState } from "react";

export type PatientSearchHit = {
  id: string;
  name: string;
  cpf: string | null;
  phone: string | null;
};

const cache = new Map<string, PatientSearchHit[]>();

/**
 * Busca pacientes com debounce, cancelamento e cache em memória.
 */
export function usePatientSearch(query: string, minLength = 2) {
  const [hits, setHits] = useState<PatientSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < minLength) {
      setHits([]);
      setLoading(false);
      return;
    }

    const cached = cache.get(q);
    if (cached) {
      setHits(cached);
      setLoading(false);
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("/api/patients", window.location.origin);
        url.searchParams.set("q", q);
        const res = await fetch(url.toString(), {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setHits([]);
          return;
        }
        const patients = (data.patients as PatientSearchHit[]) ?? [];
        cache.set(q, patients);
        setHits(patients);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setHits([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, minLength]);

  return { hits, loading };
}
