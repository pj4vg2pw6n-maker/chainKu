# ChainKu — Claude Code Prompts

This file contains a sequence of prompts to feed into Claude Code, in order. Each prompt corresponds to one phase of building the ChainKu MVP. They reference `SPEC.md` as the source of truth.

## How to use this

1. Create a new directory on your machine for the ChainKu project.
2. Place `SPEC.md` in that directory.
3. Open Claude Code in that directory.
4. **Run prompts one at a time, in order.** Wait for each phase to complete before moving on.
5. After each phase, **review the changes**, test them, and commit to git before proceeding.
6. If something looks wrong, fix it (or ask Claude Code to fix it) before moving to the next prompt.

**Important:** between phases, commit your work to git. This gives you safe rollback points if a later prompt creates problems.

---

## Prompt 0 — Onboarding (run first, every new session)

Use this short prompt to brief Claude Code at the start of any new session, after Phase 1 has set up the repo:

```
Please read SPEC.md and CLAUDE.md before doing anything else. SPEC.md is the source of truth for the ChainKu product. Always refer back to it for product behavior, data shapes, and architecture decisions. If you find ambiguities or contradictions, ask before assuming. Do not invent features that are not in SPEC.md.
```

---

## Phase 1 — Project setup and scaffolding

```
I'm starting a new project called ChainKu. The full specification is in SPEC.md in the current directory. Please read it carefully before starting.

For this phase, please set up the project skeleton:

1. Initialize a pnpm monorepo at the structure described in section 4.2 of SPEC.md, with workspaces for apps/web, functions, and packages/shared.

2. In apps/web, scaffold a Next.js 14 project (App Router, TypeScript, Tailwind CSS, ESLint). Configure next.config for static export (output: 'export'). Add Newsreader and Inter via next/font. Configure Tailwind with the palette from SPEC.md section 3.1 (white background, deep green #2D5F4E accent, etc.) as custom theme values.

3. In functions, initialize a Firebase Functions v2 project with TypeScript and Node.js 20.

4. In packages/shared, create a TypeScript package that exports types and constants. For now, define the HaikuStatus type and a Haiku type matching SPEC.md section 4.3, plus the config defaults from section 2.2.

5. At the repo root, create:
   - firebase.json configured for hosting (apps/web/out), functions (functions), firestore (rules and indexes)
   - firestore.rules with deny-all-writes-from-client as a starting point (we'll refine in a later phase)
   - firestore.indexes.json with the indexes from SPEC.md section 4.4
   - .firebaserc with a placeholder project alias 'default' set to 'chainku'
   - A README.md that briefly describes the project and how to run it locally
   - A CLAUDE.md that tells future sessions to read SPEC.md as the source of truth

6. Add a basic "Hello ChainKu" placeholder page in the web app, just to verify the build pipeline works.

7. Add a .gitignore appropriate for Node, Next.js, Firebase, and pnpm.

Do not implement product features yet. Focus on correct setup, correct dependency versions, and a clean build. Verify locally that pnpm install, pnpm build (in web), and the functions TypeScript compile all succeed.

After you finish, summarize what you did and list any decisions or assumptions you had to make.
```

---

## Phase 2 — Firestore data model and security rules

