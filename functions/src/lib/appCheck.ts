import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

/**
 * Throws HttpsError(failed-precondition) if the request carries no valid App
 * Check token. Call this at the top of every callable that requires it.
 *
 * In the Firebase Emulator, App Check tokens are absent by design; the emulator
 * does not enforce App Check, so this check is a no-op there.
 */
export function requireAppCheck(request: CallableRequest): void {
  // request.app is null in the local emulator (no App Check token issued).
  // Only enforce in production where App Check is configured.
  if (!request.app && process.env.FUNCTIONS_EMULATOR !== "true") {
    throw new HttpsError(
      "failed-precondition",
      "This function must be called from a verified app."
    );
  }
}
