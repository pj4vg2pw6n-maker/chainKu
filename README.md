# ChainKu

Collaborative haiku writing. Three lines, three people.

## What it is

ChainKu is a web app where haiku are written collaboratively by three anonymous contributors. One person starts with line 1; others propose lines 2 and 3; the initiator chooses the best proposal at each stage.

## Stack

- **Frontend**: Next.js 14 (App Router, static export), TypeScript, Tailwind CSS, TanStack Query
- **Backend**: Firebase Cloud Functions v2 (Node.js 22), Firestore
- **Security**: Firebase App Check, Cloudflare Turnstile, Firestore rules
- **Hosting**: Firebase Hosting

## Project structure

```
apps/web/        Next.js frontend
functions/       Cloud Functions
packages/shared/ Shared types and constants
```

## Getting started

### Prerequisites

- Node.js 22
- pnpm
- Firebase CLI (`npm i -g firebase-tools`)

### Install

```bash
pnpm install
```

### Local development

Start the Firebase Emulator Suite:

```bash
pnpm emulators
```

Start the Next.js dev server (in a second terminal):

```bash
pnpm dev
```

The app will be at `http://localhost:3000`. The emulator UI is at `http://localhost:4000`.

### Build

```bash
pnpm build
```

## Specification

See `SPEC.md` for the full product and technical specification.