```
Please re-read SPEC.md, especially sections 4.3 (data model), 4.4 (indexes), and 4.6 (security model).

For this phase:

1. In packages/shared, complete all type definitions and exports for the Firestore data model: Haiku, Proposal, RateLimit, GlobalConfig, plus the HaikuStatus enum/union. Add Zod schemas for runtime validation of inputs (line text length, etc.) using the constants from SPEC.md section 2.2. Export everything cleanly.

2. Write firestore.rules that implement the security model in section 4.6:
   - Reads on haikus collection: allowed.
   - Reads on config/global: allowed.
   - Reads on haikus/{haikuId}/proposals: denied (only Functions read these).
   - All writes to all collections: denied (only Functions write).
   - rate_limits: no client access.

3. Update firestore.indexes.json with the composite indexes from SPEC.md section 4.4.

4. In functions/src, set up the project skeleton:
   - A shared admin SDK initialization module.
   - A constants module that reads from packages/shared.
   - A validation utility module that uses the Zod schemas from packages/shared.
   - A rate-limiting utility (function that takes IP and UUID, increments the appropriate rate_limits doc, returns true/false).
   - A Turnstile verification utility (calls Cloudflare's siteverify endpoint with the secret).
   - An App Check enforcement utility.

5. Set up Firebase Emulator Suite configuration in firebase.json for local development (Firestore + Functions emulators).

6. Add an npm script at the root for running emulators: `pnpm emulators`.

Do not yet implement the callable functions or the scheduled function. Just the foundations and utilities.

After you finish, summarize and flag any open questions.
```

---

## Phase 3 — Cloud Functions: callables and scheduler

```
Please re-read SPEC.md, sections 4.5 and 4.7 (Cloud Functions list).

Implement all six Cloud Functions:

1. createHaiku (callable): see SPEC.md 4.5.1.
2. submitProposal (callable): see 4.5.2. Note the early-close logic at maxProposalsPerLine.
3. chooseProposal (callable): see 4.5.3.
4. getProposalsForChoice (callable): a new function (mentioned in 4.6) that returns proposals for the initiator. Verify the caller's UUID matches initiatorId, verify the haiku is in awaiting_choice_*, return proposals (anonymized: strip authorId before returning), in randomized order.
5. processTimeouts (scheduled, every 5 minutes): see 4.5.4. Be careful with transactions and idempotency.
6. onProposalCreated (Firestore trigger): logging only, see 4.5.5.

For each function:
- Apply App Check enforcement (where applicable).
- Apply Turnstile verification (where applicable, see SPEC.md 4.6).
- Apply rate limiting (see SPEC.md 4.6 for limits).
- Validate input with Zod schemas from packages/shared.
- Use Firestore transactions where state changes depend on current state.
- Emit clear error codes (functions HttpsError) for client-friendly handling.
- Add structured logging (use functions.logger).

Write each function in its own file under functions/src/callable/ or functions/src/scheduled/, with a single index.ts that exports all of them.

After you finish, write a short test plan in functions/TEST_PLAN.md describing how to manually test each function via the Emulator Suite. Do not write automated tests in this phase.
```

---

## Phase 4 — Frontend foundation: layout, theming, shared components

```
Please re-read SPEC.md sections 3 (UI/Screens) and 4.8 (client data fetching).

For this phase, set up the frontend foundation but no full screens yet:

1. Configure TanStack Query at the app root with staleTime 60s and refetchOnWindowFocus true.

2. Set up Firebase JS SDK v10 client initialization (apps/web/src/lib/firebase.ts), reading config from environment variables. Include emulator connection logic when NEXT_PUBLIC_USE_EMULATOR is set.

3. Implement the anonymous UUID system: on first load, generate a UUID v4 and store in localStorage under a clear key (e.g., 'chainku.uuid'). Expose via a React hook useAnonymousId().

4. Implement the onboarding strip dismissal: hook useOnboardingDismissed() that reads/writes localStorage key 'chainku.onboardingDismissed'.

5. Build the global layout (app/layout.tsx):
   - Import Inter and Newsreader via next/font.
   - Apply Tailwind base styles.
   - Render header (just the wordmark + glyph for now, see SPEC.md 3.2) and footer (privacy policy link, contact link).
   - Onboarding strip rendered conditionally on home only (see 3.4.1).

6. Build the logo component (components/Logo.tsx): wordmark "ChainKu" in Inter Semibold + three connected circles SVG. Try the asymmetric variant (slightly different sizes) as suggested in SPEC.md 3.2; if it looks worse than uniform circles, fall back to uniform.

7. Build a small library of base UI primitives in components/ui/:
   - Button (primary, secondary, ghost variants)
   - Input (single-line and multi-line)
   - Card (used for haiku display)
   - Tabs (for home navigation)
   - FloatingActionButton

   Keep them minimal, consistent with SPEC.md 3.1. Tailwind only, no extra UI library.

8. Build a HaikuLines component (components/HaikuLines.tsx) that renders 1, 2, or 3 lines of an haiku in Newsreader, with missing lines shown as subtle dashes. This will be used everywhere haiku are displayed.

9. Build a SyllableCounter component (components/SyllableCounter.tsx) using the `syllable` npm package. Toggleable, preference in localStorage.

10. Build a CountdownLabel component that turns a Timestamp into a human-friendly "closes in 14h" string (see SPEC.md 3.4.2).

Do not implement the full pages yet (home, detail, create, propose). Just the foundation and the reusable components.

After you finish, ensure the homepage at "/" renders the layout, header, footer, and a placeholder. Verify in dev mode (pnpm dev in apps/web).
```

