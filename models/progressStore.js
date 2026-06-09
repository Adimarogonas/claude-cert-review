/**
 * progressStore.js — Persistence model for CCA exam progress
 *
 * Architecture:
 *   createStorage()  → storage adapter (localStorage by default)
 *   loadProgress()   → deserialize the full progress blob from storage
 *   saveProgress()   → serialize and persist the progress blob
 *   defaultProgress()→ canonical empty-state factory
 *   setAnswer()      → pure/immutable mutator: record an answer
 *   recordExam()     → pure/immutable mutator: append an exam result
 *   getPracticeStats()→ derived stats from the current progress blob
 *
 * Storage key: 'cca-exam:v1'
 * Versioned key prevents clobbering when the schema changes — increment to
 * 'cca-exam:v2' and write a one-time migration on first load.
 *
 * ── Swap path to async IndexedDB ──────────────────────────────────────────
 * createStorage() returns a synchronous { getItem, setItem, removeItem }.
 * To swap to IndexedDB:
 *   1. Create createIDBStorage() returning { getItem, setItem, removeItem }
 *      where every method returns a Promise.
 *   2. Change loadProgress() / saveProgress() to be async and await the
 *      adapter calls — the rest of the API does not change.
 *   3. Pass the new adapter: loadProgress(createIDBStorage())
 *   4. All callers of loadProgress/saveProgress need `await`.
 * The mutators (setAnswer, recordExam, getPracticeStats) remain synchronous
 * pure functions regardless of the storage adapter chosen.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * No React imports. No 'use client'. Safe for server-side rendering.
 */

// @/models/scenarios is imported only for getPracticeStats — it provides
// getAllQuestions() so we can count total answered vs. total available.
import { getAllQuestions } from '@/models/scenarios';
import { MAX_BOX } from '@/models/spacedRepetition';

// ─── Storage key ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'cca-exam:v1';

// ─── Storage adapter ──────────────────────────────────────────────────────────

/**
 * createStorage()
 *
 * Returns a thin { getItem, setItem, removeItem } object backed by
 * localStorage.  All three methods are SSR-safe:
 *   • guarded by `typeof window !== 'undefined'` before touching localStorage
 *   • wrapped in try/catch so a SecurityError (private-browsing quota) or a
 *     JSON.parse failure never bubbles up to the caller
 *
 * Return contract
 *   getItem(key)        → stored string | null (never throws)
 *   setItem(key, val)   → void           (never throws)
 *   removeItem(key)     → void           (never throws)
 *
 * To replace with IndexedDB, implement the same three methods returning
 * Promises and update loadProgress/saveProgress to be async (see header).
 *
 * @returns {{ getItem: (key: string) => string|null,
 *             setItem: (key: string, val: string) => void,
 *             removeItem: (key: string) => void }}
 */
export function createStorage() {
  return {
    /**
     * @param {string} key
     * @returns {string|null}
     */
    getItem(key) {
      if (typeof window === 'undefined') return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },

    /**
     * @param {string} key
     * @param {string} val
     */
    setItem(key, val) {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(key, val);
      } catch {
        // Quota exceeded or SecurityError — silently swallow.
      }
    },

    /**
     * @param {string} key
     */
    removeItem(key) {
      if (typeof window === 'undefined') return;
      try {
        localStorage.removeItem(key);
      } catch {
        // Silent no-op on SSR or restricted storage.
      }
    },
  };
}

// ─── Default (empty) progress shape ──────────────────────────────────────────

/**
 * defaultProgress()
 *
 * Canonical empty-state factory. Always call this rather than constructing
 * the object inline so a single definition governs the shape.
 *
 * Shape:
 * {
 *   answers:     { [qid: string]: number }          — selected option index
 *   submitted:   { [qid: string]: boolean }         — whether answer was committed
 *   srState:     { [qid: string]: {                 — spaced-repetition state
 *                    box: number,                    —   Leitner box (0–3)
 *                    lastSeen: string|null,          —   ISO date string
 *                    attempts: number,
 *                    correct: number,
 *                    wrong: number
 *                  }}
 *   examHistory: Array<{                            — completed full-exam attempts
 *                  date: string,                    —   ISO date string
 *                  raw: number,                     —   raw correct count
 *                  total: number,                   —   questions in that attempt
 *                  scaled: number,                  —   0–300 scaled score
 *                  passed: boolean
 *                }>
 * }
 *
 * @returns {Progress}
 */
export function defaultProgress() {
  return {
    answers: {},
    submitted: {},
    srState: {},
    examHistory: [],
  };
}

function normalizeSrState(srState) {
  const normalized = {};
  for (const [qid, entry] of Object.entries(srState)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    normalized[qid] = {
      ...entry,
      box: Math.max(0, Math.min(Number(entry.box) || 0, MAX_BOX)),
    };
  }
  return normalized;
}

// ─── Load / save ──────────────────────────────────────────────────────────────

/**
 * loadProgress(storage?)
 *
 * Reads the versioned JSON blob from storage and returns a Progress object.
 * Falls back to defaultProgress() if:
 *   • nothing is stored under the key
 *   • the stored value fails JSON.parse
 *   • the parsed value is missing required top-level keys (forward-compat guard)
 *
 * @param {{ getItem: (key: string) => string|null }} [storage]
 *   Defaults to createStorage(). Pass a custom adapter for testing or IDB.
 * @returns {Progress}
 */
