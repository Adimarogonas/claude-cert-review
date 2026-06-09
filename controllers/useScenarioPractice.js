'use client';

/**
 * useScenarioPractice.js
 *
 * Hook that drives practice-by-scenario and the cross-scenario review/filter
 * mode.  Pure orchestration layer over models/scenarios and useProgress —
 * no direct localStorage access.
 *
 * Returned API
 * ────────────
 * scenarios          — full SCENARIOS array from models/scenarios
 * scenarioStats      — { [scenarioId]: { total, answered, correct } }
 * answerQuestion(qid, idx) — look up correct index, delegate to recordPractice
 * isSubmitted(qid)   — bool, derived from progress.submitted
 * getAnswer(qid)     — progress.answers[qid] (undefined if unanswered)
 * getReviewQuestions(filter) — filtered flat question list ('all' | 'correct' |
 *                              'incorrect' | 'unanswered')
 * reviewCounts       — { all, correct, incorrect, unanswered } counts
 */

import { useMemo } from 'react';
import { SCENARIOS, getAllQuestions, getQuestionById } from '@/models/scenarios';
import { useProgress } from '@/controllers/ProgressContext';

/**
 * useScenarioPractice()
 *
 * @returns {{
 *   scenarios: Array,
 *   scenarioStats: Object,
 *   answerQuestion: (qid: string, idx: number) => void,
 *   isSubmitted: (qid: string) => boolean,
 *   getAnswer: (qid: string) => number|undefined,
 *   getReviewQuestions: (filter: 'all'|'correct'|'incorrect'|'unanswered') => Array,
 *   reviewCounts: { all: number, correct: number, incorrect: number, unanswered: number }
 * }}
 */
export function useScenarioPractice() {
  const { progress, recordPractice } = useProgress();
  const { answers, submitted } = progress;

  // ── scenarioStats ──────────────────────────────────────────────────────────
  // Derive per-scenario stats by iterating each scenario's questions and
  // checking the stored selected index against the source-of-truth correct
  // index from scenarios.js.  Never trusts a stored isCorrect flag.

  const scenarioStats = useMemo(() => {
    const stats = {};
    for (const scenario of SCENARIOS) {
      let answered = 0;
      let correct = 0;
      const total = scenario.questions.length;

      for (const q of scenario.questions) {
        const selectedIdx = answers[q.id];
        if (selectedIdx !== undefined) {
          answered++;
          // Correctness determined by comparing to the model's correct index.
          if (selectedIdx === q.correct) {
            correct++;
          }
        }
      }

      stats[scenario.id] = { total, answered, correct };
    }
    return stats;
  }, [answers]);

  // ── reviewCounts + flat question lists ────────────────────────────────────
  // Compute all four filtered lists in a single pass to avoid redundant work.

  const { allQuestions, correctQuestions, incorrectQuestions, unansweredQuestions } =
    useMemo(() => {
      const all = getAllQuestions();
      const correct = [];
      const incorrect = [];
      const unanswered = [];

      for (const q of all) {
        const selectedIdx = answers[q.id];
        if (selectedIdx === undefined) {
          unanswered.push(q);
        } else if (selectedIdx === q.correct) {
          correct.push(q);
        } else {
          incorrect.push(q);
        }
      }

      return {
        allQuestions: all,
        correctQuestions: correct,
        incorrectQuestions: incorrect,
        unansweredQuestions: unanswered,
      };
    }, [answers]);

  const reviewCounts = useMemo(
    () => ({
      all: allQuestions.length,
      correct: correctQuestions.length,
      incorrect: incorrectQuestions.length,
      unanswered: unansweredQuestions.length,
    }),
    [allQuestions, correctQuestions, incorrectQuestions, unansweredQuestions]
  );

  // ── API functions ──────────────────────────────────────────────────────────

  /**
   * answerQuestion(qid, idx)
   *
   * Looks up the correct index from getQuestionById (source-of-truth from
   * models/scenarios.js) and delegates to recordPractice with the derived
   * isCorrect boolean.  Never stores a raw isCorrect that could drift.
   *
   * @param {string} qid  — question id, e.g. '1a'
   * @param {number} idx  — 0-based option index selected by the student
   */
  function answerQuestion(qid, idx) {
    const question = getQuestionById(qid);
    if (!question) {
      console.warn(`useScenarioPractice.answerQuestion: unknown question id "${qid}"`);
      return;
    }
    const isCorrect = idx === question.correct;
    recordPractice(qid, idx, isCorrect);
  }

  /**
   * isSubmitted(qid)
   *
   * Returns true when the question has been submitted (answer locked in).
   * Checks progress.submitted first; falls back to checking progress.answers
   * so callers don't need to worry about the hydration sequence.
   *
   * @param {string} qid
   * @returns {boolean}
   */
  function isSubmitted(qid) {
    if (submitted && submitted[qid] !== undefined) {
      return Boolean(submitted[qid]);
    }
    // Fallback: if an answer is recorded the question is effectively submitted.
    return answers[qid] !== undefined;
  }

  /**
   * getAnswer(qid)
   *
   * Returns the stored selected option index, or undefined if unanswered.
   *
   * @param {string} qid
   * @returns {number|undefined}
   */
  function getAnswer(qid) {
    return answers[qid];
  }

  /**
   * getReviewQuestions(filter)
   *
   * Returns a flat array of question objects filtered by answer state.
   *
   * @param {'all'|'correct'|'incorrect'|'unanswered'} filter
   * @returns {Array}
   */
  function getReviewQuestions(filter) {
    switch (filter) {
      case 'correct':
        return correctQuestions;
      case 'incorrect':
        return incorrectQuestions;
      case 'unanswered':
        return unansweredQuestions;
      case 'all':
      default:
        return allQuestions;
    }
  }

  return {
    scenarios: SCENARIOS,
    scenarioStats,
    answerQuestion,
    isSubmitted,
    getAnswer,
    getReviewQuestions,
    reviewCounts,
  };
}

export default useScenarioPractice;
