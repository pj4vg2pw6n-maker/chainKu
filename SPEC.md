# ChainKu — Product & Technical Specification

**Version:** 1.0 (MVP)
**Status:** Pre-development
**Last updated:** 2026-05-06

This document is the single source of truth for the ChainKu MVP. It describes what the product is, how it behaves, and how it is built. Anything not covered here is out of scope for v1.0.

---

## 1. Product overview

ChainKu is a web app for collaborative haiku writing. Each haiku has three lines, each written by a different person:

1. An **initiator** writes line 1 and starts a new haiku.
2. Anyone can **propose** line 2 within a 24-hour window.
3. The initiator **chooses** one proposal within a 24-hour window.
4. The same flow repeats for line 3.
5. Completed haiku move to a public archive.

No accounts. No identity. The product is built around the text, not the authors.

### 1.1 Design ethos

- **Minimalist contemporary**: clean, modern, neutral. The content is poetic; the UI is not.
- **Anonymity is a feature**: text is judged on its merits.
- **No social mechanics in v1**: no likes, no follows, no comments, no notifications.
- **Friction-free participation**: anyone can read and contribute without signing up.

### 1.2 Out of scope for v1.0

The following are explicitly deferred to later versions:

- User accounts and authentication
- Notifications (push or email)
- Dark mode
- Multilingual content (English only in v1.0)
- Voting/liking on completed haiku
- Orphan fragments (lines without proposals are silently deleted)
- Editing or withdrawing submitted proposals
- Polling/real-time updates (refresh on focus only)
- Sub-filters on the home feed
- Search
- Themes, kigo, weekly prompts
- Renku (longer collaborative chains)
- Export, social sharing beyond "copy link"
- TTS, audio, image generation
- Comments
- Aggregate statistics

---

## 2. Core mechanics

### 2.1 Haiku states

A haiku document moves through these states:

| State | Description | Next transition |
|---|---|---|
| `awaiting_line_2` | Collecting line 2 proposals | After 24h or 10 proposals → `awaiting_choice_2` (if ≥1 proposal) or **delete** (if 0) |
| `awaiting_choice_2` | Initiator chooses line 2 | After 24h → auto-pick random proposal → `awaiting_line_3` |
| `awaiting_line_3` | Collecting line 3 proposals | After 24h or 10 proposals → `awaiting_choice_3` (if ≥1) or **delete** (if 0) |
| `awaiting_choice_3` | Initiator chooses line 3 | After 24h → auto-pick random → `completed` |
| `completed` | Final haiku, in archive | terminal |

Note: in v1.0, haiku that lose all proposals during a window are **silently deleted** (no orphan fragments section). This means a partially-written haiku can disappear without notice. Acceptable for MVP.

### 2.2 Timing parameters

All configurable via `config/global` document in Firestore.

- Proposal window: **24 hours**
- Choice window: **24 hours**
- Max proposals per line: **10** (window closes early if reached)
- Max line 1 length: **100 characters**
- Max line 2/3 length: **120 characters**

### 2.3 Proposals

- Anyone can submit one proposal per line per haiku.
- Proposals are **anonymous** to everyone, including other proposers.
- A proposer cannot withdraw or modify their proposal once submitted (v1.0 simplification).
- A proposer cannot see other proposals or their count.
- After the proposal window closes, all proposals (except the chosen one) are deleted to save storage.

### 2.4 Choice

- Only the initiator (matched by anonymous UUID) sees the proposals.
- Proposals are shown in **randomized order** to avoid first-mover bias.
- The initiator selects one and confirms.
- If the initiator does not choose within 24h, the system picks one at random.
- The chosen proposal is "promoted" to `line2` or `line3` on the haiku document, and `chosenBy` records whether it was chosen by the initiator or randomly.

### 2.5 Identity (anonymous)

- On first visit, the client generates a **UUID v4** stored in `localStorage`.
- This UUID is used to:
  - Identify the initiator of a haiku
  - Enforce "one proposal per user per line"
  - Distinguish "your proposal" from others in your own UI
- The UUID is **never shown publicly** and is not associated with any personal data.
- Clearing localStorage resets identity (acceptable trade-off).

### 2.6 Syllable counter (English only)

- An optional, **non-blocking** indicator below the input shows estimated syllable count.
- Target: 5 / 7 / 5 (orientative, not enforced).
- Toggleable; preference stored in localStorage.
- Use a small library like `syllable` (npm) for English estimation.

---

## 3. UI / Screens

### 3.1 Visual identity

