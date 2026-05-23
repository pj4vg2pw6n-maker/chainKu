import { setGlobalOptions } from "firebase-functions/v2";
setGlobalOptions({ region: "europe-west1" });

export * from "./callable/createHaiku";
export * from "./callable/submitProposal";
export * from "./callable/chooseProposal";
export * from "./callable/getProposalsForChoice";
export * from "./scheduled/processTimeouts";
// TODO: onProposalCreated (logging-only Firestore trigger) is disabled in local
// development because the Firestore trigger registration fails with HTTP 503 in
// the emulator when host is 0.0.0.0 (firebase/firebase-tools#2633). The trigger
// has no side-effects and is safe to re-enable directly in production by
// uncommenting the line below before deployment.
export * from "./triggers/onProposalCreated";
