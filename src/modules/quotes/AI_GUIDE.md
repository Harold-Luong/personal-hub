# Quotes AI Maintenance Guide

This file applies to every file under `src/modules/quotes`. It is the canonical instruction source for AI agents modifying the Quotes module. Read the module `README.md` for user-visible behavior, then inspect the current implementation before editing.

## Required working order

1. Read the repository-level `AGENTS.md` or `CLAUDE.md` when present. These files may be generated locally and ignored by Git; their absence is not a blocker.
2. Read this file and `src/modules/quotes/README.md` completely.
3. Use the repository knowledge graph before Grep/Glob/Read when graph tools are available. Query the exact files or symbols involved in the request.
4. Inspect the current source and tests. Documentation can become stale; code and tests are the runtime source of truth.
5. Preserve unrelated user changes in a dirty worktree and make the smallest change that satisfies the request.
6. Update `README.md` and this file when a behavior, data contract, storage path or maintenance rule changes.

If graph tools are unavailable, continue with targeted file reads using the change map below. Do not guess a backend contract or create a new storage path.

## Change map

| Concern | Source of truth | Tests or related contract |
| --- | --- | --- |
| Routes and auth UID wiring | `routes/QuotesRouter.jsx`, `constants/quoteMetadata.js` | App auth session store and router callers |
| Quote/category/background data | `data/quoteData.js` | `data/quoteData.test.js`, `firestore.rules` allowlist |
| Shuffle bag and navigation history | `utils/quoteShuffle.js`, `hooks/useRandomQuote.js` | `utils/quoteShuffle.test.js` |
| Auto Mode and page visibility | `pages/QuoteHomePage.jsx` | Timer and transition conditions in current source |
| Ambient playlist | `hooks/useAmbientAudio.js`, `assets/music/` | Lint and production build asset output |
| Favorites | `hooks/useFavorites.js`, `api/quoteFavoritesRepository.js` | `firestore.rules` and authenticated UID |
| Image creator and PNG export | `pages/CreatePage.jsx`, `components/CreatorOptions.jsx`, `components/QuoteCreatorPreview.jsx` | `utils/quoteImageUpload.js` and its test |
| Theme | `hooks/useTheme.js`, `constants/quoteMetadata.js` | localStorage key `lang.theme` |
| UI and responsive behavior | `components/`, `pages/`, `styles/quotes.scss` | Lint, build and relevant browser check |

## Invariants that must remain true

### Quote data

- `data/quoteData.js` is the single source of truth for built-in categories, quotes and background mappings.
- Keep `rawQuotes` grouped in the same order as `rawCategories`.
- Every `rawQuotes` entry uses this exact field order: `id`, `categoryId`, `backgroundId`, `author`, `text`.
- `id` is unique, lowercase kebab-case and begins with `${categoryId}-`.
- `categoryId` exists in `rawCategories`.
- `backgroundId` currently equals `categoryId` and resolves through `quoteBackgrounds`.
- `author` and `text` are non-empty strings.
- Do not hardcode derived category counts. `quoteCategories` calculates them from `quotes`.
- Do not assume the quote count written in documentation is current. Read `quotes.length` or the current test. When adding/removing quotes, update the explicit `toHaveLength(...)` expectation in `data/quoteData.test.js`.

### Shuffle bag

- The initial quote is random; do not restore a fixed `initialQuoteId`.
- A cycle shows every available quote exactly once before reshuffling.
- The first item of a new cycle must not equal the currently displayed quote when more than one quote exists.
- Going backward and then forward replays forward history without consuming another item from the bag.
- Pure shuffle behavior belongs in `utils/quoteShuffle.js`; React transition state belongs in `hooks/useRandomQuote.js`.
- Add or update deterministic tests by injecting a `random` function instead of mocking global randomness.

### Auto Mode and audio

- Auto Mode advances after a new random delay of 20–30 seconds.
- Its timer runs only while Auto Mode is enabled, the document is visible and the quote transition is `idle`.
- Hiding the tab cancels the timer; returning creates a fresh delay.
- Ambient audio is a multi-file playlist discovered with `import.meta.glob` from `assets/music`.
- Keep supported audio extensions, deterministic path sorting, `audio.loop = false`, `audio.onended` progression and cleanup on unmount unless the requested behavior explicitly changes them.
- Browser autoplay can fail. Treat playback failure separately from quote navigation.