- **Palette**:
  - Background: `#FFFFFF`
  - Primary text: `#111111`
  - Secondary text/UI: greys (`#6B7280`, `#9CA3AF`, `#E5E7EB`)
  - Accent: `#2D5F4E` (deep green) — used for CTAs, links, focus, active states
  - Errors: discreet red; warnings: amber; success: lighter green variant
- **Typography**:
  - UI: **Inter** (400, 500, 600, 700)
  - Haiku text: **Newsreader** (400, italic 400, 500)
  - Both via `next/font` for performance.
- **Spacing**: Tailwind default scale, generous whitespace.
- **Components**: 1px borders, very light shadows, 8px radius for cards/buttons, 4px for inputs.
- **Animations**: fade 150ms, slide 200ms. Nothing bouncy.
- **Light mode only** in v1.0.

### 3.2 Logo

- Wordmark "ChainKu" in Inter Semibold or Bold.
- Glyph: three connected circles (○─○─○) preceding the wordmark, inline SVG.
- Optional asymmetric variant: circles of slightly different sizes evoking the 5-7-5 structure.
- Monochromatic (black on white; accent green on white for variants).

### 3.3 Naming conventions

- Brand/UI: `ChainKu` (CamelCase).
- URLs/handles: `chainku` (lowercase).
- Always written `ChainKu` in prose, even at sentence start.

### 3.4 Screens

#### 3.4.1 First visit / onboarding strip

- On first load, show a dismissible strip at the top of the home: *"ChainKu is a place to write haiku together. Three lines, three people."*
- "Got it" button dismisses; preference stored in localStorage.
- Never shown again on the same device.

#### 3.4.2 Home

- Two top tabs: **In progress** (default) / **Archive**.
- **In progress**: vertical list of haiku cards, one per row, generous spacing.
  - Each card shows: existing canonical lines (Newsreader, missing lines as subtle dashes), and a small metadata line in Inter (e.g., "Awaiting line 2 · closes in 14h").
  - Tap → detail page.
  - Sort: most recent activity first.
- **Archive**: vertical list of completed haiku, fuller layout.
  - Sort: most recent first (no other sort options in v1.0).
- **Floating action button** (bottom-right): "+" to create a new haiku.
- **Empty state**: friendly invitation to start the first haiku.

#### 3.4.3 Haiku detail

Layout depends on state and viewer role:

- **Top section**: canonical lines (Newsreader, large, well-spaced). Missing lines shown as subtle dashes.
- **Bottom section**: the action available now.

States and what each viewer sees:

| Haiku state | Initiator sees | Other (no proposal) sees | Other (already proposed) sees |
|---|---|---|---|
| `awaiting_line_2/3` | "Collecting proposals · closes in Xh" | Input to propose + submit | "Your proposal has been submitted. Result visible after window closes." |
| `awaiting_choice_2/3` | List of proposals (anonymous, shuffled), tap to select, confirm button | "The initiator is choosing · Xh remaining" | "The initiator is choosing · Xh remaining" |
| `completed` | Full haiku displayed | Same | Same |

- **Copy link** button on completed haiku.

#### 3.4.4 Create new haiku

- Single screen, focused on writing.
- Title: "Start a new haiku."
- Single text input for line 1, Newsreader, large.
- Optional syllable counter toggle, target ~5.
- Helper text: "Lines 2 and 3 will be proposed by others. You will choose."
- Submit button (with invisible Turnstile).
- After submit: confirmation, redirect to detail page.

#### 3.4.5 Propose a line

- Previous line(s) shown at top in Newsreader, dimmed (faded color).
- Input below for the proposal, Newsreader.
- Optional syllable counter, target ~7 (line 2) or ~5 (line 3).
- Submit (with invisible Turnstile).
- After submit: redirect to detail with confirmation message.

#### 3.4.6 Initiator choice

(Section of the haiku detail when state is `awaiting_choice_*` and viewer is initiator.)

- Canonical lines at top.
- Proposals listed below as tappable cards (anonymous, randomized order).
- Tap to select (visual highlight); tap another to change.
- "Confirm choice" button (disabled until one is selected).
- Helper: "Choose within Xh, or one will be picked at random."

#### 3.4.7 Footer

- Minimal, present on all pages.
- Two links: privacy policy, contact.
- No about page in v1.0.

#### 3.4.8 Privacy policy page

- Simple markdown-rendered page.
- Content: cookie usage (UUID for rate limiting), Turnstile, IP-based rate limiting, no personal data collected, no third-party tracking.
- Required for GDPR compliance even without accounts.

