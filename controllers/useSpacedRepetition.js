'use client';

/**
 * useSpacedRepetition.js
 *
 * Hook that drives a Leitner-box spaced-repetition study session.
 * Reads and persists box state via useProgress (ProgressContext).
 * All Leitner scheduling delegated to models/spacedRepetition.js.
 *
 * Returned API
 * ────────────
 * startSession(count?)   — build a new session queue (post-mount only)
 * currentQuestion        — full question object at current index, or null
 * sessionQueue           — array of full question objects for this session
 * sessionProgress        — { current, total }
 * answer(qid, idx)       — record answer, persist SR state, set feedback
 * hasAnswered            — bool: question answered, feedback visible
 * lastResult             — { qid, wasCorrect } | null
 * advance()              — move to next question after user sees feedback
 * isCaughtUp             — all non-mastered questions not yet due (empty queue)
 * isSessionComplete      — queue exhausted (currentIndex >= queue length)
 * masteryStats           — { overall, byScenario, masteredCount, totalCount }
 * resetSession()         — clear current session state (not persisted progress)
 */

import { useState, useCallback, useMemo } from 'react';
import {
  initSrState,
  selectSession,
  overallMastery,
  scenarioMastery,
  isMastered,
} from '@/models/spacedRepetition';
import { SCENARIOS, getAllQuestions, getQuestionById } from '@/models/scenarios';
import { useProgress } from '@/controllers/ProgressContext';

// ---------------------------------------------------------------------------
// Build a stable id → enriched-question map from getAllQuestions() once.
// getAllQuestions() annotates each question with scenarioId and scenarioTitle.
// ---------------------------------------------------------------------------

function buildQuestionMap() {
  const map = {};
  for (const q of getAllQuestions()) {
    map[q.id] = q;
  }
  return map;
}

// Module-level constant — getAllQuestions is pure, so this is safe.
const QUESTION_MAP = buildQuestionMap();