### Favorites and Firestore

- Favorites are authenticated, user-owned data at `users/{uid}/modules/quotes/favorites/{quoteId}`.
- `api/quoteFavoritesRepository.js` is the only Firestore read/write boundary for Favorites.
- The document schema is exactly `{ quoteId, createdAt }`; creation uses `serverTimestamp()`.
- `useFavorites(uid)` owns subscription, optimistic updates, rollback, retry and one-time migration from `lang.favorite-quote-ids`.
- Do not move Favorites back to localStorage or create a top-level collection.
- Firestore Rules allow owner-only read/create/delete, reject update and validate quote IDs against `isKnownQuoteId()`.
- Every added or renamed quote ID must also be updated in the `firestore.rules` allowlist. Otherwise the quote renders but cannot be favorited.
- A frontend change and a Rules change have separate deployment targets. Never claim a Rules-only deploy ships frontend data or UI.

### Image creator

- Built-in backgrounds remain bundled frontend assets.
- User-selected backgrounds are local-only. They are read into memory as Data URLs and are not uploaded to Firebase Storage or any server.
- Accepted upload types are JPG, PNG and WebP with a 10 MB maximum. Keep validation in `utils/quoteImageUpload.js` and error copy in Vietnamese.
- Selecting a newer upload or a built-in background must invalidate any older pending `FileReader` result so stale work cannot replace the current choice.
- PNG export waits for document fonts and preview images to decode before calling `html-to-image`.
- Keep the current ratio options and `lang-{quoteId}-{ratio}.png` filename contract unless the request changes them.
- Do not add persistent image storage, external uploads or a backend without explicit user authorization.

## Recipes

### Add or edit a quote

1. Edit the correct category group in `data/quoteData.js` and preserve normalized field order.
2. Add or update the ID in `firestore.rules:isKnownQuoteId()`.
3. Update the explicit quote-count assertion in `data/quoteData.test.js` when the total changes.
4. Run the Quotes tests, lint, build and `git diff --check`.
5. Mention that frontend and Firestore Rules require separate deploys if both changed. Deploy only when the user explicitly requests it.

### Change random navigation

1. Put pure bag/history logic in `utils/quoteShuffle.js`.
2. Preserve transition locking and timer cleanup in `useRandomQuote.js`.
3. Cover initial randomization, cycle uniqueness, boundary non-repeat and back/forward history with deterministic tests.

### Change Favorites

1. Trace `QuotesRouter -> useFavorites -> quoteFavoritesRepository -> firestore.rules`.
2. Keep UID scoping and the repository boundary.
3. Verify optimistic success, rollback and subscription behavior affected by the change.
4. Audit and deploy Rules only if their contract changed and deployment is authorized.

### Change image upload or export

1. Trace `CreatePage -> CreatorOptions -> QuoteCreatorPreview -> html-to-image`.
2. Keep validation in a reusable utility with unit tests.
3. Confirm the uploaded image is visible in preview and included in exported PNG.
4. Verify invalid type, empty file, oversized file and replacement of a pending upload.

## Verification

Use Windows command launchers in this repository:

```powershell
npm.cmd test -- src/modules/quotes
npm.cmd run lint
npm.cmd run build
git -c safe.directory=D:/hub/personal-hub diff --check
```

If `firestore.rules` changed, validate the Quotes allowlist and schema diff. Deploy only with explicit authorization:

```powershell
npx.cmd -y firebase-tools@latest deploy --only firestore:rules
```

For an interaction change, perform a focused local browser check when browser automation is available. State clearly when browser verification could not be run; passing unit tests and a production build do not prove that a file picker, image preview or download interaction works end to end.

## Handoff checklist

- State which behavior changed and which boundary owns it.
- List the verification commands that actually ran and their results.
- Call out any verification that could not run.
- Distinguish frontend Hosting changes from Firestore Rules changes.
- Do not report deployment unless it actually completed.
