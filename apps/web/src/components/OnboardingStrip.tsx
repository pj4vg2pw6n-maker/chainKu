"use client";
import { usePathname } from "next/navigation";
import { useOnboardingDismissed } from "@/hooks/useOnboardingDismissed";

export function OnboardingStrip() {
  const pathname = usePathname();
  const [dismissed, dismiss] = useOnboardingDismissed();

  if (pathname !== "/" || dismissed) return null;

  return (
    <div className="bg-[#F0F7F4] border-b border-[#C9E0D8] px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm text-[#111111]">
          ChainKu is a place to write haiku together. Three lines, three people.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 text-sm font-medium text-accent hover:text-accent-light transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
