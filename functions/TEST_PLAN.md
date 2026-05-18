# ChainKu Functions — Manual Test Plan

All tests run against the Firebase Emulator Suite. Start it with `pnpm emulators` from the repo root.

Use a small Node.js script or the Firebase Functions shell to call callable functions. The examples below use the Firebase JS SDK (client-side) from a browser console on `http://localhost:3000`, or from a Node script that initialises the client SDK pointed at the emulator.

**Emulator setup reminder:**
- Firestore emulator: `localhost:8080`
- Functions emulator: `localhost:5001`
- Set `NEXT_PUBLIC_USE_EMULATOR=true` in `apps/web/.env.local` when testing from the web app.
- Pass `turnstileToken: "EMULATOR_BYPASS"` in all callable payloads to skip Turnstile.
- App Check is skipped automatically when `FUNCTIONS_EMULATOR=true`.

**UUID convention for tests:**
- Initiator UUID: `aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa`
- Proposer UUID:  `bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb`
- Other proposer: `cccccccc-cccc-4ccc-cccc-cccccccccccc`

---

## 1. `createHaiku`

**Happy path**
1. Call `createHaiku` with `{ line1Text: "old pond", turnstileToken: "EMULATOR_BYPASS", callerUuid: "<initiator-uuid>" }`.
2. Expect a response `{ haikuId: "<id>" }`.
3. In the Firestore emulator UI (`localhost:4000`), verify the `haikus/<id>` document:
   - `status === "awaiting_line_2"`
   - `initiatorId` matches the UUID
   - `line1.text === "old pond"`
   - `currentDeadline` ≈ now + 24 h
   - `proposalCount === 0`
   - `line2 === null`, `line3 === null`, `completedAt === null`

**Validation errors**
- Empty `line1Text` → `invalid-argument`
- `line1Text` longer than 100 characters → `invalid-argument`
- Missing `turnstileToken` → `invalid-argument`
- Invalid UUID (`callerUuid: "not-a-uuid"`) → `invalid-argument`

**Rate limit**
- Call `createHaiku` 6 times with the same UUID within the same hour.
- The 6th call must return `resource-exhausted`.

---

## 2. `submitProposal`

**Happy path**
1. Create a haiku (step 1 above). Note the `haikuId`.
2. Call `submitProposal` with `{ haikuId, text: "a frog jumps in", turnstileToken: "EMULATOR_BYPASS", callerUuid: "<proposer-uuid>" }`.
3. Verify in Firestore: a document exists under `haikus/<id>/proposals/<proposalId>` with `forLine: 2`, and `haikus/<id>.proposalCount === 1`.

**Initiator cannot propose**
- Call `submitProposal` with the initiator's UUID → `permission-denied`.

**One proposal per user per line**
- Submit a proposal as proposer B. Submit again as proposer B → `already-exists`.

**Wrong state**
- Manually set the haiku to `awaiting_choice_2` in the Firestore emulator UI, then try to submit → `failed-precondition`.

**Early close at max proposals**
1. Create a fresh haiku.
2. Submit 10 proposals from 10 different UUIDs (vary the last hex digit of the proposer UUID template).
3. After the 10th proposal, verify `haikus/<id>.status === "awaiting_choice_2"` and `currentDeadline` ≈ now + 24 h (choice window).
4. An 11th attempt (new UUID) should return `failed-precondition` (window closed).

**Validation errors**
- `text` longer than 120 chars → `invalid-argument`
- Non-existent `haikuId` → `not-found`

---

## 3. `getProposalsForChoice`

**Happy path**
1. Create a haiku and submit at least 2 proposals from different UUIDs.
2. Manually advance the haiku to `awaiting_choice_2` in the Firestore emulator UI (or wait for `processTimeouts`).
3. Call `getProposalsForChoice` with `{ haikuId, callerUuid: "<initiator-uuid>" }`.
4. Verify the response contains a `proposals` array with the correct texts.
5. Verify `authorId` is NOT present in any returned proposal object.
6. Call the function multiple times and verify the order varies (shuffle is probabilistic; test with ≥ 3 proposals for confidence).

**Non-initiator is rejected**
- Call with `callerUuid: "<proposer-uuid>"` → `permission-denied`.

**Wrong state**
- Call when haiku is in `awaiting_line_2` → `failed-precondition`.

