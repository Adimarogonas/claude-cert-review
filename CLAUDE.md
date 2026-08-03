# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build → .next/
npm run start      # Serve production build
npm run lint       # ESLint (Next.js defaults)
node scripts/analyze-bank.mjs  # Statistical audit of question bank (answer distribution, bias checks)
```

No test suite exists — there is no Jest, Vitest, or similar runner configured.

## Architecture

The project follows a clean three-layer separation:

**`models/`** — Pure JavaScript, no React, no browser globals (SSR-safe)
- `scenarios.js` — 8 scenario-based question sets (ID prefix `"1a"`, `"2a"`, …)
- `modules.js` — 5 CCA domains × task statements × questions (ID prefix `"m1.1a"`, …)
- `examEngine.js` — `buildExam()` shuffles question order and each question's answer options (remapping `correct` to the new position); `scoreExam()` linear 0–1000 scale, pass ≥ 720
- `progressStore.js` — localStorage read/write behind `typeof window !== 'undefined'` guards; storage key `cca-exam:v1`
- `spacedRepetition.js` — Leitner box (4 boxes, intervals: 0 / 1 hr / 8 hr / 1 day); `recordResult()` is a pure function

**`controllers/`** — React custom hooks that wire models to UI state
- `ProgressContext.jsx` — wraps the entire app; hydrates from localStorage in `useEffect` (a `hasHydrated` ref prevents saving on first render before hydration)
- `useExam.js` — timer, answers, phase machine for the mock exam
- `useSpacedRepetition.js` — generates SR drill queue; mastery = all cards in box 3
- `useScenarioPractice.js`, `useModules.js`, `useAppNavigation.js` — scenario/module/route logic

**`views/`** — Presentational React components; no local state; communicate via callback props (`onNavigate`, `onAnswer`, etc.); styled exclusively with inline `style={}` objects

**`pages/`** — Next.js file-based routing; each page mounts the corresponding view and wires in the relevant controller hook

## Key Patterns

**SSR safety:** All localStorage access is guarded. Models import cleanly on the server. Randomness (`buildExam`) only runs post-mount inside hooks.

**Question format:**
```js
{ id: "1a", text: "…", options: ["A", "B", "C", "D"], correct: 0, explanation: "…" }
```
`correct` is a zero-based index into `options`. In source data (`scenarios.js`, `modules.js`) this index is fixed. In exam question objects returned by `buildExam()`, options are reshuffled each run and `correct` is remapped accordingly — never compare source and exam `correct` values directly. Scenario IDs use a numeric prefix (`"1a"`); module IDs use `"m<domain>.<task><letter>"` (`"m1.1a"`).

**Scoring:** `scaled = 100 + (rawCorrect / totalQuestions) * 900` — single linear map, 0–1000 range, pass threshold 720.

**Styling:** Global CSS custom properties for brand tokens (`--color-*`, `--font-*`) live in `styles/globals.css`. Components use inline style objects only — no CSS modules, no Tailwind, no component library.

**Path alias:** `@/` resolves to the repo root (configured in `jsconfig.json`).