---

## Phase 5 — Frontend screens: create, propose, choose

```
Please re-read SPEC.md sections 3.4.4, 3.4.5, 3.4.6 (the writing flows).

Implement the three writing-related screens:

1. /create — Create new haiku page (SPEC.md 3.4.4):
   - Form with line 1 input, syllable counter (target 5), submit button.
   - Submit calls createHaiku callable. Handle Turnstile token (use @marsidev/react-turnstile, invisible mode).
   - Handle errors clearly (rate limit, validation).
   - On success, redirect to /haiku/[id].

2. /haiku/[id]/propose — Propose a line page (SPEC.md 3.4.5):
   - Reachable only when haiku is in awaiting_line_2 or awaiting_line_3 and the user is not the initiator and has not already proposed.
   - Show previous canonical lines at top, dimmed.
   - Form with the proposal input, syllable counter (target 7 for line 2, 5 for line 3).
   - Submit calls submitProposal.
   - On success, redirect back to /haiku/[id].
   - Handle the case where the user has already proposed (redirect with a toast/notice).

3. The choice flow (no separate route — rendered conditionally inside /haiku/[id] when applicable, SPEC.md 3.4.6):
   - When the current user is the initiator and the haiku is in awaiting_choice_2/3, fetch proposals via getProposalsForChoice callable.
   - Render proposals as tappable cards in randomized order (already randomized server-side, but verify).
   - Confirm button calls chooseProposal.
   - On success, refetch the haiku and re-render.

For Turnstile:
- Add NEXT_PUBLIC_TURNSTILE_SITE_KEY environment variable.
- Use invisible Turnstile, only on createHaiku and submitProposal forms.

Do not yet build the home and archive lists, or the detail page in its full glory — but do build a minimal /haiku/[id] page that displays the haiku and conditionally renders the choice UI when applicable. The minimal version is fine for this phase; we'll polish in the next phase.

After you finish, manually test in the emulator: create a haiku, switch UUIDs (clear localStorage in another browser), propose line 2, switch back to initiator UUID, choose, and verify state advances correctly.
```

---

## Phase 6 — Frontend screens: home, archive, detail polish

```
Please re-read SPEC.md sections 3.4.2 (home) and 3.4.3 (haiku detail).

Implement the remaining screens and polish:

1. / — Home page (SPEC.md 3.4.2):
   - Two tabs: "In progress" (default) and "Archive".
   - In progress tab: query haiku where status is in [awaiting_line_2, awaiting_choice_2, awaiting_line_3, awaiting_choice_3], ordered by updatedAt DESC. Render as cards using HaikuLines.
   - Archive tab: query haiku where status === 'completed', ordered by completedAt DESC. Render as fuller cards.
   - Empty states (see SPEC.md 3.4.2): friendly invitation if list is empty.
   - Floating action button to /create.
   - Onboarding strip rendered if not yet dismissed.

2. /haiku/[id] — Polished detail page (SPEC.md 3.4.3):
   - Top: canonical lines (HaikuLines, large variant).
   - Bottom: action area, depending on state and viewer role. Use the table in SPEC.md 3.4.3 to drive the conditional rendering.
   - Include a "Copy link" button when haiku is completed.
   - For the choice UI, integrate what was built in Phase 5.

3. /privacy — Privacy policy page (SPEC.md 3.4.8): a simple markdown-rendered page describing cookies (UUID, onboarding flag), Turnstile, IP-based rate limiting. Plain prose, no fancy formatting.

4. /contact — Minimal contact page with an email address (placeholder for now, fill in real one before launch).

5. Polish:
   - Loading states (skeletons or simple spinners).
   - Error boundaries with retry.
   - 404 page.
   - Make sure all interactive elements have visible focus rings using the accent color.
   - Verify mobile responsiveness throughout.

Do a final walk-through of all flows in the emulator. Document any rough edges in a NOTES.md file at the repo root.
```

