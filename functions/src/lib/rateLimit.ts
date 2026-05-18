import * as logger from "firebase-functions/logger";
import { HttpsError } from "firebase-functions/v2/https";
import { admin, db } from "./admin";
import { COLLECTIONS, RATE_LIMIT_MAX, RateLimitAction } from "./constants";

/** Returns the current UTC hour slot as "YYYYMMDDHH". */
function hourSlot(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const h = String(now.getUTCHours()).padStart(2, "0");
  return `${y}${m}${d}${h}`;
}

/**
 * Atomically increments the counter for `key`. Returns false if the counter
 * already equals or exceeds `limit`; true if the increment was allowed.
 *
 * Uses a fixed hourly window (not sliding). The document TTL is set to 2 h
 * from now so Firestore's TTL deletes it automatically after the hour ends.
 */
async function checkAndIncrement(key: string, limit: number): Promise<boolean> {
  const ref = db.collection(COLLECTIONS.rateLimits).doc(key);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      const expiresAt = admin.firestore.Timestamp.fromMillis(
        Date.now() + 2 * 60 * 60 * 1000
      );
      tx.set(ref, { key, count: 1, expiresAt });
      return true;
    }

    const data = snap.data();
    if (!data || data.count >= limit) return false;

    tx.update(ref, { count: admin.firestore.FieldValue.increment(1) });
    return true;
  });
}

/**
 * Enforces per-IP and per-UUID rate limits for `action`. Throws
 * HttpsError(resource-exhausted) if either limit is exceeded.
 */
export async function enforceRateLimit(
  action: RateLimitAction,
  ip: string,
  uuid: string
): Promise<void> {
  const limit = RATE_LIMIT_MAX[action];
  const slot = hourSlot();

  const [ipOk, uuidOk] = await Promise.all([
    checkAndIncrement(`${action}_ip_${ip}_${slot}`, limit),
    checkAndIncrement(`${action}_uuid_${uuid}_${slot}`, limit),
  ]);

  if (!ipOk || !uuidOk) {
    logger.warn("Rate limit exceeded", {
      action,
      ip,
      uuid: uuid.slice(0, 8) + "…",
    });
    throw new HttpsError(
      "resource-exhausted",
      "Rate limit exceeded. Please try again later."
    );
  }
}
