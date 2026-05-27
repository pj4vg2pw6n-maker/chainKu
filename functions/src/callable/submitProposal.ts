import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/admin";
import { Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, submitProposalInputSchema } from "../lib/constants";
import { requireAppCheck } from "../lib/appCheck";
import { verifyTurnstile } from "../lib/turnstile";
import { enforceRateLimit } from "../lib/rateLimit";
import { parseInput } from "../lib/validation";
import { turnstileSecretKey } from "../lib/params";
import { getConfig } from "../lib/config";
import { clientIp } from "../lib/clientIp";

export const submitProposal = onCall({ secrets: [turnstileSecretKey], maxInstances: 10, enforceAppCheck: true }, async (request) => {
  requireAppCheck(request);

  const { haikuId, text, turnstileToken, callerUuid } = parseInput(
    submitProposalInputSchema,
    request.data
  );

  const ip = clientIp(request);

  await verifyTurnstile(turnstileToken, ip);
  await enforceRateLimit("submitProposal", ip, callerUuid);

  const config = await getConfig();
  const haikuRef = db.collection(COLLECTIONS.haikus).doc(haikuId);
  const proposalsRef = haikuRef.collection(COLLECTIONS.proposals);

  await db.runTransaction(async (tx) => {
    const haikuSnap = await tx.get(haikuRef);

    if (!haikuSnap.exists) {
      throw new HttpsError("not-found", "Haiku not found.");
    }

    const haiku = haikuSnap.data()!;
    const status: string = haiku.status;

    if (status !== "awaiting_line_2" && status !== "awaiting_line_3") {
      throw new HttpsError(
        "failed-precondition",
        "This haiku is not accepting proposals right now."
      );
    }

    if (haiku.initiatorId === callerUuid) {
      throw new HttpsError(
        "permission-denied",
        "You cannot propose on your own haiku."
      );
    }

    const forLine: 2 | 3 = status === "awaiting_line_2" ? 2 : 3;

    // One proposal per user per line
    const existingSnap = await tx.get(
      proposalsRef
        .where("authorId", "==", callerUuid)
        .where("forLine", "==", forLine)
        .limit(1)
    );

    if (!existingSnap.empty) {
      throw new HttpsError(
        "already-exists",
        "You have already submitted a proposal for this line."
      );
    }

    const maxProposals: number = config.maxProposalsPerLine;

    if (haiku.proposalCount >= maxProposals) {
      throw new HttpsError(
        "failed-precondition",
        "The proposal window for this line is already closed."
      );
    }

    const newCount: number = haiku.proposalCount + 1;
    const now = Timestamp.now();

    const proposalRef = proposalsRef.doc();
    tx.set(proposalRef, {
      id: proposalRef.id,
      text,
      authorId: callerUuid,
      forLine,
      createdAt: now,
    });

    const update: Record<string, unknown> = {
      proposalCount: newCount,
      updatedAt: now,
    };

    // Early close when max proposals reached
    if (newCount >= maxProposals) {
      const nextStatus = forLine === 2 ? "awaiting_choice_2" : "awaiting_choice_3";
      update.status = nextStatus;
      update.currentDeadline = Timestamp.fromMillis(
        now.toMillis() + config.choiceWindowHours * 60 * 60 * 1000
      );
      logger.info("submitProposal: max proposals reached, closing early", {
        haikuId,
        nextStatus,
      });
    }

    tx.update(haikuRef, update);
  });

  logger.info("submitProposal: proposal submitted", {
    haikuId,
    callerUuid: callerUuid.slice(0, 8),
  });

  return { success: true };
});
