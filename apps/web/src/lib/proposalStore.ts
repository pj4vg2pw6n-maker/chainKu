import { LOCAL_STORAGE_KEYS } from "@chainku/shared";

const STORE_KEY = LOCAL_STORAGE_KEYS.proposals;

function load(): Record<string, number[]> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function save(store: Record<string, number[]>): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function hasProposed(haikuId: string, forLine: 2 | 3): boolean {
  return (load()[haikuId] ?? []).includes(forLine);
}

export function markProposed(haikuId: string, forLine: 2 | 3): void {
  const store = load();
  const lines = store[haikuId] ?? [];
  if (!lines.includes(forLine)) {
    store[haikuId] = [...lines, forLine];
    save(store);
  }
}
