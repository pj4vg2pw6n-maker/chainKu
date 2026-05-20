# ChainKu — Rough edges and known issues

## Emulator

**Lingering Firestore Java process (most common issue)**
If you kill the emulators with Ctrl+C and restart them, the Java process for the
Firestore emulator sometimes lingers on port 8080. The new Firestore emulator fails
to start silently, and Cloud Functions hang at any Firestore operation.

Fix before starting the emulators:
```
pkill -f 'cloud-firestore-emulator'
# or to kill all firebase processes:
pkill -f firebase
```

**onProposalCreated trigger is disabled locally**
The Firestore trigger registration fails with HTTP 503 in the emulator when the
host is bound to 0.0.0.0 (firebase/firebase-tools#2633). It is commented out in
`functions/src/index.ts`. The trigger is logging-only (SPEC §4.5.5) and has no
side-effects. Re-enable it before deploying to production by uncommenting the
export.

## Dynamic routes (static export)

`/haiku/[id]` and `/haiku/[id]/propose` use `generateStaticParams` returning
`[{ id: '_' }]`. This satisfies Next.js 14's requirement that static exports
declare at least one prerendered path for dynamic routes. Firebase Hosting's
SPA rewrite (`** → /index.html`) serves all real haiku IDs at runtime.

## Firestore `in` query ordering

The "In progress" tab queries `WHERE status IN [...] ORDER BY updatedAt DESC`.
Firestore may return results ordered per status-value bucket rather than globally
by `updatedAt` when using the `in` operator with `orderBy` on a different field.
`useHaikuList.ts` sorts results client-side after fetching as a safety net.

## emulator testing flow

1. `pnpm emulators` — starts Functions + Firestore + Hosting emulators
2. `pnpm dev` — starts Next.js dev server (separate terminal)
3. Open http://localhost:3000
4. `NEXT_PUBLIC_USE_EMULATOR=true` is set in `apps/web/.env.local` — Turnstile
   is bypassed and the client SDK points at localhost emulators.

## Before production launch checklist

- Replace placeholder emails in `/contact` and `/privacy` pages.
- Set `TURNSTILE_SECRET_KEY` secret via `firebase functions:secrets:set`.
- Configure Firebase App Check (reCAPTCHA Enterprise) in the Firebase Console.
- Re-enable `onProposalCreated` trigger in `functions/src/index.ts`.
- Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in hosting environment / CI.
- Create the `config/global` document in Firestore with production config values.