---

## 4. Architecture

### 4.1 Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS, TanStack Query, Firebase JS SDK v10.
- **Backend**: Firebase Cloud Functions v2 (latest Node.js LTS supported by Firebase Cloud Functions, TypeScript), Firestore (Native mode).
- **Security**: Firebase App Check (reCAPTCHA Enterprise), Cloudflare Turnstile, Firestore rules (deny-all client writes).
- **Hosting**: Firebase Hosting (Next.js static export, `output: 'export'`).
- **Scheduled jobs**: Cloud Scheduler.
- **Dev environment**: Firebase Emulator Suite (Firestore + Functions).

### 4.2 Repo structure (monorepo, pnpm workspaces)

```
chainku/
├── apps/
│   └── web/                    # Next.js
├── functions/                  # Cloud Functions
├── packages/
│   └── shared/                 # Shared types, constants, validators
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── .firebaserc
├── pnpm-workspace.yaml
├── package.json
├── README.md
├── CLAUDE.md                   # Claude Code context (points to SPEC.md)
└── SPEC.md                     # This document
```

### 4.3 Firestore data model

#### `haikus/{haikuId}`

```typescript
{
  id: string;                    // auto-generated
  status: HaikuStatus;           // see 2.1
  language: 'en';                // v1.0: always 'en'
  initiatorId: string;           // anonymous UUID
  
  line1: { text: string; authorId: string; createdAt: Timestamp; };
  line2: { text: string; authorId: string; chosenAt: Timestamp; chosenBy: 'initiator' | 'random'; } | null;
  line3: { text: string; authorId: string; chosenAt: Timestamp; chosenBy: 'initiator' | 'random'; } | null;
  
  currentDeadline: Timestamp;    // deadline of current state
  proposalCount: number;         // denormalized, current window only
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
}
```

#### `haikus/{haikuId}/proposals/{proposalId}` (subcollection)

```typescript
{
  id: string;
  text: string;
  authorId: string;              // anonymous UUID
  forLine: 2 | 3;
  createdAt: Timestamp;
}
```

After the choice window closes (or a proposal is chosen), all proposals in the subcollection are deleted.

#### `rate_limits/{key}`

```typescript
{
  key: string;                   // e.g., "ip_1.2.3.4_2026050614" or "uuid_abc123_2026050614"
  count: number;
  expiresAt: Timestamp;          // Firestore TTL deletes automatically
}
```

#### `config/global`

```typescript
{
  proposalWindowHours: number;   // default 24
  choiceWindowHours: number;     // default 24
  maxProposalsPerLine: number;   // default 10
  maxLine1Length: number;        // default 100
  maxLine23Length: number;       // default 120
  enabledLanguages: string[];    // default ['en']
}
```

Read once at app start, cached client-side.

### 4.4 Firestore indexes

Composite indexes required (declared in `firestore.indexes.json`):

- `haikus`: `status` ASC + `updatedAt` DESC (for "in progress, most recent activity")
- `haikus`: `status` ASC + `completedAt` DESC (for "archive, most recent")

### 4.5 Cloud Functions

#### Callable (HTTPS)

1. **`createHaiku(line1Text, turnstileToken)`**
   - Validate: length, content, Turnstile, App Check, rate limit (IP + UUID).
   - Create haiku document in `awaiting_line_2`.
   - Set `currentDeadline = now + 24h`.
   - Return haiku ID.

2. **`submitProposal(haikuId, text, turnstileToken)`**
   - Validate: haiku exists and is in `awaiting_line_*`, length, content, Turnstile, App Check, rate limit, "one per user per line".
   - Initiator cannot propose on their own haiku.
   - Create proposal in subcollection.
   - Increment `proposalCount` on haiku.
   - If `proposalCount === maxProposalsPerLine`, transition to `awaiting_choice_*` immediately (set new deadline).

3. **`chooseProposal(haikuId, proposalId)`**
   - Validate: caller UUID matches `initiatorId`, haiku is in `awaiting_choice_*`.
   - Promote proposal to `line2` or `line3` with `chosenBy: 'initiator'`.
   - Delete all proposals in subcollection.
   - Reset `proposalCount` to 0.
   - Transition state: `awaiting_choice_2` → `awaiting_line_3`, or `awaiting_choice_3` → `completed`.
   - Set new deadline (or `completedAt` if final).

#### Scheduled

