import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// v2 required: v1 Firestore triggers don't support multi-region databases (eur3).
// Note: Eventarc registration may fail in the local emulator (firebase-tools#2633)
// — keep this export commented out during local development.
export const onProposalCreated = onDocumentCreated(
  "haikus/{haikuId}/proposals/{proposalId}",
  (event) => {
    const data = event.data?.data();
    logger.info("onProposalCreated", {
      haikuId: event.params.haikuId,
      proposalId: event.params.proposalId,
      forLine: data?.forLine,
    });
  }
);