---

## Phase 7 — Deployment, App Check, secrets, GitHub Actions

```
Please re-read SPEC.md sections 4.6 (security) and 4.9 (deployment).

For this phase:

1. Set up Firebase App Check:
   - Configure reCAPTCHA Enterprise as the App Check provider.
   - Enforce App Check on all callable functions.
   - Configure the client SDK to attach App Check tokens.
   - Document the steps required in the Firebase Console (since some setup is manual) in a DEPLOYMENT.md.

2. Configure secrets:
   - Document how to set TURNSTILE_SECRET_KEY using `firebase functions:secrets:set`.
   - Update Cloud Functions to read this secret.
   - Add NEXT_PUBLIC_TURNSTILE_SITE_KEY and Firebase config to a .env.example.

3. Set up GitHub Actions:
   - On PR: lint, typecheck, build (no deploy).
   - On push to main: lint, typecheck, build, deploy hosting + functions + rules + indexes.
   - Use Firebase service account key stored as GitHub secret.
   - Document setup steps in DEPLOYMENT.md.

4. Verify deployment to a real Firebase project (the user will need to create the 'chainku' project manually first; document this).

5. Performance pass: run Lighthouse on home and detail pages, aim for ≥90 on performance. Address any obvious issues (image optimization, font loading, etc.).

6. Final security audit: try to write to Firestore directly from a browser console with the client SDK. It must fail. Try to call functions without App Check. It must fail. Document the audit in DEPLOYMENT.md.

After you finish, the project should be deployable end-to-end. Summarize what manual steps the user must do (Firebase project creation, App Check setup, secret setting, GitHub secrets) in a clear checklist.
```

---

## Phase 8 — Pre-launch QA and acceptance

```
Please re-read SPEC.md section 7 (acceptance criteria for v1.0 launch).

Run a final pre-launch QA:

1. Walk through every user flow described in SPEC.md section 3.4 and verify each works end-to-end in the deployed environment (or emulator if not yet deployed).

2. Verify each acceptance criterion in section 7. Document the result of each.

3. Identify any gaps between the spec and the implementation. List them clearly.

4. Suggest a minimal set of fixes to close any gaps.

5. Suggest no more than 5 small polish improvements that would noticeably improve the product without expanding scope.

Output a single QA_REPORT.md document at the repo root summarizing all of the above.

Do not make code changes in this phase — just audit and report. The user will decide which suggestions to act on.
```

---

## Notes on prompt usage

- **One phase per session is the safest pattern.** If you stay within one Claude Code session for too long, context can drift. Starting a new session per phase, with the Onboarding prompt at the top, is reliable.
- **Always commit between phases.** This is your safety net.
- **Don't be afraid to ask Claude Code to slow down.** If a prompt produces too much code at once, ask it to break the work into smaller steps.
- **Adjust as you go.** If you discover the spec needs to change (and it will), update SPEC.md *first*, then ask Claude Code to align the code with the updated SPEC.
- **The phases are sized to be reasonable but not trivial.** Phase 3 (Cloud Functions) and Phase 6 (frontend polish) are the biggest. Allow more time for those.
