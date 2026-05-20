import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/admin";
import { Timestamp } from "firebase-admin/firestore";
import { COLLECTIONS, CONFIG_DEFAULTS } from "../lib/constants";

async function deleteProposals(
  proposalsRef: FirebaseFirestore.CollectionReference
): Promise<void> {
  const snap = await proposalsRef.get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Processes a single overdue haiku inside a transaction.
 * Returns true when proposals should be deleted after the transaction
 * (only the auto-pick case; the deletion case has an empty subcollection).
 */
async function processHaiku(
  haikuRef: FirebaseFirestore.DocumentReference
): Promise<boolean> {
  const proposalsRef = haikuRef.collection(COLLECTIONS.proposals);

  const deleteAfter = await db.runTransaction(async (tx) => {
    const haikuSnap = await tx.get(haikuRef);

    if (!haikuSnap.exists) return false;

    const haiku = haikuSnap.data()!;
    const status: string = haiku.status;
    const now = Timestamp.now();

    // Idempotency guards — re-check inside the transaction
    if (haiku.currentDeadline.toMillis() > now.toMillis()) return false;
    if (
      status !== "awaiting_line_2" &&
      status !== "awaiting_line_3" &&
      status !== "awaiting_choice_2" &&
      status !== "awaiting_choice_3"
    ) {
      return false;
    }

    // ── Proposal-collection phase ──────────────────────────────────────────
    if (status === "awaiting_line_2" || status === "awaiting_line_3") {
      if (haiku.proposalCount === 0) {
        // No proposals — delete the haiku; subcollection is already empty
        tx.delete(haikuRef);
        logger.info("processTimeouts: deleted haiku (no proposals)", {
          haikuId: haikuRef.id,
          status,
        });
        return false;
      }

      // Advance to choice phase
      const nextStatus =
        status === "awaiting_line_2" ? "awaiting_choice_2" : "awaiting_choice_3";
      const deadline = Timestamp.fromMillis(
        now.toMillis() + CONFIG_DEFAULTS.choiceWindowHours * 60 * 60 * 1000
      );
      tx.update(haikuRef, {
        status: nextStatus,
        currentDeadline: deadline,
        updatedAt: now,
      });
      logger.info("processTimeouts: advanced to choice phase", {
        haikuId: haikuRef.id,
        nextStatus,
      });
      return false; // keep proposals — initiator needs them
    }

    // ── Choice phase ───────────────────────────────────────────────────────
    const proposalsSnap = await tx.get(proposalsRef);

    if (proposalsSnap.empty) {
      // Defensive: should not happen, but clean up to avoid stuck state
      tx.delete(haikuRef);
      logger.warn("processTimeouts: deleted haiku (choice phase, no proposals)", {
        haikuId: haikuRef.id,
        status,
      });
      return false;
    }

    const chosen = pickRandom(proposalsSnap.docs);
    const chosenData = chosen.data();
    const isLine2 = status === "awaiting_choice_2";
    const canonicalLine = {
      text: chosenData.text as string,
      authorId: chosenData.authorId as string,
      chosenAt: now,
      chosenBy: "random" as const,
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
      // currentDeadline not updated; idempotency guard handles future queries
    }

    tx.update(haikuRef, update);
    logger.info("processTimeouts: auto-picked proposal", {
      haikuId: haikuRef.id,
      proposalId: chosen.id,
      nextStatus: isLine2 ? "awaiting_line_3" : "completed",
    });
    return true; // proposals must be deleted after transaction
  });

  if (deleteAfter) {
    await deleteProposals(proposalsRef);
  }

  return deleteAfter;
}

export const processTimeouts = onSchedule("every 5 minutes", async () => {
  const now = Timestamp.now();

  const snap = await db
    .collection(COLLECTIONS.haikus)
    .where("currentDeadline", "<", now)
    .get();

  if (snap.empty) {
    logger.info("processTimeouts: nothing to process");
    return;
  }

  logger.info(`processTimeouts: checking ${snap.size} haiku(s)`);

  const results = await Promise.allSettled(
    snap.docs.map((doc) => processHaiku(doc.ref))
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    logger.error(`processTimeouts: ${failures.length} haiku(s) failed`, {
      errors: failures.map((r) => (r as PromiseRejectedResult).reason?.message),
    });
  }
});