4. **`processTimeouts`** — runs every 5 minutes.
   - Query haiku where `currentDeadline < now` and status is non-terminal.
   - For each, apply correct transition:
     - `awaiting_line_2/3` with 0 proposals → **delete the haiku** (and its subcollection).
     - `awaiting_line_2/3` with ≥1 proposals → transition to `awaiting_choice_*`, new deadline.
     - `awaiting_choice_2/3` → pick random proposal, promote with `chosenBy: 'random'`, transition to next state.
   - All operations in transactions for consistency.

#### Firestore triggers

5. **`onProposalCreated`** — triggers on `haikus/{haikuId}/proposals/{proposalId}` create.
   - Already incremented `proposalCount` in `submitProposal` (atomic), this trigger is for safety/observability. Keep minimal: log only.
   - The "early close at 10" logic lives in `submitProposal` for simplicity (single source of truth).

### 4.6 Security model

- **All client writes go through Cloud Functions.** Firestore rules deny all client writes directly.
- **Reads from clients are allowed** for: `haikus` (all), `config/global` (read-only). Everything else: denied.
- **Proposals subcollection**: client reads denied. Only Cloud Functions can read; Functions return appropriate slices to the client (e.g., `getProposalsForChoice` callable that checks initiator role).
  - **Note**: this means the initiator's choice screen needs a callable to fetch proposals. Add a function `getProposalsForChoice(haikuId)` or include in `chooseProposal` flow. To keep it simple, add as 6th callable.
- **App Check** required on all callables.
- **Turnstile** validated server-side in `createHaiku` and `submitProposal`.
- **Rate limits** (per IP and per UUID, sliding hourly window):
  - Max 5 new haiku per hour
  - Max 30 proposals per hour
  - Max 60 reads via callable per hour (for `getProposalsForChoice`)

### 4.7 Cloud Functions list (final)

1. `createHaiku` (callable)
2. `submitProposal` (callable)
3. `chooseProposal` (callable)
4. `getProposalsForChoice` (callable, initiator-only)
5. `processTimeouts` (scheduled, every 5 min)
6. `onProposalCreated` (Firestore trigger, logging only)

### 4.8 Client data fetching

- **TanStack Query** for all data fetching.
- `staleTime`: 60 seconds.
- `refetchOnWindowFocus`: true.
- No background polling in v1.0.
- Public lists (in-progress, archive): direct Firestore queries from client (reads allowed by rules).
- Initiator-only data (proposals for choice): callable to backend.

### 4.9 Deployment

- **Single Firebase project**: `chainku` (production from day one; local dev via Emulator Suite).
- **GitHub Actions**:
  - On PR: lint, typecheck, build (no deploy).
  - On push to `main`: lint, typecheck, build, deploy hosting + functions + rules.
- **Secrets** (Turnstile secret key, etc.) via `firebase functions:secrets:set`.

### 4.10 Performance and cost

- Firestore reads dominate cost. Mitigations:
  - Client-side caching via TanStack Query (60s staleTime).
  - Denormalized counters (`proposalCount`) avoid subcollection reads.
  - Static export of Next.js → no SSR cost.
- Free tier expected to cover all of MVP and early growth.

---

## 5. Privacy and compliance

- No personal data is collected.
- Anonymous UUID stored in localStorage; not transmitted as a user identifier.
- IP addresses used only for rate limiting; not stored beyond TTL of rate-limit documents.
- Turnstile is a privacy-friendly CAPTCHA (no cross-site tracking).
- Privacy policy page must clearly state all of the above.
- No cookies beyond essential (UUID, onboarding-dismissed flag).

---

## 6. Glossary

- **Initiator**: the anonymous user who created a haiku by writing line 1.
- **Proposal**: a candidate text for line 2 or line 3, submitted during a 24h window.
- **Choice window**: the 24h period during which the initiator selects from proposals.
- **Canonical line**: a line that has been promoted from proposal status to part of the haiku.
- **UUID**: anonymous client-side identifier in localStorage; not a user account.

---

## 7. Acceptance criteria for v1.0 launch

The MVP is ready to launch when:

- A new visitor can create a haiku in under 60 seconds without friction.
- A second visitor can propose line 2 within the same flow.
- The initiator can choose, and the haiku progresses correctly.
- Timeouts work end-to-end (random pick, deletion of empty haiku).
- The archive shows completed haiku.
- Rate limiting and Turnstile prevent obvious bot abuse.
- The site is responsive on mobile and desktop.
- A privacy policy is published.
- Lighthouse performance score ≥ 90 on home and detail pages.
- All Firestore rules are tested (no client write paths exist).
