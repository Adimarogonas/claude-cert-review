'use client';

/**
 * ProgressContext.jsx — Client-side React context for exam progress state.
 *
 * Architecture:
 *   ProgressProvider  — wraps the app; hydrates from localStorage after mount,
 *                       persists on every change via saveProgress().
 *   useProgress()     — hook for consumers; throws if used outside provider.
 *
 * SSR / hydration-mismatch prevention:
 *   Initial state is always defaultProgress() so server-rendered HTML matches
 *   the first client render.  Real data is loaded in a useEffect (after mount)
 *   so the re-render is client-only and never causes a hydration error.
 *
 * Persistence guard:
 *   A `hasHydrated` ref prevents saveProgress() from writing the empty
 *   defaultProgress() back to localStorage on the very first render cycle
 *   (before loadProgress() has run).  Once the mount effect fires and sets
 *   real state, subsequent [progress] changes are saved normally.
 */

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  defaultProgress,
  loadProgress,
  saveProgress,
  setAnswer,
  recordExam,
  clearAnswers,
} from '@/models/progressStore';

// ─── Context ─────────────────────────────────────────────────────────────────

const ProgressContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * ProgressProvider
 *
 * Wrap your application (or the subtree that needs progress state) with this
 * component.  It initialises state with defaultProgress() for SSR safety, then
 * hydrates from localStorage after mount.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function ProgressProvider({ children }) {
  // Start with the empty default so SSR HTML matches first client render.
  const [progress, setProgress] = useState(defaultProgress);

  // Flag: has the mount effect run and loaded real data yet?
  // Used to suppress the save-on-change effect during the first render cycle.
  const hasHydrated = useRef(false);

  // ── Effect 1: hydrate from localStorage after mount ──────────────────────
  useEffect(() => {
    const stored = loadProgress();
    hasHydrated.current = true;
    setProgress(stored);
  }, []); // run once, on mount

  // ── Effect 2: persist every change AFTER hydration ───────────────────────
  useEffect(() => {
    // Skip the save triggered by the initial default state (SSR render).
    // hasHydrated is set to true synchronously before setProgress(stored) in
    // Effect 1, so by the time this effect re-runs due to that state change
    // the flag is already true.
    if (!hasHydrated.current) return;
    saveProgress(progress);
  }, [progress]);

  // ── Mutators ─────────────────────────────────────────────────────────────

  /**
   * recordPractice(qid, selectedIndex, isCorrect)
   *
   * Records a practice-mode answer and updates spaced-repetition state.
   *
   * @param {string}  qid           — question id, e.g. '1a'
   * @param {number}  selectedIndex — 0-based option index the student picked
   * @param {boolean} isCorrect     — whether the answer is correct
   */
  function recordPractice(qid, selectedIndex, isCorrect) {
    setProgress((prev) => setAnswer(prev, qid, selectedIndex, isCorrect));
  }

  /**
   * recordExamResult(result)
   *
   * Appends a completed full-exam attempt to examHistory.
   *
   * @param {{ raw: number, total: number, scaled: number, passed: boolean }} result
   */
  function recordExamResult(result) {
    setProgress((prev) => recordExam(prev, result));
  }

  /**
   * recordSrResult(qid, isCorrect)
   *
   * Records a spaced-repetition drill answer.  Delegates to setAnswer so that
   * srState (Leitner box, attempts, etc.) is updated consistently.
   *
   * Note: selectedIndex is not meaningful for SR drills so we store -1 as a
   * sentinel.  The submitted flag is also set; callers that need to suppress
   * this can pass the current answers[qid] value instead of -1.
   *
   * @param {string}  qid       — question id
   * @param {boolean} isCorrect — whether the student got it right
   */
  function recordSrResult(qid, isCorrect) {
    setProgress((prev) => {
      // Re-use the existing selectedIndex if already answered, otherwise -1.
      const selectedIndex =
        prev.answers[qid] !== undefined ? prev.answers[qid] : -1;
      return setAnswer(prev, qid, selectedIndex, isCorrect);
    });
  }

  /**
   * persistSrBuckets(buckets)
   *
   * Stores (or clears) the durable spaced-repetition buckets — the current
   * pass partition. Pass an object { passIds, setSize, scenarioFilter } to set
   * them, or null to clear. Persisted with the rest of progress, so buckets
   * survive navigation and refresh and are only ever changed by an explicit
   * user action (generate / reshuffle / clear).
   *
   * @param {{ passIds: string[], setSize: number, scenarioFilter: number|null }|null} buckets
   */
  function persistSrBuckets(buckets) {
    setProgress((prev) => ({ ...prev, srSession: buckets }));
  }

  /**
   * resetAnswers(qids)
   *
   * Clears the recorded answers/submitted flags for the given question ids so
   * they can be attempted again. Leaves spaced-repetition state intact.
   *
   * @param {string[]} qids — question ids to clear
   */
  function resetAnswers(qids) {
    setProgress((prev) => clearAnswers(prev, qids));
  }

  /**
   * resetProgress()
   *
   * Clears all progress (answers, SR state, exam history) and persists the
   * empty state immediately so the reset survives a page refresh.
   */
  function resetProgress() {
    const fresh = defaultProgress();
    saveProgress(fresh);
    setProgress(fresh);
  }

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    progress,
    recordPractice,
    recordExamResult,
    recordSrResult,
    persistSrBuckets,
    resetAnswers,
    resetProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useProgress()
 *
 * Returns the current progress context value:
 * {
 *   progress:        Progress,
 *   recordPractice:  (qid, selectedIndex, isCorrect) => void,
 *   recordExamResult:(result) => void,
 *   recordSrResult:  (qid, isCorrect) => void,
 *   resetProgress:   () => void,
 * }
 *
 * Throws a descriptive error if called outside a <ProgressProvider>.
 *
 * @returns {{ progress: Progress,
 *             recordPractice: Function,
 *             recordExamResult: Function,
 *             recordSrResult: Function,
 *             resetProgress: Function }}
 */
export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (ctx === null) {
    throw new Error(
      'useProgress() must be called inside a <ProgressProvider>. ' +
        'Wrap your component tree with <ProgressProvider>.'
    );
  }
  return ctx;
}
