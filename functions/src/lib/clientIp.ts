import { CallableRequest } from "firebase-functions/v2/https";

/**
 * Returns the originating client IP for rate-limiting purposes.
 *
 * Why not take the leftmost X-Forwarded-For value: it is fully client-controlled.
 * A caller can send `X-Forwarded-For: 1.2.3.4`; Google's frontend appends the
 * real connecting IP to the right of that, so the leftmost entry is the
 * attacker's choice and trivially bypasses per-IP rate limits.
 *
 * Cloud Functions v2 (Cloud Run) emits XFF in the form
 *   `<supplied?>, <real-client-ip>, <load-balancer-ip>`
 * so the trustworthy client IP is the second-to-last entry. If only one entry
 * is present (no client-supplied prefix and no LB hop), that single entry is
 * the client IP.
 */
export function clientIp(request: CallableRequest): string {
  const xff = request.rawRequest.headers["x-forwarded-for"];
  if (typeof xff === "string") {
    const parts = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
  }
  return request.rawRequest.ip ?? "unknown";
}
