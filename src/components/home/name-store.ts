"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/*
  The visitor's typed name, shared by the home page's client islands:
  hero (board + WhatsApp CTA), the tiramisu tile, the steps CTA and the
  sticky bar. A module-level store instead of a context provider, so the
  islands stay separate (the sections between them remain server HTML).
  Server render and first client render both see "" (no hydration mismatch).
*/

let current = "";
const listeners = new Set<() => void>();

export function setHomeName(value: string) {
  if (value === current) return;
  current = value;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHomeName(): string {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "",
  );
}

/** `value`, but only after it has stopped changing for `ms` (debounce). */
export function useSettled(value: string, ms: number): string {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}
