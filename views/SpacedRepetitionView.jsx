'use client';

/**
 * SpacedRepetitionView.jsx — Spaced-repetition drill mode.
 *
 * Four UI states:
 *   1. Not started   — mastery overview + session-size control + Start button
 *   2. Caught up     — no questions due; session returned an empty queue
 *   3. In progress   — one question at a time; select → Check → Next
 *   4. Complete      — session summary with updated mastery stats
 *
 * Props
 * ─────
 *   onNavigate(mode) — navigation callback; 'home' returns to HomeView
 */

import { useState, useCallback } from 'react';
import { useSpacedRepetition } from '@/controllers/useSpacedRepetition';
import QuestionCard from '@/views/components/QuestionCard';
import ProgressStats from '@/views/components/ProgressStats';

// ─── Styles ────────────────────────────────────────────────────────────────────
// All colours use var(--color-*) custom property tokens, matching HomeView.jsx.

const S = {
  root: {
    padding: '0',
    maxWidth: 840,
    margin: '0 auto',
  },
  title: {
    fontSize: 34,
    fontWeight: 750,
    lineHeight: 1.12,
    margin: '0 0 0.75rem',
    color: 'var(--color-text-primary)',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    margin: '0 0 2rem',
    fontSize: 16,
    lineHeight: 1.65,
    maxWidth: 680,
  },
  sectionLabel: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    marginBottom: 6,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statsWrap: {
    marginBottom: '1.5rem',
  },
  // Session-size picker row
  sizePicker: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  sizeBtn: (active) => ({
    padding: '0.65rem 1rem',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    borderRadius: 8,
    background: active
      ? 'var(--color-background-success)'
      : 'var(--color-background-secondary)',
    color: active
      ? 'var(--color-text-success)'
      : 'var(--color-text-primary)',
    cursor: 'pointer',
    border: active
      ? '1px solid var(--color-border-success)'
      : '1px solid var(--color-border-tertiary)',
  }),
  primaryBtn: {
    fontWeight: 500,
    padding: '0.75rem 1.25rem',
    cursor: 'pointer',
  },
  ghostBtn: {
    fontWeight: 400,
    padding: '0.65rem 1.1rem',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: '1rem',
  },
  // Mastery progress bar
  masteryBarWrap: {
    marginBottom: '1rem',
  },
  masteryBarTrack: {
    height: 10,
    background: 'var(--color-background-secondary)',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 4,
  },
  masteryBarFill: (pct) => ({
    height: '100%',
    width: `${Math.min(pct, 100)}%`,
    background: 'var(--color-background-success)',
    borderRadius: 99,
    transition: 'width 0.4s ease',
  }),
  // In-session progress indicator
  progressIndicator: {
    fontSize: 15,
    color: 'var(--color-text-secondary)',
    marginBottom: '0.75rem',
    fontWeight: 500,
  },
  // Scenario badge
  scenarioBadge: {
    display: 'inline-block',
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 999,
    padding: '0.45rem 0.75rem',
    marginBottom: '1rem',
  },
  // Feedback pill after answering
  feedbackPill: (correct) => ({
    display: 'inline-block',
    fontWeight: 600,
    fontSize: 14,
    padding: '0.35rem 0.9rem',
    borderRadius: 999,
    background: correct
      ? 'var(--color-background-success)'
      : 'var(--color-background-danger)',
    color: correct
      ? 'var(--color-text-success)'
      : 'var(--color-text-danger)',
    marginTop: '0.75rem',
    marginBottom: '0.25rem',
  }),
  // Session-complete score boxes
  scoreCard: {
    display: 'flex',
    gap: 12,
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  scoreBox: (highlight) => ({
    flex: 1,
    minWidth: 80,
    background: highlight
      ? 'var(--color-background-success)'
      : 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 10,
    padding: '1rem',
  }),
  scoreBoxLabel: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    marginBottom: 2,
  },
  scoreBoxValue: (highlight) => ({
    fontSize: 24,
    fontWeight: 500,
    color: highlight
      ? 'var(--color-text-success)'
      : 'var(--color-text-primary)',
  }),
};

// ─── Session-size options ──────────────────────────────────────────────────────

