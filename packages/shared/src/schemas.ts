import { z } from "zod";
import { CONFIG_DEFAULTS } from "./constants";

export const line1Schema = z
  .string()
  .min(1, "Line 1 cannot be empty.")
  .max(
    CONFIG_DEFAULTS.maxLine1Length,
    `Line 1 must be at most ${CONFIG_DEFAULTS.maxLine1Length} characters.`
  );

export const line23Schema = z
  .string()
  .min(1, "Line cannot be empty.")
  .max(
    CONFIG_DEFAULTS.maxLine23Length,
    `Line must be at most ${CONFIG_DEFAULTS.maxLine23Length} characters.`
  );

export const createHaikuInputSchema = z.object({
  line1Text: line1Schema,
  turnstileToken: z.string().min(1, "Turnstile token is required."),
});

export const submitProposalInputSchema = z.object({
  haikuId: z.string().min(1, "Haiku ID is required."),
  text: line23Schema,
  turnstileToken: z.string().min(1, "Turnstile token is required."),
});

export const chooseProposalInputSchema = z.object({
  haikuId: z.string().min(1, "Haiku ID is required."),
  proposalId: z.string().min(1, "Proposal ID is required."),
});

export const getProposalsForChoiceInputSchema = z.object({
  haikuId: z.string().min(1, "Haiku ID is required."),
});

export type CreateHaikuInput = z.infer<typeof createHaikuInputSchema>;
export type SubmitProposalInput = z.infer<typeof submitProposalInputSchema>;
export type ChooseProposalInput = z.infer<typeof chooseProposalInputSchema>;
export type GetProposalsForChoiceInput = z.infer<
  typeof getProposalsForChoiceInputSchema
>;
