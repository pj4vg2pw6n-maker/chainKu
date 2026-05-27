"use client";
import { useState, useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "@chainku/shared";

// crypto.randomUUID() requires iOS 15.4+. Fall back to getRandomValues()
// (available since iOS 7) so the app works on older devices.
function generateUUID(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = +c;
    return (
      n ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))
    ).toString(16);
  });
}

export function useAnonymousId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let stored = localStorage.getItem(LOCAL_STORAGE_KEYS.uuid);
    if (!stored) {
      stored = generateUUID();
      localStorage.setItem(LOCAL_STORAGE_KEYS.uuid, stored);
    }
    setId(stored);
  }, []);

  return id;
}