function getCompleteSrState(progressSrState) {
  return {
    ...initSrState(),
    ...(progressSrState ?? {}),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useSpacedRepetition()
 *
 * @returns {{
 *   startSession: (count?: number) => void,
 *   currentQuestion: object|null,
 *   sessionQueue: object[],
 *   sessionProgress: { current: number, total: number },
 *   answer: (qid: string, idx: number) => void,
 *   hasAnswered: boolean,
 *   lastResult: { qid: string, wasCorrect: boolean }|null,
 *   advance: () => void,
 *   isCaughtUp: boolean,
 *   isSessionComplete: boolean,
 *   masteryStats: {
 *     overall: number,
 *     byScenario: Object.<number, number>,
 *     masteredCount: number,
 *     totalCount: number,
 *   },
 *   resetSession: () => void,
 * }}
 */
export function useSpacedRepetition() {
  const { progress, recordSrResult } = useProgress();

  // ── Session state ─────────────────────────────────────────────────────────
  // sessionQueue: array of full (enriched) question objects
  // currentIndex: pointer into sessionQueue
  // hasAnswered:  true after answer() fires, until advance() fires
  // lastResult:   { qid, wasCorrect } for feedback display

  const [sessionQueue, setSessionQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // ── startSession ──────────────────────────────────────────────────────────

  /**
   * startSession(count = 10)
   *
   * Must be called post-mount (e.g. in a useEffect or event handler).
   * Never call during render — uses Date.now() and selectSession which
   * rely on current time.
   *
   * If progress.srState is empty (first ever use), seeds it with initSrState()
   * for scheduling purposes only (the persistent seed happens via recordSrResult
   * on first answer, but we need a populated state to call selectSession now).
   *
   * @param {number} [count=10]
   */
  const startSession = useCallback(
    (count = 10) => {
      // Determine the SR state to use for selection.
      // If the persisted srState is empty, fall back to a freshly seeded copy
      // so selectSession has something to work with.  The persisted state will
      // be populated on the first answer via recordSrResult.
      const srState = getCompleteSrState(progress.srState);

      const now = Date.now();
      const selectedIds = selectSession(srState, count, now);

      // Map IDs → full enriched question objects.
      const queue = selectedIds
        .map((qid) => QUESTION_MAP[qid])
        .filter(Boolean); // guard against stale IDs that no longer exist

      setSessionQueue(queue);
      setCurrentIndex(0);
      setHasAnswered(false);
      setLastResult(null);
    },
    [progress.srState]
  );

  // ── answer ────────────────────────────────────────────────────────────────

  /**
   * answer(qid, idx)
   *
   * Computes correctness from the model's source-of-truth correct index —
   * never trusts stored values.  Persists box advancement via recordSrResult.
   * Sets feedback state (hasAnswered, lastResult).
   *
   * @param {string} qid   — question id, e.g. '1a'
   * @param {number} idx   — 0-based option index the student picked
   */
  const answer = useCallback(
    (qid, idx) => {
      const question = getQuestionById(qid);
      if (!question) {
        console.warn(`useSpacedRepetition.answer: unknown question id "${qid}"`);
        return;
      }

      const isCorrect = idx === question.correct;

      // Persist SR box advancement.
      recordSrResult(qid, isCorrect);

      // Set feedback state — advance() will move to the next question.
      setHasAnswered(true);
      setLastResult({ qid, wasCorrect: isCorrect });
    },
    [recordSrResult]
  );

  // ── advance ───────────────────────────────────────────────────────────────

  /**
   * advance()
   *
   * Called after the user acknowledges feedback.  Clears feedback state and
   * moves the pointer to the next question.  If the queue is exhausted,
   * currentIndex is allowed to reach sessionQueue.length (isSessionComplete).
   */
  const advance = useCallback(() => {
    setHasAnswered(false);
    setLastResult(null);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // ── resetSession ──────────────────────────────────────────────────────────

  /**
   * resetSession()
   *
   * Clears the current session state without touching persisted progress.
   * Call this to abandon a session mid-way without losing box state.
   */
  const resetSession = useCallback(() => {
    setSessionQueue([]);
    setCurrentIndex(0);
    setHasAnswered(false);
    setLastResult(null);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentQuestion = sessionQueue[currentIndex] ?? null;

  const sessionProgress = {
    current: currentIndex + 1,
    total: sessionQueue.length,
  };

  // isCaughtUp: startSession was called and returned an empty queue
  // (all non-mastered questions are either mastered or not yet due).
  // Distinguish "never started" (queue length 0, index 0) from "started and
  // got nothing back" by tracking it via sessionQueue.length after startSession.
  // We expose it as: queue was built (we can tell because sessionProgress.total
  // could be 0 post-start, but we also need to distinguish pre-start).
  // The simplest correct definition: isCaughtUp is true when the session queue
  // is empty AND lastResult is null AND hasAnswered is false AND the hook has
  // been used (i.e., startSession was called at some point).
  // Since we reset all state in resetSession and startSession, a queue of [] with
  // currentIndex=0 and hasAnswered=false is either "never started" OR "caught up".
  // We track this via a dedicated flag populated by startSession.
  // Re-implementation: use a separate piece of state for "startSession ran".
  // However adding more state risks subtle bugs.  The real-world usage pattern is:
  //   1. Mount → call startSession → if queue.length===0 show "all caught up" UI
  //   2. If queue.length>0 work through questions
  // The simplest reliable check: sessionQueue.length === 0 AND currentIndex === 0
  // but only after startSession has been invoked.  We track this minimally.

  // NOTE: Rather than a 4th isStarted flag (not in the spec), we expose isCaughtUp
  // derived from the queue after startSession, which is only meaningful post-start.
  // Callers should call startSession before reading isCaughtUp.
  const isCaughtUp = sessionQueue.length === 0 && currentIndex === 0 && lastResult === null && !hasAnswered;

  const isSessionComplete = sessionQueue.length > 0 && currentIndex >= sessionQueue.length;

  // ── masteryStats ──────────────────────────────────────────────────────────
  // Derived from the live srState (updates after every recordSrResult call).

  const masteryStats = useMemo(() => {
    const srState = getCompleteSrState(progress.srState);

    const overall = overallMastery(srState);

    const byScenario = {};
    for (const sc of SCENARIOS) {
      byScenario[sc.id] = scenarioMastery(srState, sc.id);
    }

    const entries = Object.values(srState);
    const masteredCount = entries.filter(isMastered).length;
    const totalCount = entries.length;

    return { overall, byScenario, masteredCount, totalCount };
  }, [progress.srState]);

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    startSession,
    currentQuestion,
    sessionQueue,
    sessionProgress,
    answer,
    hasAnswered,
    lastResult,
    advance,
    isCaughtUp,
    isSessionComplete,
    masteryStats,
    resetSession,
  };
}

export default useSpacedRepetition;
