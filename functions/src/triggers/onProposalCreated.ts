import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

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