**Rate limit**
- Call 61 times within the same hour → `resource-exhausted` on the 61st call.

---

## 4. `chooseProposal`

**Happy path**
1. Create a haiku, submit 2+ proposals, advance to `awaiting_choice_2`.
2. Call `getProposalsForChoice` to get a proposal ID.
3. Call `chooseProposal` with `{ haikuId, proposalId: "<id>", callerUuid: "<initiator-uuid>" }`.
4. Verify:
   - `haikus/<id>.status === "awaiting_line_3"`
   - `haikus/<id>.line2.text` matches the chosen proposal
   - `haikus/<id>.line2.chosenBy === "initiator"`
   - `haikus/<id>.proposalCount === 0`
   - `haikus/<id>.currentDeadline` ≈ now + 24 h (new proposal window)
   - `haikus/<id>/proposals` subcollection is empty

**Complete the haiku (line 3 choice)**
1. Submit proposals for line 3 and advance to `awaiting_choice_3`.
2. Choose a proposal as the initiator.
3. Verify:
   - `status === "completed"`
   - `line3.chosenBy === "initiator"`
   - `completedAt` is set
   - Proposals subcollection is empty

**Non-initiator is rejected**
- Call with a non-initiator UUID → `permission-denied`.

**Invalid proposal ID**
- Call with a made-up `proposalId` → `not-found`.

**Wrong state**
- Call when haiku is in `awaiting_line_2` → `failed-precondition`.

---

## 5. `processTimeouts`

The scheduled function runs every 5 minutes in production. In the emulator, trigger it manually from the Firebase Functions shell:

```
firebase functions:shell
> processTimeouts.run({}, () => {})
```

Or wait for the emulator's built-in scheduler to fire.

**Case A: Proposal window expires, 0 proposals**
1. Create a haiku.
2. In the Firestore emulator, manually set `currentDeadline` to a past timestamp (e.g., one second ago).
3. Trigger `processTimeouts`.
4. Verify the `haikus/<id>` document no longer exists.

**Case B: Proposal window expires, ≥1 proposals**
1. Create a haiku, submit 1–2 proposals.
2. Set `currentDeadline` to a past timestamp.
3. Trigger `processTimeouts`.
4. Verify `status === "awaiting_choice_2"` and `currentDeadline` ≈ now + 24 h.
5. Proposals subcollection should still exist (needed for choice).

**Case C: Choice window expires (auto-pick)**
1. Create a haiku in `awaiting_choice_2` with at least 2 proposals.
2. Set `currentDeadline` to a past timestamp.
3. Trigger `processTimeouts`.
4. Verify:
   - `status === "awaiting_line_3"`
   - `line2` is promoted with `chosenBy === "random"`
   - Proposals subcollection is empty
5. Repeat for `awaiting_choice_3` → `completed`.

**Idempotency**
- Trigger `processTimeouts` twice in quick succession on the same overdue haiku.
- The second run must be a no-op (haiku already transitioned; re-check guard in transaction fires).

**Completed haiku are not re-processed**
- Create a completed haiku.
- Trigger `processTimeouts`.
- Verify the document is unchanged (status still `completed`).

---

## 6. `onProposalCreated`

This trigger is logging-only.

1. Submit a proposal (any happy-path flow from test 2 above).
2. Check the Functions emulator log output.
3. Verify a log line appears with `haikuId`, `proposalId`, and `forLine`.

No error cases to test — the trigger never throws.

---

## End-to-end smoke test

Run this full flow to verify all functions interact correctly:

1. **Create**: `createHaiku` → get `haikuId`
2. **Propose line 2 (×2)**: `submitProposal` from two different UUIDs
3. **Expire window**: manually set `currentDeadline` to past → trigger `processTimeouts` → verify `awaiting_choice_2`
4. **Fetch proposals**: `getProposalsForChoice` as initiator → note proposal IDs
5. **Choose**: `chooseProposal` → verify `awaiting_line_3`, `line2` set
6. **Propose line 3 (×1)**: `submitProposal` from a third UUID
7. **Expire + auto-pick**: set `currentDeadline` to past → trigger `processTimeouts` → verify `completed`, `line3.chosenBy === "random"`
8. **Archive**: query Firestore `haikus` where `status === "completed"` — the haiku should appear
