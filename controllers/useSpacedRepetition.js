'use client';

/**
 * useSpacedRepetition.js
 *
 * Drives the spaced-repetition study mode, which has two screens:
 *
 *   • Dashboard — the landing/overview screen. Shows mastery and the current
 *     "buckets" (a fixed partition of the eligible question pool into sets).
 *     From here you pick a set to drill, regenerate buckets, or clear them.
 *   • Drill     — one question at a time for the chosen set. Finishing the set
 *     returns to the dashboard (never auto-advances into the next set).
 *
 * Durable vs transient state
 * ──────────────────────────
 * The buckets (passIds + setSize + scenarioFilter) are DURABLE: they live in
 * progress.srSession, persisted with the rest of progress, so they survive
 * navigation and refresh. They change ONLY via an explicit user action —
 * generateBuckets() or clearBuckets(). Nothing else (leaving the screen,
 * changing the scenario/size selectors) touches them.
 *
 * Which set you're drilling and how far you've got within it are TRANSIENT
 * (local component state) — leaving a drill simply returns you to the dashboard.
 *
 * The Leitner box for each question lives at the question level in srState and
 * is unaffected by how buckets are formed.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  initSrState,
  selectSession,
  overallMastery,
  scenarioMastery,
  isMastered,
  questionMastery,
} from '@/models/spacedRepetition';
import {
  SCENARIOS,
  getAllQuestions,
  getQuestionById,
  getScenarioById,
} from '@/models/scenarios';
import { useProgress } from '@/controllers/ProgressContext';

// ---------------------------------------------------------------------------
// Build a stable id → enriched-question map from getAllQuestions() once.
// ---------------------------------------------------------------------------

function buildQuestionMap() {
  const map = {};
  for (const q of getAllQuestions()) {
    map[q.id] = q;
  }
  return map;
}

const QUESTION_MAP = buildQuestionMap();

function getCompleteSrState(progressSrState) {
  return {
    ...initSrState(),
    ...(progressSrState ?? {}),
  };
}

/**
 * buildPassIds(srState, scenarioId, now)
 *
 * Orders the entire eligible (non-mastered) pool via the Leitner-weighted
 * selectSession, then optionally narrows it to a single scenario. The result is
 * a flat, ordered list of question ids that gets sliced into fixed-size sets.
 */