const SIZE_OPTIONS = [
  { label: '10', value: 10 },
  { label: '15', value: 15 },
  { label: '20', value: 20 },
];

// ─── MasteryBar sub-component ─────────────────────────────────────────────────

function MasteryBar({ pct }) {
  return (
    <div style={S.masteryBarWrap}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <span style={S.sectionLabel}>Mastery</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{pct}%</span>
      </div>
      <div style={S.masteryBarTrack}>
        <div style={S.masteryBarFill(pct)} />
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * SpacedRepetitionView
 *
 * @param {{ onNavigate: (mode: string) => void }} props
 */
export default function SpacedRepetitionView({ onNavigate }) {
  const {
    startSession,
    currentQuestion,
    sessionProgress,
    answer,
    hasAnswered,
    lastResult,
    advance,
    isCaughtUp,
    isSessionComplete,
    masteryStats,
    resetSession,
  } = useSpacedRepetition();

  // ── Local UI state ────────────────────────────────────────────────────────
  // hasStarted: distinguishes "pre-start" from "isCaughtUp" (both have empty queue)
  const [hasStarted, setHasStarted] = useState(false);
  // selectedCount: session-size picker value
  const [selectedCount, setSelectedCount] = useState(10);
  // localSelected: which option index the user has clicked (before or after Check)
  const [localSelected, setLocalSelected] = useState(null);
  // sessionCorrectCount: running tally of correct answers in current session
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);

  // ── Derived display values ────────────────────────────────────────────────

  const masteryPct = Math.round((masteryStats.overall ?? 0) * 100);
  const masteredCount = masteryStats.masteredCount ?? 0;
  const totalCount = masteryStats.totalCount ?? 0;

  const masteryStatTiles = [
    { label: 'Overall Mastery', value: `${masteryPct}%` },
    { label: 'Questions Mastered', value: `${masteredCount} / ${totalCount}` },
  ];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = useCallback(
    (count) => {
      setHasStarted(true);
      setLocalSelected(null);
      setSessionCorrectCount(0);
      startSession(count);
    },
    [startSession]
  );

  // User clicks an option — just highlight it locally; don't submit yet.
  const handleSelect = useCallback(
    (idx) => {
      if (hasAnswered) return; // already checked — ignore clicks
      setLocalSelected(idx);
    },
    [hasAnswered]
  );

  // User clicks "Check" — submit the locally-selected answer to the controller.
  const handleCheck = useCallback(() => {
    if (localSelected === null || !currentQuestion || hasAnswered) return;
    answer(currentQuestion.id, localSelected);
  }, [localSelected, currentQuestion, hasAnswered, answer]);

  // User clicks "Next" — advance to the next question.
  const handleAdvance = useCallback(() => {
    if (lastResult?.wasCorrect) {
      setSessionCorrectCount((n) => n + 1);
    }
    setLocalSelected(null);
    advance();
  }, [lastResult, advance]);

  // Return to the start screen without losing persisted SR progress.
  const handleReset = useCallback(() => {
    setHasStarted(false);
    setLocalSelected(null);
    setSessionCorrectCount(0);
    resetSession();
  }, [resetSession]);

  // ── STATE 1 — Not started ─────────────────────────────────────────────────

  if (!hasStarted) {
    return (
      <div style={S.root}>
        <h2 style={S.title}>Spaced Repetition Practice</h2>
        <p style={S.subtitle}>
          Questions you struggle with appear more often. Mastered questions phase out
          automatically.
        </p>

        {/* Mastery stats tiles */}
        <div style={S.statsWrap}>
          <ProgressStats stats={masteryStatTiles} />
        </div>

        {/* Mastery progress bar */}
        <MasteryBar pct={masteryPct} />

        {/* Session-size picker */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={S.sectionLabel}>Session size</div>
          <div style={S.sizePicker}>
            {SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                style={S.sizeBtn(selectedCount === opt.value)}
                onClick={() => setSelectedCount(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div style={S.buttonRow}>
          <button style={S.primaryBtn} onClick={() => handleStart(selectedCount)}>
            Start Session
          </button>
          <button style={S.ghostBtn} onClick={() => onNavigate('home')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── STATE 2 — Caught up ───────────────────────────────────────────────────
  // isCaughtUp: startSession ran but returned an empty queue (nothing due).

  if (isCaughtUp && !isSessionComplete) {
    return (
      <div style={S.root}>
        <h2 style={S.title}>All Caught Up!</h2>
        <p style={S.subtitle}>
          No questions are due right now. Come back later as questions cycle through
          their review intervals.
        </p>

        <div style={S.statsWrap}>
          <ProgressStats stats={masteryStatTiles} />
        </div>

        <MasteryBar pct={masteryPct} />

        <div style={S.buttonRow}>
          <button style={S.ghostBtn} onClick={() => onNavigate('home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── STATE 4 — Session complete ────────────────────────────────────────────
  // Check before STATE 3 — isSessionComplete takes precedence.

  if (isSessionComplete) {
    const displayCorrect = sessionCorrectCount;
    const displayTotal = sessionProgress.total;
    const accuracyPct =
      displayTotal > 0 ? Math.round((displayCorrect / displayTotal) * 100) : 0;

    return (
      <div style={S.root}>
        <h2 style={S.title}>Session Complete!</h2>
        <p style={S.subtitle}>Here's how you did this session:</p>

        {/* Score summary */}
        <div style={S.scoreCard}>
          <div style={S.scoreBox(true)}>
            <div style={S.scoreBoxLabel}>Correct</div>
            <div style={S.scoreBoxValue(true)}>{displayCorrect}</div>
          </div>
          <div style={S.scoreBox(false)}>
            <div style={S.scoreBoxLabel}>Total</div>
            <div style={S.scoreBoxValue(false)}>{displayTotal}</div>
          </div>
          <div style={S.scoreBox(false)}>
            <div style={S.scoreBoxLabel}>Accuracy</div>
            <div style={S.scoreBoxValue(false)}>{accuracyPct}%</div>
          </div>
        </div>

        {/* Updated mastery after session */}
        <div style={{ ...S.sectionLabel, marginBottom: '0.75rem' }}>Updated Mastery</div>
        <div style={S.statsWrap}>
          <ProgressStats stats={masteryStatTiles} />
        </div>

        <MasteryBar pct={masteryPct} />

        <div style={S.buttonRow}>
          <button style={S.primaryBtn} onClick={() => handleStart(selectedCount)}>
            Start New Session
          </button>
          <button style={S.ghostBtn} onClick={() => onNavigate('home')}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── STATE 3 — Session in progress ────────────────────────────────────────
  // currentQuestion is non-null here (all other states are handled above).

  const { current, total } = sessionProgress;

  return (
    <div style={S.root}>
      {/* Progress indicator */}
      <div style={S.progressIndicator}>
        Question {current} of {total}
      </div>

      {/* Mastery bar — updates live as the SR state advances */}
      <MasteryBar pct={masteryPct} />

      {/* Scenario context badge */}
      {currentQuestion?.scenarioTitle && (
        <div style={S.scenarioBadge}>Scenario: {currentQuestion.scenarioTitle}</div>
      )}

      {/* Question card — shows selected highlight before Check; reveals after */}
      <QuestionCard
        question={currentQuestion}
        selectedIndex={localSelected}
        reveal={hasAnswered}
        onSelect={handleSelect}
      />

      {/* Before answering: show "Check" button (only when an option is selected) */}
      {!hasAnswered && (
        <div style={S.buttonRow}>
          <button
            style={{
              ...S.primaryBtn,
              opacity: localSelected === null ? 0.45 : 1,
              cursor: localSelected === null ? 'not-allowed' : 'pointer',
            }}
            disabled={localSelected === null}
            onClick={handleCheck}
          >
            Check
          </button>
          <button style={S.ghostBtn} onClick={handleReset}>
            End Session
          </button>
        </div>
      )}

      {/* After answering: show feedback pill + Next button */}
      {hasAnswered && (
        <div>
          <div style={S.feedbackPill(lastResult?.wasCorrect)}>
            {lastResult?.wasCorrect ? 'Correct!' : 'Incorrect'}
          </div>
          <div style={S.buttonRow}>
            <button style={S.primaryBtn} onClick={handleAdvance}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
