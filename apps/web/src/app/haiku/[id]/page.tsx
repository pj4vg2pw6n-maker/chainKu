import { Suspense } from "react";
import { HaikuDetailClient } from "./HaikuDetailClient";

// Placeholder so Next.js accepts the dynamic route in static export mode.
// Firebase's SPA rewrite (** → /index.html) handles all real IDs at runtime.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function HaikuDetailPage() {
  return (
    <Suspense>
      <HaikuDetailClient />
    </Suspense>
  );
}
