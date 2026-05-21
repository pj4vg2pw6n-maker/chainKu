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
 * In the local emulator TURNSTILE_SECRET_KEY is not injected by Firebase, so
 * `secret` will be undefined. In that case the bypass token is accepted and
 * all other tokens are logged but also accepted (local dev convenience).
 *
 * In production the secret is always present (injected via Secret Manager).
 * No bypass token is accepted — every token goes to Cloudflare's siteverify.
 */
export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<void> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // Local emulator: secret not injected. Accept bypass token silently;
    // log a warning for any other token so it is visible in emulator logs.
    if (token !== EMULATOR_BYPASS_TOKEN) {
      logger.warn("Turnstile secret not set; skipping verification in emulator.", { token });
    }
    return;
  }

  // Production: always call Cloudflare. No bypass tokens are accepted.
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
