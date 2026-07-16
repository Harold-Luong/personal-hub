# Personal Hub AI Maintenance Guide

This is the canonical, model-independent instruction source for AI agents working in this repository. Tool-specific files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.cursorrules` or `.windsurfrules` are only entrypoints; they must point here instead of maintaining a separate copy of project rules.

## Instruction order

Apply instructions in this order:

1. Platform/system instructions and the user's explicit request.
2. The active tool's repository instruction file, when present.
3. This repository guide.
4. The relevant module `AI_GUIDE.md` and `README.md`.
5. Current source code, tests, Firestore Rules and runtime configuration as evidence of actual behavior.

Documentation explains intent, but it can become stale. Confirm behavior in the current checkout before changing it, then update the affected documentation when a contract changes.

## Required working order

1. Read this file completely.
2. Check the current branch and worktree. Preserve unrelated or uncommitted user changes.
3. If `.codegraph/` exists, use the repository knowledge graph before Grep/Glob/manual file scanning. Prefer the graph MCP tools; the shell fallback on Windows is `cmd /c codegraph explore "<question or symbols>"`.
4. Trace the live route, component/hook, repository and Firestore Rules path involved in the request. Do not guess data shapes, storage paths or authentication behavior.
5. Read the relevant module documentation listed below.
6. Make the smallest change that completely satisfies the request and follows the existing module pattern.
7. Run verification proportional to the change, inspect the final diff and report anything not verified.

If the knowledge graph is unavailable or does not cover the target, continue with targeted source reads. Its absence is not a reason to invent a contract.

## Repository map

The application is a React 19 single-page app built with Vite. `src/main.jsx` mounts `src/App.jsx`; `App` restores the Firebase Auth session; `src/routes/AppRoutes.jsx` owns the top-level route and authentication split.

```text
src/
  lib/firebase/       Firebase app, Auth, Firestore and App Check setup
  routes/             application-level route ownership
  stores/             shared auth/session state
  modules/
    auth/              sign-in and shared user-profile bootstrap
    hub/               authenticated module launcher
    expenses/          authenticated finance module backed by Firestore
    quotes/            authenticated quote module; Firestore favorites
    media-cutter/      public, browser-only FFmpeg WASM tool
    json-toolkit/      public, browser-only JSON/text tool
```

### Current route and auth contract

| Route | Access | Owner |
| --- | --- | --- |
| `/auth` | Public when signed out; redirects to `/hub` when signed in | `AppRoutes.jsx` |
| `/hub` | Authenticated | Hub module |
| `/expenses/*` | Authenticated | Expenses module |
| `/quotes/*` | Authenticated | Quotes module |
| `/tools/media-cutter/*` | Public and authenticated | Media Cutter module |
| `/tools/json/*` | Public and authenticated | JSON Toolkit module |

Do not move public tools behind authentication, expose account modules publicly or add module bootstrap work to the global auth flow unless the requested product behavior explicitly requires it. Shared user-profile initialization belongs to the authenticated application shell; Expenses initialization remains scoped to the Expenses route.

## Module sources of truth

| Area | Read before editing | Important boundary |
| --- | --- | --- |
| Auth, Hub and top-level routing | `README.md`, `src/routes/AppRoutes.jsx`, current auth hooks/stores | The top-level router owns public/protected access and lazy module loading. |
| Expenses | `src/modules/expenses/README.md` | Transactions are financial history; repositories and Firestore Rules own persistence contracts. Preserve projection and atomic-update invariants. |
| Quotes | `src/modules/quotes/AI_GUIDE.md`, then `src/modules/quotes/README.md` | Quote data, shuffle behavior, favorites Rules and local-only image uploads have synchronized contracts. |
| Media Cutter | `src/modules/media-cutter/README.md` | Processing is browser-only. Media must not be uploaded to Firebase Storage or another server. |
| JSON Toolkit | `src/modules/json-toolkit/README.md` | Input remains on-device. Preserve size, editor synchronization and diff/formatter semantics. |
| Firebase | `FIREBASE_FIRESTORE_SETUP.md`, `FIREBASE_HOSTING_DEPLOY.md`, `SECURITY.md`, `firestore.rules` | Frontend deployment and Firestore deployment are separate operations. |

## Cross-project invariants

### Data and Firebase

- User-owned module data follows `users/{uid}/modules/<moduleName>/...`. Do not create a top-level user-data collection without an explicit data-model decision.
- Components and pages must use the module's existing repository/hook boundary instead of calling Firestore ad hoc.
- The authenticated UID comes from the shared auth session. Never accept a client-supplied UID as authorization.
- A Firestore schema, path or write change must be checked against `firestore.rules`, indexes, repositories, tests and documentation.
- Never put service-account credentials, reCAPTCHA secrets or administrative Firebase credentials in frontend source or committed environment files.
- Media Cutter, JSON Toolkit and uploaded Quotes background images are local browser data. Do not transmit or persist them externally without explicit authorization.

### Architecture and scope

- Keep top-level route ownership in `src/routes/AppRoutes.jsx` and module-internal routes in each module's `routes/` directory.
- Preserve lazy loading for feature modules and heavy browser dependencies.
- Follow the existing layers: pages coordinate routes, components render UI, hooks own UI/data lifecycles, repositories or services own external effects, and utils hold pure behavior.
- Reuse established contracts and naming. Do not introduce a parallel state store, environment variable, route or persistence path merely to avoid understanding the current one.
- Keep changes inside the requested module unless a proven shared contract requires a wider edit.

### Git and workspace safety

- Start with `git status --short --branch` and inspect overlapping changes before editing.
- Do not discard user work with `git reset --hard`, `git checkout --`, broad deletion or history rewriting.
- For lost work, inspect branches, reflog and reachable commits first, then recover onto a named branch or commit.
- Do not commit, merge, push, force-push, deploy or open a pull request unless the user explicitly asks for that state-changing action.
- On this Windows checkout, prefer `npm.cmd`, `npx.cmd` and `git -c safe.directory=D:/hub/personal-hub ...` when Git reports an ownership warning.

## Verification

Run the smallest relevant checks first, then the broader checks appropriate to the risk:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
git diff --check
git status --short
```

Vitest can target a module or file while iterating, for example:

```powershell
npm.cmd test -- src/modules/quotes
npm.cmd test -- src/modules/media-cutter
npm.cmd test -- src/modules/json-toolkit
```

For route, responsive, file-upload, media, download or browser-lifecycle changes, also run the app and verify the affected interaction in a browser. Do not claim browser verification if only unit tests were run.

Deployment is not part of normal verification. When the user explicitly requests it, confirm the active Firebase project first and use the target that matches the changed artifact:

```powershell
npm.cmd run build
npx.cmd firebase-tools deploy --only hosting
npx.cmd firebase-tools deploy --only firestore:rules
npx.cmd firebase-tools deploy --only firestore
```

- UI, bundled quote data and frontend assets require a Hosting build/deploy.
- Rules-only changes require `firestore:rules`.
- Rules plus indexes require `firestore`.
- A Firestore deploy does not publish frontend code, and a Hosting deploy does not publish Rules.

## Documentation and handoff

- Update the relevant module README when user-visible behavior, limits, routes, storage or data contracts change.
- Update a module AI guide when an invariant, change map or maintenance recipe changes.
- Update this file only for repository-wide architecture, workflow or safety rules.
- Keep tool-specific entrypoints short and point them to this file; do not fork project instructions by model name.
- In the final handoff, state what changed, which checks passed, which checks were skipped and any deployment still required.
