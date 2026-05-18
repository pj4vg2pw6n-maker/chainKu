"use client";
import { useState, useEffect } from "react";
import { LOCAL_STORAGE_KEYS } from "@chainku/shared";

export function useOnboardingDismissed(): [boolean, () => void] {
  // Default true prevents a flash of the strip for returning visitors.
  // New visitors will see it appear briefly after mount — acceptable for MVP.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(
      localStorage.getItem(LOCAL_STORAGE_KEYS.onboardingDismissed) === "true"
    );
  }, []);

  const dismiss = () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.onboardingDismissed, "true");
    setDismissed(true);
  };

  return [dismissed, dismiss];
}
