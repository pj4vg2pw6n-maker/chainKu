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
  const isEmulator = process.env.FUNCTIONS_EMULATOR === "true";

  if (isEmulator && token === EMULATOR_BYPASS_TOKEN) return;

  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (isEmulator) {
      logger.warn("Turnstile secret not set; skipping verification in emulator.");
      return;
    }
    throw new HttpsError("internal", "Turnstile is not configured.");
  }

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
