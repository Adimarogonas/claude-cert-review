// Pure JS model — no React, no browser globals, no 'use client'.
// Leitner-box spaced repetition scheduling engine.
// All functions are pure — they operate on an immutable srState map.
// No top-level Date.now() or Math.random() calls; both are passed in as arguments.

import { getAllQuestions, getScenarioById } from '@/models/scenarios';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The highest Leitner box index (0-indexed). Questions at this box are mastered. */
export const MAX_BOX = 3;

/**
 * Minimum milliseconds that must elapse before a question in each box is due again.
 * Index = box number: box 0 is always due (0 ms), box 3 requires 1 day.
 */
export const BOX_INTERVALS_MS = [
  0,           // box 0 — always due
  3_600_000,   // box 1 — 1 hour
  28_800_000,  // box 2 — 8 hours
  86_400_000,  // box 3 — 1 day  (mastered)
];

// ---------------------------------------------------------------------------
// State initialisation
// ---------------------------------------------------------------------------

/**
 * Seeds fresh SR state for every question in the question universe.
 * Every question starts in box 0 with no prior attempts.
 *
 * @returns {Object.<string, {box: number, lastSeen: number|null, attempts: number, correct: number, wrong: number}>}
 */
export function initSrState() {
  const questions = getAllQuestions();
  const state = {};
  for (const q of questions) {
    state[q.id] = {
      box: 0,
      lastSeen: null,  // null = never seen; always treated as due
      attempts: 0,
      correct: 0,
      wrong: 0,
    };
  }
  return state;
}

// ---------------------------------------------------------------------------
// Result recording (immutable)
// ---------------------------------------------------------------------------

/**
 * Records the result of answering a question.
 * Returns a NEW srState object — the input is never mutated.
 *
 * Correct: promote to min(box + 1, MAX_BOX).
 * Wrong:   reset to box 0.
 * Always updates attempts, the appropriate counter, and lastSeen.
 *
 * @param {Object} srState  - Current SR state map.
 * @param {string} qid      - Question ID (e.g. "3b").
 * @param {boolean} wasCorrect
 * @param {number}  now     - Current timestamp in ms (e.g. Date.now()).
 * @returns {Object} New SR state map.
 */
export function recordResult(srState, qid, wasCorrect, now) {
  const entry = srState[qid];
  if (!entry) {
    // Unknown question — return state unchanged rather than throwing.
    return srState;
  }

  const newBox = wasCorrect
    ? Math.min(entry.box + 1, MAX_BOX)
    : 0;

  const newEntry = {
    box: newBox,
    lastSeen: now,
    attempts: entry.attempts + 1,
    correct: entry.correct + (wasCorrect ? 1 : 0),
    wrong: entry.wrong + (wasCorrect ? 0 : 1),
  };

  return { ...srState, [qid]: newEntry };
}

// ---------------------------------------------------------------------------
// Scheduling predicates
// ---------------------------------------------------------------------------

/**
 * Returns true if the question is due for review.
 * A question with lastSeen === null is always due.
 *
 * @param {{ box: number, lastSeen: number|null }} entry
 * @param {number} now - Current timestamp in ms.
 * @returns {boolean}
 */
export function isDue(entry, now) {
  if (entry.lastSeen === null) return true;
  return (now - entry.lastSeen) >= BOX_INTERVALS_MS[entry.box];
}

/**
 * Returns true if the question is considered mastered (box === MAX_BOX).
 * Mastered questions are phased out and excluded from sessions.
 *
 * @param {{ box: number }} entry
 * @returns {boolean}
 */
export function isMastered(entry) {
  return entry.box >= MAX_BOX;
}

// ---------------------------------------------------------------------------
// Session selection
// ---------------------------------------------------------------------------

/**
 * Selects up to `count` question IDs for a study session.
 *
 * Rules:
 * 1. Mastered questions (box >= MAX_BOX) are excluded.
 * 2. The active pool is all non-mastered questions, sorted to prefer due items.
 * 3. Within the pool, each question has a weight of (MAX_BOX + 1 - box).
 *    Lower-box questions therefore receive higher weight and appear more often.
 * 4. Selection spans multiple scenarios — the whole question set is treated as
 *    a single pool so sessions naturally cross scenario boundaries.
 * 5. Returns at most `count` unique question IDs.
 *
 * @param {Object} srState   - Current SR state map.
 * @param {number} count     - Maximum number of questions to return.
 * @param {number} now       - Current timestamp in ms.
 * @param {() => number} [rng] - Random number source, default () => Math.random().
 *                               Injected here so the module itself has no top-level RNG.
 * @returns {string[]}  Array of question IDs (up to `count`).
 */
export function selectSession(srState, count, now, rng = () => Math.random()) {
  // Build the active (non-mastered) pool annotated with weight and due status.
  const pool = [];
  for (const [qid, entry] of Object.entries(srState)) {
    if (isMastered(entry)) continue;

    const due = isDue(entry, now);
    // Weight: due items at lower boxes are highest priority.
    // Base weight favours lower boxes: MAX_BOX+1-box → box 0 = 4, box 2 = 2.
    // Boost due items by an additional factor so they surface before not-yet-due ones.
    const baseWeight = (MAX_BOX + 1 - entry.box);
    const weight = due ? baseWeight * (MAX_BOX + 1) : baseWeight;

    pool.push({ qid, weight });
  }

  if (pool.length === 0) return [];

  const selected = [];
  const remaining = pool.slice(); // shallow copy we'll shrink as we pick

  const n = Math.min(count, remaining.length);
  for (let i = 0; i < n; i++) {
    // Weighted random selection without replacement.
    const totalWeight = remaining.reduce((acc, item) => acc + item.weight, 0);
    let rand = rng() * totalWeight;

    let chosen = -1;
    for (let j = 0; j < remaining.length; j++) {
      rand -= remaining[j].weight;
      if (rand <= 0) {
        chosen = j;
        break;
      }
    }
    // Guard against floating-point overshoot landing past every item.
    if (chosen === -1) chosen = remaining.length - 1;

    selected.push(remaining[chosen].qid);
    remaining.splice(chosen, 1);
  }

  return selected;
}

// ---------------------------------------------------------------------------
// Mastery metrics (pure)
// ---------------------------------------------------------------------------

/**
 * Returns a 0–1 mastery score for a single SR entry.
 * box 0 → 0, box 3 → 1.
 *
 * @param {{ box: number }} entry
 * @returns {number}
 */
export function questionMastery(entry) {
  return entry.box / MAX_BOX;
}

/**
 * Returns the average mastery (0–1) across all questions in a given scenario.
 * Returns 0 if the scenario is not found or has no questions with tracked state.
 *
 * @param {Object} srState     - Current SR state map.
 * @param {number} scenarioId  - Scenario ID (integer, e.g. 3).
 * @returns {number}
 */
export function scenarioMastery(srState, scenarioId) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario || scenario.questions.length === 0) return 0;

  let total = 0;
  let count = 0;
  for (const q of scenario.questions) {
    const entry = srState[q.id];
    if (entry) {
      total += questionMastery(entry);
      count += 1;
    }
  }
  return count === 0 ? 0 : total / count;
}

/**
 * Returns the overall mastery (0–1) averaged across every question in the state.
 * Returns 0 if the state is empty.
 *
 * @param {Object} srState - Current SR state map.
 * @returns {number}
 */
export function overallMastery(srState) {
  const entries = Object.values(srState);
  if (entries.length === 0) return 0;
  const total = entries.reduce((acc, entry) => acc + questionMastery(entry), 0);
  return total / entries.length;
}
