/** Minimal Timestamp interface satisfied by both firebase-admin and firebase client SDK */
export interface Timestamp {
  toDate(): Date;
  toMillis(): number;
  seconds: number;
  nanoseconds: number;
}

export type HaikuStatus =
  | "awaiting_line_2"
  | "awaiting_choice_2"
  | "awaiting_line_3"
  | "awaiting_choice_3"
  | "completed";

export interface CanonicalLine {
  text: string;
  chosenAt: Timestamp;
  chosenBy: "initiator" | "random";
}

export interface Haiku {
  id: string;
  status: HaikuStatus;
  language: "en";
  initiatorId: string;

  line1: {
    text: string;
    createdAt: Timestamp;
  };
  line2: CanonicalLine | null;
  line3: CanonicalLine | null;

  currentDeadline: Timestamp;
  proposalCount: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}

export interface Proposal {
  id: string;
  text: string;
  authorId: string;
  forLine: 2 | 3;
  createdAt: Timestamp;
}

export interface RateLimit {
  key: string;
  count: number;
  expiresAt: Timestamp;
}

export interface GlobalConfig {
  proposalWindowHours: number;
  choiceWindowHours: number;
  maxProposalsPerLine: number;
  maxLine1Length: number;
  maxLine23Length: number;
  enabledLanguages: string[];
}