function buildPassIds(srState, scenarioId, now) {
  // Infinity → selectSession returns the whole pool (clamped) in weighted order.
  let ordered = selectSession(srState, Number.POSITIVE_INFINITY, now);

  if (scenarioId !== null && scenarioId !== undefined) {
    const scenario = getScenarioById(scenarioId);
    const allowed = new Set(scenario ? scenario.questions.map((q) => q.id) : []);
    ordered = ordered.filter((qid) => allowed.has(qid));
  }

  return ordered;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSpacedRepetition() {
  const { progress, recordSrResult, persistSrBuckets } = useProgress();

  // ── Durable buckets (from persisted progress) ─────────────────────────────
  const buckets = progress.srSession ?? null;
  const bucketsExist = !!buckets && Array.isArray(buckets.passIds);
  const passIds = bucketsExist ? buckets.passIds : [];
  const setSize = bucketsExist && buckets.setSize > 0 ? buckets.setSize : 10;
  const scenarioFilter = bucketsExist ? buckets.scenarioFilter ?? null : null;
  const totalSets = bucketsExist && setSize > 0 ? Math.ceil(passIds.length / setSize) : 0;

  // bucketsExist but the pool is empty → every in-scope question is mastered.
  const isCaughtUp = bucketsExist && passIds.length === 0;
  const hasSets = bucketsExist && passIds.length > 0;

  // ── Transient drilling state ──────────────────────────────────────────────
  const [activeSetIndex, setActiveSetIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [lastSetSummary, setLastSetSummary] = useState(null);

  const isDrilling = activeSetIndex !== null;

  // Questions in the set currently being drilled.
  const activeSetQuestions = useMemo(() => {
    if (activeSetIndex === null) return [];
    const start = activeSetIndex * setSize;
    return passIds
      .slice(start, start + setSize)
      .map((id) => QUESTION_MAP[id])
      .filter(Boolean);
  }, [activeSetIndex, passIds, setSize]);

  const currentQuestion = activeSetQuestions[currentIndex] ?? null;

  const sessionProgress = {
    current: currentIndex + 1,
    total: activeSetQuestions.length,
  };

  const setInfo = {
    current: (activeSetIndex ?? 0) + 1,
    total: totalSets,
  };

  // ── Per-set metadata for the dashboard ────────────────────────────────────
  const sets = useMemo(() => {
    if (!hasSets) return [];
    const srState = getCompleteSrState(progress.srState);
    const out = [];
    for (let i = 0; i < totalSets; i++) {
      const ids = passIds.slice(i * setSize, i * setSize + setSize);
      let mastery = 0;
      for (const id of ids) mastery += questionMastery(srState[id] ?? { box: 0 });
      out.push({
        index: i,
        count: ids.length,
        mastery: ids.length ? mastery / ids.length : 0,
      });
    }
    return out;
  }, [hasSets, passIds, setSize, totalSets, progress.srState]);

  // ── Bucket actions (explicit only) ────────────────────────────────────────

  /**
   * generateBuckets(count, scenarioId)
   *
   * Builds a fresh partition of the eligible pool and stores it durably. This is
   * the only path that creates/reshuffles buckets. Returns to the dashboard.
   */
  const generateBuckets = useCallback(
    (count = 10, scenarioId = null) => {
      const srState = getCompleteSrState(progress.srState);
      const now = Date.now();
      const ids = buildPassIds(srState, scenarioId, now);
      persistSrBuckets({ passIds: ids, setSize: count, scenarioFilter: scenarioId ?? null });
      setActiveSetIndex(null);
      setCurrentIndex(0);
      setHasAnswered(false);
      setLastResult(null);
      setLastSetSummary(null);
    },
    [progress.srState, persistSrBuckets]
  );

  /**
   * clearBuckets()
   *
   * The single explicit "clear" — discards the buckets entirely. Mastery in
   * srState is never touched.
   */
  const clearBuckets = useCallback(() => {
    persistSrBuckets(null);
    setActiveSetIndex(null);
    setCurrentIndex(0);
    setHasAnswered(false);
    setLastResult(null);
    setLastSetSummary(null);
  }, [persistSrBuckets]);

  // ── Drill actions ─────────────────────────────────────────────────────────

  /** Begin drilling set `index` (also used to redo the set just finished). */
  const startDrill = useCallback((index) => {
    setActiveSetIndex(index);
    setCurrentIndex(0);
    setHasAnswered(false);
    setLastResult(null);
    setCorrectCount(0);
    setLastSetSummary(null);
  }, []);

  /** Leave the drill and return to the dashboard (keeps buckets). */
  const endDrill = useCallback(() => {
    setActiveSetIndex(null);
    setCurrentIndex(0);
    setHasAnswered(false);
    setLastResult(null);
  }, []);

  /** Dismiss the "set complete" banner shown on the dashboard. */
  const dismissSetSummary = useCallback(() => setLastSetSummary(null), []);

  const answer = useCallback(
    (qid, idx) => {
      const question = getQuestionById(qid);
      if (!question) {
        console.warn(`useSpacedRepetition.answer: unknown question id "${qid}"`);
        return;
      }
      const isCorrect = idx === question.correct;
      recordSrResult(qid, isCorrect);
      if (isCorrect) setCorrectCount((n) => n + 1);
      setHasAnswered(true);
      setLastResult({ qid, wasCorrect: isCorrect });
    },
    [recordSrResult]
  );

  /**
   * advance()
   *
   * Move to the next question. If that was the last question in the set, record
   * a summary and return to the dashboard rather than rendering a separate
   * completion screen.
   */
  const advance = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= activeSetQuestions.length) {
      setLastSetSummary({
        setIndex: activeSetIndex,
        correct: correctCount,
        total: activeSetQuestions.length,
      });
      setActiveSetIndex(null);
      setCurrentIndex(0);
      setHasAnswered(false);
      setLastResult(null);
    } else {
      setCurrentIndex(next);
      setHasAnswered(false);
      setLastResult(null);
    }
  }, [currentIndex, activeSetQuestions.length, activeSetIndex, correctCount]);

  // ── masteryStats ──────────────────────────────────────────────────────────

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
    scenarios: SCENARIOS,
    masteryStats,

    // Buckets (durable)
    bucketsExist,
    hasSets,
    isCaughtUp,
    totalSets,
    setSize,
    scenarioFilter,
    sets,
    generateBuckets,
    clearBuckets,

    // Drilling (transient)
    isDrilling,
    activeSetIndex,
    startDrill,
    endDrill,
    currentQuestion,
    sessionProgress,
    setInfo,
    answer,
    hasAnswered,
    lastResult,
    advance,

    // Set-complete banner
    lastSetSummary,
    dismissSetSummary,
  };
}

export default useSpacedRepetition;
