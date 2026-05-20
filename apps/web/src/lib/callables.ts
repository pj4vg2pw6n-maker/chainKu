import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

const EMULATOR_BYPASS = "EMULATOR_BYPASS";

function emulatorToken(raw: string): string {
  return process.env.NEXT_PUBLIC_USE_EMULATOR === "true" ? EMULATOR_BYPASS : raw;
}

export interface ProposalForChoice {
  id: string;
  text: string;
  forLine: 2 | 3;
}

export async function callCreateHaiku(args: {
  line1Text: string;
  turnstileToken: string;
  callerUuid: string;
}): Promise<{ haikuId: string }> {
  const fn = httpsCallable<typeof args, { haikuId: string }>(functions, "createHaiku");
  const result = await fn({ ...args, turnstileToken: emulatorToken(args.turnstileToken) });
  return result.data;
}

export async function callSubmitProposal(args: {
  haikuId: string;
  text: string;
  turnstileToken: string;
  callerUuid: string;
}): Promise<void> {
  const fn = httpsCallable(functions, "submitProposal");
  await fn({ ...args, turnstileToken: emulatorToken(args.turnstileToken) });
}

export async function callChooseProposal(args: {
  haikuId: string;
  proposalId: string;
  callerUuid: string;
}): Promise<void> {
  const fn = httpsCallable(functions, "chooseProposal");
  await fn(args);
}

export async function callGetProposalsForChoice(args: {
  haikuId: string;
  callerUuid: string;
}): Promise<ProposalForChoice[]> {
  const fn = httpsCallable<typeof args, { proposals: ProposalForChoice[] }>(
    functions,
    "getProposalsForChoice"
  );
  const result = await fn(args);
  return result.data.proposals;
}
