import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/admin";
import { Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, createHaikuInputSchema } from "../lib/constants";
import { requireAppCheck } from "../lib/appCheck";
import { verifyTurnstile } from "../lib/turnstile";
import { enforceRateLimit } from "../lib/rateLimit";
import { parseInput } from "../lib/validation";
import { turnstileSecretKey } from "../lib/params";
import { getConfig } from "../lib/config";
import { clientIp } from "../lib/clientIp";

export const createHaiku = onCall({ secrets: [turnstileSecretKey], maxInstances: 10, enforceAppCheck: true }, async (request) => {
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

  const config = await getConfig();
  const now = Timestamp.now();
  const deadline = Timestamp.fromMillis(
    now.toMillis() + config.proposalWindowHours * 60 * 60 * 1000
  );

  const docRef = db.collection(COLLECTIONS.haikus).doc();

  await docRef.set({
    id: docRef.id,
    status: "awaiting_line_2",
    language: "en",
    initiatorId: callerUuid,
    line1: {
      text: line1Text,
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
