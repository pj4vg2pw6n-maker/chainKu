import { firestore } from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";

// v1 trigger avoids Eventarc registration, which fails in the local emulator.
// Logging-only per SPEC §4.5.5 — no v2-specific features needed.
export const onProposalCreated = firestore
  .document("haikus/{haikuId}/proposals/{proposalId}")
  .onCreate((snapshot, context) => {
    const data = snapshot.data();
    logger.info("onProposalCreated", {
      haikuId: context.params.haikuId,
      proposalId: context.params.proposalId,
      forLine: data?.forLine,
    });
  });
