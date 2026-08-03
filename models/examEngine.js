// Pure JS model — no React, no browser globals, no 'use client'.
// No top-level randomness: Math.random() is called only inside pure functions.
// The controller must call buildExam() post-mount to avoid SSR hydration mismatch.

import { getAllQuestions } from '@/models/scenarios';

/** Passing scaled score threshold (AWS-style 100–1000 scale). */
export const PASS_SCALED = 720;

/**
 * Fisher-Yates in-place shuffle. Pure function — mutates and returns the array.
 * Accepts an optional seeded RNG for testing; defaults to Math.random.
 * @param {any[]} array - Array to shuffle (will be mutated).
 * @param {() => number} [rng=Math.random]
 * @returns {any[]}
 */
function shuffleInPlace(array, rng = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
  return array;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Matches the ways explanations in the question bank cite an option by letter:
 *   (B)   (B, D)   (B and C)   (B, C, D)   Option B   Options B and C   B is
 * Deliberately narrow — a bare capital letter in prose must NOT be rewritten.
 */
const OPTION_REF_RE =
  /\((?:[A-D])(?:\s*(?:,|and|or|\/|&)\s*[A-D])*\)|\bOptions?\s+[A-D](?:\s*(?:,|and|or|\/|&)\s*[A-D])*|\b[A-D]\s+(?:is|are)\b/g;

/**
 * Rewrite option-letter citations in an explanation to follow the shuffle.
 *
 * Without this, shuffling options silently invalidates ~29% of explanations:
 * the prose still says "(D)" while D now labels a different option, so the
 * review screen contradicts the answer it just marked correct.
 *
 * @param {string} explanation
 * @param {number[]} positionOf - positionOf[originalIndex] = shuffledIndex
 * @returns {string}
 */
function remapExplanationLetters(explanation, positionOf) {
  if (!explanation) return explanation;
  return explanation.replace(OPTION_REF_RE, (fragment) =>
    fragment.replace(/[A-D]/g, (letter) => {
      const moved = positionOf[OPTION_LETTERS.indexOf(letter)];
      // Leave the letter alone if it can't be mapped (e.g. a 3-option question).
      return moved === undefined ? letter : OPTION_LETTERS[moved];
    })
  );
}

/**
 * Shuffle a question's answer options, remapping the correct index and any
 * option-letter references inside the explanation.
 * Returns a new question object — does not mutate the original.
 * @param {object} question - { options: string[], correct: number, ...rest }
 * @param {() => number} [rng=Math.random]
 * @returns {object}
 */
function shuffleOptions(question, rng = Math.random) {
  // Shuffle indices rather than the options themselves so the permutation is
  // recoverable — the explanation needs it. Consumes the same number of rng()
  // calls as shuffling the options array directly.
  const order = shuffleInPlace(question.options.map((_, i) => i), rng);
  const positionOf = [];
  order.forEach((originalIndex, shuffledIndex) => {
    positionOf[originalIndex] = shuffledIndex;
  });

  return {
    ...question,
    options: order.map((originalIndex) => question.options[originalIndex]),
    correct: positionOf[question.correct],
    explanation: remapExplanationLetters(question.explanation, positionOf),
  };
}

/**
 * Build a randomized mock exam from the full scenario question bank.
 *
 * @param {object} [options]
 * @param {number} [options.count] - Number of questions to include (default: all).
 * @param {() => number} [options.rng=Math.random] - RNG for reproducible tests.
 * @returns {object[]} Shuffled array of question objects with shuffled answer options.
 */
export function buildExam({ count, rng = Math.random } = {}) {
  const all = getAllQuestions();
  const shuffled = shuffleInPlace([...all], rng); // copy first — keep source intact
  const questions = count !== undefined && count < shuffled.length
    ? shuffled.slice(0, count)
    : shuffled;
  return questions.map(q => shuffleOptions(q, rng));
}

/**
 * Score a completed exam.
 *
 * FIX: original index.jsx (lines 1376-1377) double-scaled:
 *   pct = round(score/len*1000); scaled = round(100 + (pct/100)*900)
 *   This computed pct on a 0-1000 range and then multiplied again, producing
 *   values well above 1000 (e.g. 90% correct -> pct=900 -> scaled=100+8100=8200).
 *
 * CORRECT formula: single linear map from raw ratio to 100-1000 scale.
 *   scaled = Math.round(100 + (raw / total) * 900)
 *   0% correct  -> 100
 *   100% correct -> 1000
 *
 * @param {object[]} examQuestions - Questions returned by buildExam().
 * @param {(number|null)[]} examAnswers - Parallel array; each element is the
 *   selected option index (0-based) or null if unanswered.
 * @returns {{ raw: number, total: number, percent: number, scaled: number, passed: boolean }}
 */
export function scoreExam(examQuestions, examAnswers) {
  const total = examQuestions.length;

  let raw = 0;
  for (let i = 0; i < total; i++) {
    if (examAnswers[i] === examQuestions[i].correct) {
      raw += 1;
    }
  }

  const percent = total > 0 ? Math.round((raw / total) * 100) : 0;

  // Single linear map: 0% -> 100, 100% -> 1000 (no double-scaling).
  const scaled = total > 0 ? Math.round(100 + (raw / total) * 900) : 100;

  const passed = scaled >= PASS_SCALED;

  return { raw, total, percent, scaled, passed };
}
