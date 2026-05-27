import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/admin";
import { Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, CONFIG_DEFAULTS, chooseProposalInputSchema } from "../lib/constants";
import { requireAppCheck } from "../lib/appCheck";
import { parseInput } from "../lib/validation";
import { enforceRateLimit } from "../lib/rateLimit";
import { clientIp } from "../lib/clientIp";

async function deleteProposals(
  proposalsRef: FirebaseFirestore.CollectionReference
): Promise<void> {
  const snap = await proposalsRef.get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

export const chooseProposal = onCall({ maxInstances: 10, enforceAppCheck: true }, async (request) => {
  requireAppCheck(request);

  const { haikuId, proposalId, callerUuid } = parseInput(
    chooseProposalInputSchema,
    request.data
  );

  await enforceRateLimit("chooseProposal", clientIp(request), callerUuid);

  const haikuRef = db.collection(COLLECTIONS.haikus).doc(haikuId);
  const proposalsRef = haikuRef.collection(COLLECTIONS.proposals);
  const proposalRef = proposalsRef.doc(proposalId);

  await db.runTransaction(async (tx) => {
    const [haikuSnap, proposalSnap] = await Promise.all([
      tx.get(haikuRef),
      tx.get(proposalRef),
    ]);

    if (!haikuSnap.exists) {
      throw new HttpsError("not-found", "Haiku not found.");
    }

    const haiku = haikuSnap.data()!;
    const status: string = haiku.status;

    if (haiku.initiatorId !== callerUuid) {
      throw new HttpsError(
        "permission-denied",
        "Only the initiator can choose a proposal."
      );
    }

    if (status !== "awaiting_choice_2" && status !== "awaiting_choice_3") {
      throw new HttpsError(
        "failed-precondition",
        "This haiku is not in a choice phase."
      );
    }

    if (!proposalSnap.exists) {
      throw new HttpsError("not-found", "Proposal not found.");
    }

    const proposal = proposalSnap.data()!;
    const now = Timestamp.now();
    const isLine2 = status === "awaiting_choice_2";

    // authorId is intentionally omitted to keep accepted contributions fully
    // anonymous on the publicly readable haiku document.
    const canonicalLine = {
      text: proposal.text as string,
      chosenAt: now,
      chosenBy: "initiator" as const,
    };

    const update: Record<string, unknown> = {
      [isLine2 ? "line2" : "line3"]: canonicalLine,
      proposalCount: 0,
      updatedAt: now,
    };

    if (isLine2) {
      update.status = "awaiting_line_3";
      update.currentDeadline = Timestamp.fromMillis(
        now.toMillis() + CONFIG_DEFAULTS.proposalWindowHours * 60 * 60 * 1000
      );
    } else {
      update.status = "completed";
      update.completedAt = now;
      // currentDeadline intentionally not updated; idempotency guard in processTimeouts handles it
    }

    tx.update(haikuRef, update);
  });

  // Best-effort cleanup: delete all proposals after state is committed
  await deleteProposals(proposalsRef);

  logger.info("chooseProposal: proposal chosen", {
    haikuId,
    proposalId,
    callerUuid: callerUuid.slice(0, 8),
  });

  return { success: true };
});
