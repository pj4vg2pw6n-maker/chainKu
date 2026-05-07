# ChainKu — Phase 0: Environment setup

This phase is different from the others. Most of it is **manual setup you do yourself**, before opening Claude Code. The Claude Code prompt at the end is just a verification step.

Allocate ~30-60 minutes. If you've never done this kind of setup before, perhaps an evening.

---

## Part A — Tools to install on your computer

Install these in order. After each, verify it works by running the listed command in your terminal.

### A.1 — Git

Git is the version control system that tracks every change you make.

- **Mac**: open Terminal, run `git --version`. If it's missing, you'll be prompted to install Xcode Command Line Tools. Accept.
- **Windows**: download from https://git-scm.com/download/win and install with default options. Use Git Bash as your terminal going forward.
- **Linux**: `sudo apt install git` or your distro's equivalent.

Verify: `git --version` should print a version number.

### A.2 — Node.js (version 20 LTS)

Node.js is the JavaScript runtime that runs your build tools and Cloud Functions locally.

- Download Node.js 20 LTS from https://nodejs.org (the "LTS" version, not "Current").
- Install with default options.

Verify: `node --version` should print v20.x.x.

### A.3 — pnpm

pnpm is the package manager we'll use for the monorepo.

- Run: `npm install -g pnpm`

Verify: `pnpm --version` should print a version number.

### A.4 — Firebase CLI

The Firebase command-line tool, used to deploy and run the emulator.

- Run: `npm install -g firebase-tools`

Verify: `firebase --version` should print a version number.

### A.5 — Claude Code

The agentic coding tool you'll use to build ChainKu.

- Follow the official instructions: https://docs.claude.com/en/docs/claude-code/overview
- At time of writing, it's installed via: `npm install -g @anthropic-ai/claude-code`
- After installation, run `claude` once and follow the login flow.

Verify: `claude --version` should print a version number, and you should be able to run `claude` and reach the prompt.

### A.6 — A code editor (optional but recommended)

You don't strictly need an editor — Claude Code does the writing — but you'll want one to read the code and make small manual edits.

- **VS Code** is the most common choice: https://code.visualstudio.com
- Other options: Cursor, Zed, Sublime, your call.

---

## Part B — Online accounts

### B.1 — GitHub account

- If you don't have one: sign up at https://github.com
- Verify your email.
- Set up SSH keys or a personal access token so you can push from your computer without typing your password every time. The simplest path:
  - Run `gh auth login` if you install the GitHub CLI (https://cli.github.com), and follow the prompts.
  - Or use HTTPS with credential caching; GitHub's docs walk you through this: https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git

### B.2 — Google account for Firebase

- You probably already have one. Firebase uses Google accounts for authentication.
- Go to https://console.firebase.google.com and accept the terms if it's your first time.
- **Do not yet create the ChainKu project** — Phase 7 will instruct you to do this when needed. (You can create it now if you want, but it's optional.)

### B.3 — Cloudflare account (for Turnstile)

- Sign up at https://www.cloudflare.com if you don't have an account.
- This will be used in Phase 7 to set up Turnstile (the CAPTCHA). For now, just having the account is enough.

---

## Part C — Create your local project directory

1. Open your terminal.

2. Navigate to wherever you keep your projects. For example:
   ```
   cd ~/Documents
   ```
   or create a new "Projects" folder if you don't have one:
   ```
   mkdir -p ~/Projects && cd ~/Projects
   ```

3. Create the ChainKu directory:
   ```
   mkdir chainku
   cd chainku
   ```

4. Move `SPEC.md` and `PROMPTS.md` into this directory. Either drag them in your file manager, or use `mv` from the terminal:
   ```
   mv ~/Downloads/SPEC.md ~/Downloads/PROMPTS.md .
   ```
   (Adjust the source paths to where you actually have the files.)

5. Verify they're there:
   ```
   ls
   ```
   You should see `SPEC.md` and `PROMPTS.md`.

---

## Part D — Create the GitHub repository

1. Go to https://github.com/new

2. Repository name: `chainku`

3. Description (optional): "Collaborative haiku writing"

4. Visibility: your choice. **Private** is fine while developing; you can make it public later. Either works.

5. **Do not** initialize with README, .gitignore, or license. We want an empty repo, because Claude Code will create those files for us in Phase 1.

6. Click "Create repository".

7. On the next page, GitHub will show you commands like:
   ```
   git remote add origin git@github.com:YOUR_USERNAME/chainku.git
   ```
   Copy this URL — you'll need it shortly. Don't run the commands yet.

---

## Part E — Initialize git in your local directory

In your terminal, inside the `chainku` directory:

```
git init
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/chainku.git
```

(Replace `YOUR_USERNAME` with your actual GitHub username, and use the SSH or HTTPS URL based on how you set up authentication in B.1.)

Don't push anything yet — there's nothing to push, and Phase 1 will create all the files. We're just connecting your local folder to your GitHub repo so it's ready when needed.

---

## Part F — Verification prompt for Claude Code

Now open Claude Code in the `chainku` directory:

```
claude
```

Then paste this prompt to verify everything is in order before Phase 1:

```
Before we start building anything, please verify the development environment is correctly set up. Specifically:

1. Confirm that the current directory contains SPEC.md and PROMPTS.md, and read both.

2. Run the following commands and report each version:
   - node --version (should be v20.x)
   - pnpm --version
   - firebase --version
   - git --version

3. Verify that this directory is a git repository (`git status` should work) and report whether a remote named 'origin' is configured (run `git remote -v`).

4. Do NOT yet run pnpm init, create any files, or start scaffolding. This is a verification step only.

5. Report any issues found, and confirm whether we are ready to proceed to Phase 1.
```

If Claude Code reports any issues (missing tool, no git repo, no remote), fix them by going back to the relevant step in this Phase 0 before proceeding.

If everything checks out: congratulations, you're ready for **Phase 1** in `PROMPTS.md`. Start a new Claude Code session, paste the Onboarding prompt followed by the Phase 1 prompt, and away you go.

---

## Quick reference: common terminal commands you'll need

- `pwd` — print working directory (where am I?)
- `ls` — list files in current directory
- `cd folder_name` — change into a folder
- `cd ..` — go up one level
- `git status` — what has changed?
- `git add .` — stage all changes for commit
- `git commit -m "message"` — commit staged changes with a message
- `git push` — send commits to GitHub
- `git log --oneline` — see commit history

A reasonable post-Phase-1 commit/push routine:

```
git add .
git commit -m "Phase 1: project scaffolding"
git push -u origin main
```

(The `-u origin main` is only needed the first time; afterwards just `git push`.)
