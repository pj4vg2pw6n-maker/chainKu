export * from "@chainku/shared";

export const COLLECTIONS = {
  haikus: "haikus",
  proposals: "proposals",
  rateLimits: "rate_limits",
  config: "config",
} as const;

/** Per-hour limits applied per IP and per UUID independently. */
export const RATE_LIMIT_MAX = {
  createHaiku: 5,
  submitProposal: 30,
  getProposalsForChoice: 60,
  chooseProposal: 60,
} as const;

export type RateLimitAction = keyof typeof RATE_LIMIT_MAX;
