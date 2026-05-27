import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/admin";
import { COLLECTIONS, getProposalsForChoiceInputSchema } from "../lib/constants";
import { requireAppCheck } from "../lib/appCheck";
import { enforceRateLimit } from "../lib/rateLimit";
import { parseInput } from "../lib/validation";
import { clientIp } from "../lib/clientIp";

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const getProposalsForChoice = onCall({ maxInstances: 10, enforceAppCheck: true }, async (request) => {
  requireAppCheck(request);

  const { haikuId, callerUuid } = parseInput(
    getProposalsForChoiceInputSchema,
    request.data
  );

  const ip = clientIp(request);
  await enforceRateLimit("getProposalsForChoice", ip, callerUuid);

  const haikuSnap = await db.collection(COLLECTIONS.haikus).doc(haikuId).get();

  if (!haikuSnap.exists) {
    throw new HttpsError("not-found", "Haiku not found.");
  }

  const haiku = haikuSnap.data()!;
  const status: string = haiku.status;

  if (haiku.initiatorId !== callerUuid) {
    throw new HttpsError(
      "permission-denied",
      "Only the initiator can view proposals."
    );
  }

  if (status !== "awaiting_choice_2" && status !== "awaiting_choice_3") {
    throw new HttpsError(
      "failed-precondition",
      "Proposals are only available during the choice phase."
    );
  }

  const proposalsSnap = await db
    .collection(COLLECTIONS.haikus)
    .doc(haikuId)
    .collection(COLLECTIONS.proposals)
    .get();

  const proposals = proposalsSnap.docs.map((doc) => {
    const data = doc.data();
    // Strip authorId before returning to client
    return {
      id: doc.id,
      text: data.text as string,
      forLine: data.forLine as 2 | 3,
      createdAt: data.createdAt,
    };
  });

  shuffle(proposals);

  logger.info("getProposalsForChoice: proposals fetched", {
    haikuId,
    count: proposals.length,
    callerUuid: callerUuid.slice(0, 8),
  });

  return { proposals };
});
