export const CONFIG_DEFAULTS = {
  proposalWindowHours: 24,
  choiceWindowHours: 24,
  maxProposalsPerLine: 10,
  maxLine1Length: 100,
  maxLine23Length: 120,
  enabledLanguages: ["en"],
} as const;

export const HAIKU_STATUSES = [
  "awaiting_line_2",
  "awaiting_choice_2",
  "awaiting_line_3",
  "awaiting_choice_3",
  "completed",
] as const;

export const IN_PROGRESS_STATUSES: readonly string[] = [
  "awaiting_line_2",
  "awaiting_choice_2",
  "awaiting_line_3",
  "awaiting_choice_3",
];

export const LOCAL_STORAGE_KEYS = {
  uuid: "chainku.uuid",
  onboardingDismissed: "chainku.onboardingDismissed",
  syllableCounterEnabled: "chainku.syllableCounterEnabled",
  proposals: "chainku.proposals",
} as const;
