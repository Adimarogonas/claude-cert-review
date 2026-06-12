'use client';

/**
 * useExam.js — Client-side hook managing a timed mock exam session.
 *
 * Responsibilities:
 *   - Build and shuffle questions post-mount via buildExam()
 *   - Manage navigation (next / prev / goTo)
 *   - Track per-question answers as { [qid]: selectedIndex }
 *   - Run a countdown timer; auto-submit when secondsLeft reaches 0
 *   - Score on submit via scoreExam() and persist via recordExamResult()
 *
 * SSR safety:
 *   buildExam() (which calls Math.random()) is only ever called inside
 *   startExam(), which is triggered by explicit user action after mount.
 *   No timers are started at the module or render level.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildExam, scoreExam } from '@/models/examEngine';
import { useProgress } from '@/controllers/ProgressContext';

// ─── Tunable constants ────────────────────────────────────────────────────────

/** Seconds allocated per question (120 s × 60 questions = 120 min total). */
export const TIME_PER_QUESTION_SEC = 120;

/** Number of randomly-selected questions in a mock exam. */
export const EXAM_QUESTION_COUNT = 60;

// ─── Initial state factory ────────────────────────────────────────────────────

function initialState() {
  return {
    examQuestions: [],   // question objects from buildExam()
    currentIndex: 0,     // which question is displayed
    examAnswers: {},     // { [qid]: selectedOptionIndex }
    submitted: false,
    secondsLeft: 0,
    result: null,        // scoreExam() return value
    phase: 'idle',       // 'idle' | 'in_progress' | 'completed'
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useExam()
 *
 * Returns exam session state and actions:
 * {
 *   // ── state ──────────────────────────────────────────────────────────────
 *   examQuestions:    object[]         — shuffled question objects
 *   currentIndex:     number           — index of displayed question
 *   examAnswers:      { [qid]: number} — selected option per question id
 *   submitted:        boolean
 *   secondsLeft:      number
 *   result:           object | null    — scoreExam() output after submit
 *   phase:            'idle' | 'in_progress' | 'completed'
 *   currentQuestion:  object | null    — examQuestions[currentIndex]
 *
 *   // ── derived ────────────────────────────────────────────────────────────
 *   isAnswered:       (qid: string) => boolean
 *   allAnswered:      boolean
 *
 *   // ── actions ────────────────────────────────────────────────────────────
 *   startExam:        (opts?: object) => void   — builds exam + starts timer
 *   next:             () => void
 *   prev:             () => void
 *   goTo:             (index: number) => void
 *   answer:           (qid: string, idx: number) => void
 *   submit:           () => void
 * }
 */
export function useExam() {
  const [state, setState] = useState(initialState);

  // Stable ref to the interval so we can clear it from multiple call sites.
  const intervalRef = useRef(null);

  // Ref to current state — used inside the interval callback to read
  // secondsLeft without stale closure issues.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  // Ref to recordExamResult so we can call it inside submit() without
  // recreating submit every time progress changes.
  const { recordExamResult } = useProgress();
  const recordExamResultRef = useRef(recordExamResult);
  useEffect(() => {
    recordExamResultRef.current = recordExamResult;
  }, [recordExamResult]);

  // ── Clear interval helper ──────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // ── submit (stable ref pattern to allow calling from interval) ────────────

  // We keep a ref to submit so the interval callback always calls the latest
  // version without the interval itself needing to be recreated.
  const submitRef = useRef(null);

  const submit = useCallback(() => {
    setState((prev) => {
      // Guard: only submit once, and only when in progress.
      if (prev.submitted || prev.phase !== 'in_progress') return prev;

      clearTimer();

      // scoreExam expects a parallel array where each element is the selected
      // option index (or null) at the same position as examQuestions[i].
      // Our internal examAnswers is { [qid]: idx }, so we map by position.
      const answersArray = prev.examQuestions.map(
        (q) => (prev.examAnswers[q.id] !== undefined ? prev.examAnswers[q.id] : null)
      );

      const result = scoreExam(prev.examQuestions, answersArray);
      const answerResults = prev.examQuestions.map((q) => {
        const selectedIndex =
          prev.examAnswers[q.id] !== undefined ? prev.examAnswers[q.id] : null;
        return {
          qid: q.id,
          selectedIndex,
          isCorrect: selectedIndex === q.correct,
        };
      });

      // Persist result via ProgressContext (side-effect inside setState is
      // acceptable here because recordExamResult is stable / queues its own
      // state update in a separate context).
      recordExamResultRef.current({ ...result, answers: answerResults });

      return {
        ...prev,
        submitted: true,
        secondsLeft: 0,
        result,
        phase: 'completed',
      };
    });
  }, [clearTimer]);

  // Keep submitRef up to date so the interval can call it.
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  // ── startExam ─────────────────────────────────────────────────────────────

  /**
   * Build and start a new exam session.
   * Safe to call only after mount (call from a button handler, never at
   * render time) — buildExam() calls Math.random() internally.
   *
   * @param {object} [opts] - Passed through to buildExam (count, rng).
   */
  const startExam = useCallback((opts) => {
    // Abort any running timer from a previous session.
    clearTimer();

    // NOTE: startExam is wired directly to onClick handlers, so `opts` is often
    // a React event rather than a real options object. Only honour an explicit
    // numeric count; otherwise default to a 60-question random exam.
    const count =
      opts && typeof opts.count === 'number' ? opts.count : EXAM_QUESTION_COUNT;
    const questions = buildExam({ count });
    const totalSeconds = questions.length * TIME_PER_QUESTION_SEC;

    setState({
      examQuestions: questions,
      currentIndex: 0,
      examAnswers: {},
      submitted: false,
      secondsLeft: totalSeconds,
      result: null,
      phase: 'in_progress',
    });

    // Start countdown — each tick decrements secondsLeft by 1.
    // When it reaches 0 we auto-submit.
    intervalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.secondsLeft <= 1) {
          // Let the interval fire submit on next tick via ref so we don't
          // call clearInterval from inside setInterval synchronously.
          setTimeout(() => submitRef.current?.(), 0);
          return { ...prev, secondsLeft: 0 };
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
  }, [clearTimer]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex >= prev.examQuestions.length - 1) return prev;
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  const prev = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex <= 0) return prev;
      return { ...prev, currentIndex: prev.currentIndex - 1 };
    });
  }, []);

  const goTo = useCallback((index) => {
    setState((prev) => {
      if (index < 0 || index >= prev.examQuestions.length) return prev;
      return { ...prev, currentIndex: index };
    });
  }, []);

  // ── Answer ────────────────────────────────────────────────────────────────

  /**
   * Record the selected option for a question.
   * @param {string} qid  - Question id (e.g. '1a')
   * @param {number} idx  - 0-based option index
   */
  const answer = useCallback((qid, idx) => {
    setState((prev) => {
      if (prev.submitted) return prev; // ignore answers after submit
      return {
        ...prev,
        examAnswers: { ...prev.examAnswers, [qid]: idx },
      };
    });
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const currentQuestion =
    state.examQuestions.length > 0
      ? state.examQuestions[state.currentIndex] ?? null
      : null;

  const isAnswered = useCallback(
    (qid) => state.examAnswers[qid] !== undefined,
    [state.examAnswers]
  );

  const allAnswered =
    state.examQuestions.length > 0 &&
    state.examQuestions.every((q) => state.examAnswers[q.id] !== undefined);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    // State
    examQuestions: state.examQuestions,
    currentIndex: state.currentIndex,
    examAnswers: state.examAnswers,
    submitted: state.submitted,
    secondsLeft: state.secondsLeft,
    result: state.result,
    phase: state.phase,

    // Derived
    currentQuestion,
    isAnswered,
    allAnswered,

    // Actions
    startExam,
    next,
    prev,
    goTo,
    answer,
    submit,
  };
}

export default useExam;
