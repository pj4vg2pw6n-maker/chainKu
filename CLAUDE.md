# ChainKu — Claude Code context

**Always read `SPEC.md` before doing anything in this repo.** It is the single source of truth for product behavior, data shapes, architecture decisions, and naming conventions.

If you find ambiguities or contradictions between the code and SPEC.md, ask before assuming. Do not invent features that are not in SPEC.md.

## Quick orientation

- `SPEC.md` — product and technical specification (read this first)
- `PROMPTS.md` — phased build plan (8 phases); check current phase before starting work
- `apps/web/` — Next.js 14 frontend (App Router, TypeScript, Tailwind, static export)
- `functions/` — Firebase Cloud Functions v2 (Node.js 22, TypeScript)
- `packages/shared/` — shared types, constants, validators

## Monorepo

pnpm workspaces. Install from the repo root with `pnpm install`. Use `pnpm --filter <name> <script>` to run workspace scripts.

## Local development

`pnpm emulators` — starts Firebase Emulator Suite (Firestore + Functions + Hosting).
`pnpm dev` — starts Next.js dev server (in `apps/web`).