export function loadProgress(storage = createStorage()) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return defaultProgress();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultProgress();
  }

  // Shape guard — ensure all top-level keys exist so callers never have to
  // null-check individual fields after loading.
  const def = defaultProgress();
  const srState =
    (parsed.srState && typeof parsed.srState === 'object' && !Array.isArray(parsed.srState))
      ? normalizeSrState(parsed.srState)
      : def.srState;

  return {
    answers:     (parsed.answers     && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers))
                   ? parsed.answers     : def.answers,
    submitted:   (parsed.submitted   && typeof parsed.submitted === 'object' && !Array.isArray(parsed.submitted))
                   ? parsed.submitted   : def.submitted,
    srState,
    examHistory: Array.isArray(parsed.examHistory)
                   ? parsed.examHistory : def.examHistory,
  };
}

/**
 * saveProgress(progress, storage?)
 *
 * Serializes and persists the progress blob.  Never throws.
 *
 * @param {Progress} progress
 * @param {{ setItem: (key: string, val: string) => void }} [storage]
 *   Defaults to createStorage().
 */
export function saveProgress(progress, storage = createStorage()) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Silent — storage adapter's setItem already swallows errors, but
    // JSON.stringify could theoretically throw on circular refs.
  }
}

// ─── Immutable mutators ───────────────────────────────────────────────────────
// All mutators accept the current progress object and return a NEW object.
// They never mutate the input. This keeps React state updates clean:
//   setState(prev => setAnswer(prev, qid, idx, isCorrect))

/**
 * setAnswer(progress, qid, selectedIndex, isCorrect)
 *
 * Records the student's selected answer and marks the question as submitted.
 * Also updates the spaced-repetition state for the question.
 *
 * @param {Progress} progress     — current (immutable) progress
 * @param {string}   qid          — question id, e.g. '1a'
 * @param {number}   selectedIndex — 0-based option index the student picked
 * @param {boolean}  isCorrect    — whether selectedIndex matches correct answer
 * @returns {Progress}            — new progress object
 */
export function setAnswer(progress, qid, selectedIndex, isCorrect) {
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  // Current SR state for this question (or a fresh entry).
  const prev = progress.srState[qid] ?? {
    box: 0,
    lastSeen: null,
    attempts: 0,
    correct: 0,
    wrong: 0,
  };

  // Leitner box movement: correct → advance, wrong → back to box 0.
  const nextBox = isCorrect ? Math.min(prev.box + 1, MAX_BOX) : 0;

  const newSrEntry = {
    box:      nextBox,
    lastSeen: today,
    attempts: prev.attempts + 1,
    correct:  prev.correct  + (isCorrect ? 1 : 0),
    wrong:    prev.wrong    + (isCorrect ? 0 : 1),
  };

  return {
    ...progress,
    answers:   { ...progress.answers,   [qid]: selectedIndex },
    submitted: { ...progress.submitted, [qid]: true },
    srState:   { ...progress.srState,   [qid]: newSrEntry },
  };
}

/**
 * recordExam(progress, result)
 *
 * Appends a completed exam attempt to examHistory.
 *
 * @param {Progress} progress
 * @param {{ raw: number, total: number, scaled: number, passed: boolean }} result
 * @returns {Progress}
 */
export function recordExam(progress, result) {
  const entry = {
    date:   new Date().toISOString(),
    raw:    result.raw,
    total:  result.total,
    scaled: result.scaled,
    passed: result.passed,
  };

  return {
    ...progress,
    examHistory: [...progress.examHistory, entry],
  };
}

// ─── Derived stats ────────────────────────────────────────────────────────────

/**
 * getPracticeStats(progress)
 *
 * Computes read-only derived statistics from the current progress.
 * Uses getAllQuestions() from @/models/scenarios to know the total
 * available question count.
 *
 * Returned shape:
 * {
 *   totalQuestions: number,   — total questions in the question bank
 *   answered:       number,   — distinct questions the student has submitted
 *   correct:        number,   — of those answered, how many were correct
 *   wrong:          number,   — of those answered, how many were wrong
 *   percentCorrect: number,   — 0–100, NaN when answered === 0
 *   examsAttempted: number,
 *   lastExam:       object|null  — most recent examHistory entry or null
 * }
 *
 * @param {Progress} progress
 * @returns {PracticeStats}
 */
export function getPracticeStats(progress) {
  const allQuestions = getAllQuestions();
  const totalQuestions = allQuestions.length;

  // Count answered questions from srState (srState is only populated on submit).
  let answered = 0;
  let correct  = 0;
  let wrong    = 0;

  for (const qid of Object.keys(progress.submitted)) {
    if (progress.submitted[qid]) {
      answered += 1;
      const sr = progress.srState[qid];
      if (sr) {
        // Use the delta from the most-recent attempt (attempts tracks cumulative).
        // For the "answered correctly at least once" metric we use sr.correct > 0,
        // but for a raw running tally we use total accumulated correct/wrong counts.
        // Here we expose cumulative totals — callers can derive ratios as needed.
        correct += sr.correct;
        wrong   += sr.wrong;
      }
    }
  }

  const percentCorrect = answered === 0
    ? 0
    : Math.round((correct / (correct + wrong)) * 100);

  const examsAttempted = progress.examHistory.length;
  const lastExam = examsAttempted > 0
    ? progress.examHistory[examsAttempted - 1]
    : null;

  return {
    totalQuestions,
    answered,
    correct,
    wrong,
    percentCorrect,
    examsAttempted,
    lastExam,
  };
}
