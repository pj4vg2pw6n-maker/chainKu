"use client";
import { useState, useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "@chainku/shared";

export function useAnonymousId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let stored = localStorage.getItem(LOCAL_STORAGE_KEYS.uuid);
    if (!stored) {
      stored = crypto.randomUUID();
      localStorage.setItem(LOCAL_STORAGE_KEYS.uuid, stored);
    }
    setId(stored);
  }, []);

  return id;
}
