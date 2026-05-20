import { onCall, CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { admin, db } from "../lib/admin";
import { COLLECTIONS, CONFIG_DEFAULTS, createHaikuInputSchema } from "../lib/constants";
import { requireAppCheck } from "../lib/appCheck";
import { verifyTurnstile } from "../lib/turnstile";
import { enforceRateLimit } from "../lib/rateLimit";
import { parseInput } from "../lib/validation";

function clientIp(request: CallableRequest): string {
  const forwarded = request.rawRequest.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return request.rawRequest.ip ?? "unknown";
}

export const createHaiku = onCall(async (request) => {
  logger.info("step: appCheck");
  requireAppCheck(request);

  logger.info("step: parseInput", { data: JSON.stringify(request.data) });
  const { line1Text, turnstileToken, callerUuid } = parseInput(
    createHaikuInputSchema,
    request.data
  );

  const ip = clientIp(request);

  logger.info("step: turnstile", { ip, token: turnstileToken });
  await verifyTurnstile(turnstileToken, ip);

  logger.info("step: rateLimit");
  await enforceRateLimit("createHaiku", ip, callerUuid);

  logger.info("step: firestoreWrite");

  const now = admin.firestore.Timestamp.now();
  const deadline = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + CONFIG_DEFAULTS.proposalWindowHours * 60 * 60 * 1000
  );

  const docRef = db.collection(COLLECTIONS.haikus).doc();

  await docRef.set({
    id: docRef.id,
    status: "awaiting_line_2",
    language: "en",
    initiatorId: callerUuid,
    line1: {
      text: line1Text,
      authorId: callerUuid,
      createdAt: now,
    },
    line2: null,
    line3: null,
    currentDeadline: deadline,
    proposalCount: 0,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });

  logger.info("createHaiku: created", {
    haikuId: docRef.id,
    initiatorId: callerUuid.slice(0, 8),
  });

  return { haikuId: docRef.id };
});
