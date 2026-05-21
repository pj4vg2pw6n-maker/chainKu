import * as logger from "firebase-functions/logger";
import { db } from "./admin";
import { CONFIG_DEFAULTS, GlobalConfig } from "@chainku/shared";
import { COLLECTIONS } from "./constants";

// Mutable baseline that is safe to assign to GlobalConfig
const DEFAULTS: GlobalConfig = { ...CONFIG_DEFAULTS, enabledLanguages: [...CONFIG_DEFAULTS.enabledLanguages] };

let cached: GlobalConfig | null = null;

/**
 * Returns the config/global document merged with CONFIG_DEFAULTS.
 * Cached per function instance; falls back to defaults on any read error.
 */
export async function getConfig(): Promise<GlobalConfig> {
  if (cached) return cached;
  try {
    const snap = await db.collection(COLLECTIONS.config).doc("global").get();
    if (snap.exists) {
      cached = { ...DEFAULTS, ...(snap.data() as Partial<GlobalConfig>) };
      return cached;
    }
  } catch (err) {
    logger.warn("config/global: read failed, falling back to defaults", { err });
  }
  return DEFAULTS;
}
