"use client";
import { useState, useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "@chainku/shared";

// English syllable estimation sufficient for haiku guidance.
// Uses a vowel-group heuristic with silent-ending stripping.
function estimateSyllables(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, word) => sum + wordSyllables(word), 0);
}

function wordSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word
    .replace(/(?:[^laeiouy]es|[^aeiou]ed|[^laeiouy]e)$/, "") // silent endings
    .replace(/^y/, ""); // leading y is not a vowel
  return Math.max(1, (word.match(/[aeiouy]{1,2}/g) ?? []).length);
}

interface Props {
  text: string;
  target: number;
}

export function SyllableCounter({ text, target }: Props) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (
      localStorage.getItem(LOCAL_STORAGE_KEYS.syllableCounterEnabled) ===
      "false"
    ) {
      setEnabled(false);
    }
  }, []);

  const toggle = () => {
    const next = !enabled;
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.syllableCounterEnabled,
      String(next)
    );
    setEnabled(next);
  };

  const count = estimateSyllables(text);
  const atTarget = count === target;

  return (
    <div className="flex items-center gap-3 mt-1.5">
      {enabled && (
        <span
          className={`text-xs tabular-nums transition-colors duration-150 ${
            atTarget ? "text-accent" : "text-gray-muted"
          }`}
        >
          {count} {count === 1 ? "syllable" : "syllables"} · target {target}
        </span>
      )}
      <button
        type="button"
        onClick={toggle}
        className="text-xs text-gray-muted hover:text-gray-ui transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        {enabled ? "hide counter" : "show counter"}
      </button>
    </div>
  );
}
