import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Pass this token from the client to skip Turnstile in the local emulator. */
export const EMULATOR_BYPASS_TOKEN = "EMULATOR_BYPASS";

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Verifies a Cloudflare Turnstile token server-side.
 *
 * - In the Firebase Emulator (`FUNCTIONS_EMULATOR=true`), verification is
 *   skipped when the secret is absent OR when the client sends
 *   EMULATOR_BYPASS_TOKEN.
 * - In production, a missing secret key is a hard error.
 */
export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // No secret means we're in local development — bypass unconditionally.
  // In production the secret is always set; without it we refuse to serve.
  if (!secret) {
    if (token !== EMULATOR_BYPASS_TOKEN) {
      logger.warn("Turnstile secret not set; accepting bypass token only.", { token });
    }
    return;
  }

  // Bypass token accepted in any environment that has no secret.
  // (With a real secret present, EMULATOR_BYPASS would fail Cloudflare's check anyway.)
  if (token === EMULATOR_BYPASS_TOKEN) return;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  let json: SiteverifyResponse;
  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body });
    json = (await res.json()) as SiteverifyResponse;
  } catch (err) {
    logger.error("Turnstile siteverify request failed", err);
    throw new HttpsError("internal", "Failed to verify CAPTCHA.");
  }

  if (!json.success) {
    logger.warn("Turnstile verification failed", {
      errorCodes: json["error-codes"],
    });
    throw new HttpsError("invalid-argument", "CAPTCHA verification failed.");
  }
}
