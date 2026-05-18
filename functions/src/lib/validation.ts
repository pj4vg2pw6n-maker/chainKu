import { HttpsError } from "firebase-functions/v2/https";

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}
interface SafeParseError {
  success: false;
  error: { errors: Array<{ message: string }> };
}
interface ParseableSchema<T> {
  safeParse(data: unknown): SafeParseSuccess<T> | SafeParseError;
}

/**
 * Parses `data` against `schema`. Throws an HttpsError(invalid-argument) on
 * failure so callers get a clean, client-visible error message.
 */
export function parseInput<T>(schema: ParseableSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(" ");
    throw new HttpsError("invalid-argument", message);
  }
  return result.data;
}
