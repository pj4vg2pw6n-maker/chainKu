# ChainKu — Deployment Guide

This guide covers everything needed to take ChainKu from the repo to a live Firebase project.

---

## Prerequisites

- **Firebase CLI** ≥ 13: `npm install -g firebase-tools`
- **Node.js** 22
- **pnpm** 9: `npm install -g pnpm@9`
- **gcloud CLI** (optional, for Step 5a TTL setup): [install guide](https://cloud.google.com/sdk/docs/install) — the Firebase Console alternative is available if you prefer not to install it
- A **Google Cloud / Firebase account** with billing enabled (required for Cloud Functions, reCAPTCHA Enterprise, and Secrets Manager)
- A **Cloudflare account** for Turnstile

---

## Step 1 — Create the Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/) → **Add project**.
2. Project ID: **chainku** (must match `.firebaserc`).
3. Disable Google Analytics (optional for MVP).
4. Enable **Blaze (pay-as-you-go)** billing — required for Cloud Functions v2 and Secret Manager.
5. Navigate to **Firestore Database** → Create database → Start in **production mode** → choose a region (e.g. `us-central1`).
6. Enable the **Cloud Firestore API** and **Cloud Functions API** in Google Cloud Console if prompted.

### 1a. Register a web app and get SDK config

You need to register a web app within the Firebase project to obtain the `NEXT_PUBLIC_FIREBASE_*` config values used by the client SDK.

1. In Firebase Console → **Project settings** (gear icon) → **Your apps** → click **Add app** → choose **Web** (`</>`).
2. App nickname: **ChainKu** (display only).
3. Do **not** tick "Also set up Firebase Hosting" — hosting is deployed separately.
4. Click **Register app**.
5. Under **SDK setup and configuration**, choose **Config** and copy the values — you will need them in Step 6a:

```
apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId
```

> **Note on the Firebase API key:** The `apiKey` value is a public identifier — it is intentionally visible in the browser bundle. Firebase's security model relies on Firestore rules and App Check to protect data, not on keeping this key secret. It is safe (and expected) for it to appear in client-side code.

---

## Step 2 — Enable App Check with reCAPTCHA Enterprise

App Check protects all callable Cloud Functions from abuse.

### 2a. Enable reCAPTCHA Enterprise

1. In [Google Cloud Console](https://console.cloud.google.com/) (same project), navigate to **Security → reCAPTCHA Enterprise**.
2. Click **Enable API**.
3. Click **Create Key**.
   - Platform: **Web**
   - Key type: **Score-based (no challenge)**
   - Add your domains: `chainku.web.app`, `chainku.firebaseapp.com`, and any custom domain.
   - Add `localhost` and `127.0.0.1` for local use (these will be blocked by App Check anyway — local dev uses the emulator bypass).
4. Copy the **Site Key** (a long alphanumeric string). This becomes `NEXT_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_KEY`.

### 2b. Register the web app with App Check

1. In Firebase Console → **Project settings → App Check**.
2. Click **Get started**.
3. Under **Web apps**, click your app.
4. Provider: **reCAPTCHA Enterprise**.
5. Paste the Site Key from step 2a.
6. Click **Save**.
7. Set enforcement mode to **Enforced** once you've confirmed the app works (start with **Monitoring** for the first deploy to avoid locking yourself out).

---

## Step 3 — Configure Cloudflare Turnstile

Turnstile is used in `createHaiku` and `submitProposal` to prevent bot submissions.

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Turnstile**.
2. Click **Add Site**.
   - Site name: **ChainKu**
   - Domain: your production domain (e.g. `chainku.web.app`)
   - Widget type: **Managed** (invisible)
3. Copy the **Site Key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
4. Copy the **Secret Key** → used in Step 4 below.

---

## Step 4 — Set Cloud Functions secrets

The Turnstile secret key is stored in Google Secret Manager and injected into functions at runtime. It is never in source code or environment files.

```bash
firebase functions:secrets:set TURNSTILE_SECRET_KEY --project chainku
# Paste your Cloudflare Turnstile secret key when prompted.
```

Verify it was set:
```bash
firebase functions:secrets:access TURNSTILE_SECRET_KEY --project chainku
```

---

## Step 5 — Deploy Firestore indexes and rules

Deploy indexes first (they can take several minutes to build):

```bash
firebase deploy --only firestore:rules,firestore:indexes --project chainku
```

### 5a. Enable Firestore TTL on `rate_limits`

`rate_limits` documents carry an `expiresAt` field. Firestore TTL must be activated as an explicit collection-group policy — setting the field alone does nothing without this step.

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=rate_limits \
  --project=chainku
```

Or via the Firebase Console: **Firestore → Data → rate_limits → Field → expiresAt → Enable TTL**.

Without this step, rate-limit documents accumulate indefinitely (functionally harmless since old hourly-slot keys are never queried, but storage grows unboundedly).

---

## Step 6 — First manual deployment

### 6a. Set environment variables

Copy `apps/web/.env.local.example` to `apps/web/.env.local` and fill in all values from your Firebase project settings (**Project settings → Your apps → SDK setup and configuration → Config**):

```
NEXT_PUBLIC_FIREBASE_API_KEY=<from Firebase>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=chainku.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=chainku
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=chainku.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from Firebase>
NEXT_PUBLIC_FIREBASE_APP_ID=<from Firebase>
NEXT_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_KEY=<from Step 2a>
NEXT_PUBLIC_USE_EMULATOR=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<from Step 3>
```

### 6b. Enable `onProposalCreated` trigger

Open `functions/src/index.ts` and uncomment the last line:

```typescript
export * from "./triggers/onProposalCreated";
```

This trigger is disabled locally due to an emulator bug (firebase-tools#2633) but works correctly in production.

**Important:** commit this change before deploying so that future CI pushes to `main` also deploy with the trigger enabled:

```bash
git add functions/src/index.ts
git commit -m "enable onProposalCreated trigger for production"
git push
```

### 6c. Build and deploy

```bash
pnpm install
pnpm run build:shared
pnpm --filter web build      # builds apps/web/out
pnpm --filter functions build  # compiles functions/lib

firebase login
firebase deploy --only hosting,functions,firestore:rules,firestore:indexes --project chainku
```

---

## Step 7 — Set up GitHub Actions (CI/CD)

Subsequent deploys happen automatically on push to `main`. Two workflows exist:

- `.github/workflows/ci.yml` — runs on PRs: lint, typecheck, build (no deploy)
- `.github/workflows/deploy.yml` — runs on push to `main`: same checks + deploy

### 7a. Create a Firebase service account

1. In Google Cloud Console → **IAM & Admin → Service Accounts**.
2. Click **Create Service Account**.
   - Name: `github-actions`
   - Roles:
     - **Firebase Admin**
     - **Cloud Functions Admin**
     - **Cloud Datastore Index Admin** (for Firestore indexes)
     - **Service Account Token Creator**
     - **Secret Manager Secret Accessor** (so the deploy step can access secrets)
3. Click **Create Key → JSON**. Save the downloaded JSON file.

### 7b. Add GitHub secrets

In your GitHub repository → **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret name | Value |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Full contents of the service account JSON file |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From Firebase project config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `chainku.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `chainku` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `chainku.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From Firebase project config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From Firebase project config |
| `NEXT_PUBLIC_FIREBASE_APP_CHECK_RECAPTCHA_KEY` | reCAPTCHA Enterprise site key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |

> Note: `NEXT_PUBLIC_*` values are baked into the client bundle at build time (they are not secret at runtime), but keeping them as GitHub secrets prevents them from appearing in build logs and avoids accidental commits.

---

## Step 8 — Verify the deployment

After deploying, confirm:

1. Open `https://chainku.web.app` (or your custom domain).
2. Create a haiku — should succeed and redirect to the detail page.
3. In another browser / incognito window, navigate to the haiku and propose line 2.
4. In the original browser, verify the choice screen appears.
5. Choose a proposal — haiku should advance to `awaiting_line_3`.
6. Repeat for line 3 — haiku should move to the archive.

---

## Security audit

### Test 1: Direct Firestore writes must fail

Open the browser console at `https://chainku.web.app` and run:

```javascript
import { getFirestore, doc, setDoc } from "firebase/firestore";
// The app exports db — use it directly:
window.__db = window.__db || firebase.firestore();
firebase.firestore().collection("haikus").add({ test: true });
```

Or with the modular SDK (paste in console after the page loads):

```javascript
const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js");
const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
const app = initializeApp({ apiKey: "<your-key>", projectId: "chainku" });
const db = getFirestore(app);
await addDoc(collection(db, "haikus"), { test: true });
```

**Expected result:** `FirebaseError: Missing or insufficient permissions.`

### Test 2: Direct Firestore writes to proposals must fail

```javascript
await addDoc(collection(db, "haikus/some-id/proposals"), { test: true });
```

**Expected result:** `FirebaseError: Missing or insufficient permissions.`

### Test 3: Calling a function without App Check must fail

When App Check is in **Enforced** mode in the Firebase Console, calling a function without an App Check token (e.g. from a raw HTTP request) must be rejected:

```bash
curl -X POST \
  "https://us-central1-chainku.cloudfunctions.net/createHaiku" \
  -H "Content-Type: application/json" \
  -d '{"data":{"line1Text":"old pond","turnstileToken":"fake","callerUuid":"00000000-0000-0000-0000-000000000000"}}'
```

**Expected result:** HTTP 401 or a `failed-precondition` error before the function body runs.

> Note: the function's own `requireAppCheck()` guard also blocks the request even before Firebase-level enforcement kicks in, so you will see an error in either case.

---

## Performance audit

Run Lighthouse on the deployed site (Chrome DevTools → Lighthouse tab):

Target: **≥ 90 Performance** on both home (`/`) and detail (`/haiku/<id>`) pages.

Known optimizations already in place:
- Inter and Newsreader loaded via `next/font` with `display: 'swap'`
- Static export (`output: 'export'`) — no SSR overhead
- TanStack Query `staleTime: 60s` — avoids redundant Firestore reads
- Preconnect hints to `firestore.googleapis.com` and `google.com` in `<head>`
- No images (text-only product)

If the score is below 90, check:
1. **TBT (Total Blocking Time)**: the reCAPTCHA Enterprise script loaded by App Check may block the main thread. Mitigate by ensuring `initializeAppCheck` is deferred; the current implementation guards with `typeof window !== "undefined"` which defers to client hydration.
2. **Font FOUT**: both fonts use `display: 'swap'` which can cause a brief flash. Acceptable for MVP.

---

## Pre-launch checklist

- [ ] Firebase project created and Blaze billing enabled
- [ ] Firestore database created in production mode
- [ ] reCAPTCHA Enterprise API enabled in Google Cloud Console
- [ ] App Check configured in Firebase Console with reCAPTCHA Enterprise key
- [ ] Cloudflare Turnstile site created; site key and secret key obtained
- [ ] `TURNSTILE_SECRET_KEY` set via `firebase functions:secrets:set`
- [ ] All `NEXT_PUBLIC_*` env vars filled in `.env.local` for local production builds
- [ ] `onProposalCreated` uncommented in `functions/src/index.ts` before deploying
- [ ] Firestore TTL policy enabled on `rate_limits.expiresAt` (see Step 5a)
- [ ] Firestore indexes built (check Firebase Console → Firestore → Indexes)
- [ ] First deploy completed and smoke-tested (create → propose → choose → archive flow)
- [ ] App Check switched from **Monitoring** to **Enforced** after confirming the app works
- [ ] GitHub Actions secrets added (all 9 secrets listed in Step 7b)
- [ ] Security audit completed (Firestore writes blocked, unauthenticated function calls blocked)
- [ ] Lighthouse ≥ 90 Performance on home and detail pages
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` confirmed non-empty in the deployed build (open browser DevTools → Sources and search for `1x00000000000000000000AA` — if found, the real key was not injected and all form submissions will fail)
- [ ] Contact page updated with a real email address (`apps/web/src/app/contact/page.tsx`)
- [ ] Privacy policy reviewed for accuracy
- [ ] Custom domain configured in Firebase Hosting (optional)
