'use client';

/**
 * SpacedRepetitionView.jsx — Spaced-repetition drill mode.
 *
 * Two screens:
 *   • Dashboard — landing/overview. Mastery, the current buckets (clickable sets),
 *     and explicit bucket actions (generate / reshuffle / clear). Returning from
 *     a drill always lands here.
 *   • Drill     — one question at a time for the chosen set. Finishing the set
 *     returns to the dashboard.
 *
 * Buckets are durable (persisted in progress); they only change via explicit
 * generate / reshuffle / clear — never by leaving the screen or changing the
 * scenario/size selectors.
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
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-h1)',
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.04,
    margin: '0 0 1rem',
    color: 'var(--color-text-primary)',
  },
  subtitle: {
    fontFamily: 'var(--font-deck)',
    color: 'var(--color-text-secondary)',
    margin: '0 0 2.25rem',
    fontSize: 'var(--text-subhead)',
    lineHeight: 1.6,
    maxWidth: 620,
  },
  sectionLabel: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  statsWrap: {
    marginBottom: '1.5rem',
  },
  // Session-size picker row
  sizePicker: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  sizeBtn: (active) => ({
    padding: '0.6rem 1.1rem',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--carbon)' : 'var(--color-background-secondary)',
    color: active ? 'var(--intelligence)' : 'var(--color-text-primary)',
    cursor: 'pointer',
    border: active
      ? '1px solid var(--carbon)'
      : '1px solid var(--color-border-tertiary)',
  }),
  scenarioSelect: {
    fontFamily: 'var(--font-text)',
    padding: '0.6rem 0.75rem',
    fontSize: 14,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-background-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-secondary)',
    cursor: 'pointer',
    maxWidth: '100%',
  },
  setIndicator: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    marginBottom: '0.6rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  setNavWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: '1rem',
  },
  setChip: (active) => ({
    minWidth: 34,
    height: 34,
    padding: '0 0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    fontVariantNumeric: 'tabular-nums',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    background: active ? 'var(--paper)' : 'var(--color-background-secondary)',
    color: active ? 'var(--carbon)' : 'var(--color-text-secondary)',
    border: active
      ? '1.5px solid var(--carbon)'
      : '1px solid var(--color-border-tertiary)',
  }),
  primaryBtn: {
    padding: '0.78rem 1.4rem',
    cursor: 'pointer',
  },
  ghostBtn: {
    padding: '0.65rem 1.1rem',
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
    height: 8,
    background: 'var(--sunken)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    marginTop: 6,
  },
  masteryBarFill: (pct) => ({
    height: '100%',
    width: `${Math.min(pct, 100)}%`,
    background: 'var(--carbon)',
    transition: 'width 0.4s ease',
  }),
  // In-session progress indicator
  progressIndicator: {
    fontFamily: 'var(--font-deck)',
    fontSize: 15,
    color: 'var(--color-text-secondary)',
    marginBottom: '0.75rem',
    fontWeight: 400,
  },
  // Scenario badge
  scenarioBadge: {
    display: 'inline-block',
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.4rem 0.7rem',
    marginBottom: '1rem',
  },
  // Feedback pill after answering
  feedbackPill: (correct) => ({
    display: 'inline-block',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '0.4rem 0.85rem',
    borderRadius: 'var(--radius-sm)',
    background: correct ? 'var(--monolith)' : 'var(--paper)',
    color: correct ? 'var(--intelligence)' : 'var(--alps)',
    border: correct ? '1px solid var(--monolith)' : '1.5px solid var(--alps)',
    marginTop: '0.85rem',
    marginBottom: '0.25rem',
  }),
  // Session-complete score boxes
  scoreCard: {
    display: 'flex',
    gap: 10,
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  scoreBox: (highlight) => ({
    flex: 1,
    minWidth: 80,
    background: highlight
      ? 'var(--monolith)'
      : 'var(--color-background-secondary)',
    border: highlight
      ? '1px solid var(--monolith)'
      : '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-md)',
    padding: '1rem 1.05rem',
  }),
  scoreBoxLabel: (highlight) => ({
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: highlight ? 'rgba(245, 243, 238, 0.7)' : 'var(--color-text-secondary)',
    marginBottom: 6,
  }),
  scoreBoxValue: (highlight) => ({
    fontFamily: 'var(--font-display)',
    fontSize: 26,
    fontWeight: 500,
    letterSpacing: '-0.01em',
    color: highlight ? 'var(--intelligence)' : 'var(--color-text-primary)',
  }),
  // Dashboard set card (clickable to drill)
  setCard: {
    minWidth: 76,
    padding: '0.7rem 0.85rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  // "Set complete" banner on the dashboard
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
    padding: '0.85rem 1.05rem',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderLeft: '2px solid var(--carbon)',
  },
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

// ─── SetNavigator sub-component ──────────────────────────────────────────────
// Chips for every set in the pass. Clicking one jumps to (or redoes) that set.

function SetNavigator({ total, currentIndex, onPick }) {
  if (total <= 1) return null;
  return (
    <div style={S.setNavWrap}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          onClick={() => onPick(i)}
          title={`Set ${i + 1}${i === currentIndex ? ' (current — click to redo)' : ''}`}
          style={S.setChip(i === currentIndex)}
        >
          {i + 1}
        </div>
      ))}
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
    scenarios,
    masteryStats,
    // buckets
    bucketsExist,
    hasSets,
    isCaughtUp,
    totalSets,
    setSize,
    scenarioFilter,
    sets,
    generateBuckets,
    clearBuckets,
    // drilling
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
    // banner
    lastSetSummary,
    dismissSetSummary,
  } = useSpacedRepetition();

  // ── Local UI state ────────────────────────────────────────────────────────
  // selectedCount / selectedScenario: config form values (only used to generate)
  // localSelected: which option index the user has clicked (before/after Check)
  const [selectedCount, setSelectedCount] = useState(10);
  const [selectedScenario, setSelectedScenario] = useState('all');
  const [localSelected, setLocalSelected] = useState(null);

  // ── Derived display values ────────────────────────────────────────────────

  const masteryPct = Math.round((masteryStats.overall ?? 0) * 100);
  const masteredCount = masteryStats.masteredCount ?? 0;
  const totalCount = masteryStats.totalCount ?? 0;

  const masteryStatTiles = [
    { label: 'Overall Mastery', value: `${masteryPct}%` },
    { label: 'Questions Mastered', value: `${masteredCount} / ${totalCount}` },
  ];

  const scenarioIdArg = selectedScenario === 'all' ? null : Number(selectedScenario);

  const scenarioLabel =
    scenarioFilter == null
      ? 'All scenarios'
      : scenarios.find((sc) => sc.id === scenarioFilter)?.title ?? `Scenario ${scenarioFilter}`;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    generateBuckets(selectedCount, scenarioIdArg);
  }, [generateBuckets, selectedCount, scenarioIdArg]);

  // Reshuffle keeps the CURRENT scenario + size (changing settings never resets
  // buckets implicitly — only this explicit action does).
  const handleReshuffle = useCallback(() => {
    generateBuckets(setSize, scenarioFilter);
  }, [generateBuckets, setSize, scenarioFilter]);

  const handleStartDrill = useCallback(
    (index) => {
      setLocalSelected(null);
      startDrill(index);
    },
    [startDrill]
  );

  const handleSelect = useCallback(
    (idx) => {
      if (hasAnswered) return;
      setLocalSelected(idx);
    },
    [hasAnswered]
  );

  const handleCheck = useCallback(() => {
    if (localSelected === null || !currentQuestion || hasAnswered) return;
    answer(currentQuestion.id, localSelected);
  }, [localSelected, currentQuestion, hasAnswered, answer]);

  const handleAdvance = useCallback(() => {
    setLocalSelected(null);
    advance();
  }, [advance]);

  const handleBackToDashboard = useCallback(() => {
    setLocalSelected(null);
    endDrill();
  }, [endDrill]);

  // ════════════════════════════════════════════════════════════════════════
  // DRILL SCREEN — one question at a time for the active set.
  // ════════════════════════════════════════════════════════════════════════

  if (isDrilling) {
    const { current, total } = sessionProgress;

    return (
      <div style={S.root}>
        {/* Set indicator */}
        <div style={S.setIndicator}>
          Set {setInfo.current} of {setInfo.total}
        </div>

        {/* Jump to / redo any set without leaving the drill */}
        <SetNavigator
          total={setInfo.total}
          currentIndex={activeSetIndex}
          onPick={handleStartDrill}
        />

        <div style={S.progressIndicator}>
          Question {current} of {total}
        </div>

        <MasteryBar pct={masteryPct} />

        {currentQuestion?.scenarioTitle && (
          <div style={S.scenarioBadge}>Scenario: {currentQuestion.scenarioTitle}</div>
        )}

        <QuestionCard
          question={currentQuestion}
          selectedIndex={localSelected}
          reveal={hasAnswered}
          onSelect={handleSelect}
        />

        {!hasAnswered && (
          <div style={S.buttonRow}>
            <button
              className="btn-primary"
              style={{
                ...S.primaryBtn,
                cursor: localSelected === null ? 'not-allowed' : 'pointer',
              }}
              disabled={localSelected === null}
              onClick={handleCheck}
            >
              Check
            </button>
            <button className="btn-ghost" style={S.ghostBtn} onClick={handleBackToDashboard}>
              Back to Dashboard
            </button>
          </div>
        )}

        {hasAnswered && (
          <div>
            <div style={S.feedbackPill(lastResult?.wasCorrect)}>
              {lastResult?.wasCorrect ? 'Correct!' : 'Incorrect'}
            </div>
            <div style={S.buttonRow}>
              <button className="btn-primary" style={S.primaryBtn} onClick={handleAdvance}>
                Next
              </button>
              <button className="btn-ghost" style={S.ghostBtn} onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // DASHBOARD SCREEN — landing/overview. Always shown when not drilling.
  // ════════════════════════════════════════════════════════════════════════

  // Banner shown right after finishing a set.
  const summaryBanner = lastSetSummary && (
    <div style={S.banner}>
      <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>
        <strong style={{ fontWeight: 700 }}>Set {lastSetSummary.setIndex + 1} complete</strong>
        {' — '}
        {lastSetSummary.correct}/{lastSetSummary.total} correct (
        {lastSetSummary.total > 0
          ? Math.round((lastSetSummary.correct / lastSetSummary.total) * 100)
          : 0}
        %)
      </div>
      <button
        className="btn-ghost"
        style={S.ghostBtn}
        onClick={() => handleStartDrill(lastSetSummary.setIndex)}
      >
        ↻ Redo set
      </button>
      <button className="btn-ghost" style={S.ghostBtn} onClick={dismissSetSummary}>
        Dismiss
      </button>
    </div>
  );

  return (
    <div style={S.root}>
      <h2 style={S.title}>Spaced Repetition</h2>
      <p style={S.subtitle}>
        Questions are split into sets you work through one at a time. Pick a set to
        drill; struggling questions appear more often and mastered ones phase out.
      </p>

      {summaryBanner}

      <div style={S.statsWrap}>
        <ProgressStats stats={masteryStatTiles} />
      </div>

      <MasteryBar pct={masteryPct} />

      {/* ── No buckets yet → config (choose scenario + size, then generate) ── */}
      {!bucketsExist && (
        <>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={S.sectionLabel}>Scenario</div>
            <select
              style={S.scenarioSelect}
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
            >
              <option value="all">All scenarios</option>
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.id}. {sc.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={S.sectionLabel}>Questions per set</div>
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

          <div style={S.buttonRow}>
            <button className="btn-primary" style={S.primaryBtn} onClick={handleGenerate}>
              Generate Sets
            </button>
            <button className="btn-ghost" style={S.ghostBtn} onClick={() => onNavigate('home')}>
              Back to Home
            </button>
          </div>
        </>
      )}

      {/* ── Buckets exist but pool empty → caught up ── */}
      {isCaughtUp && (
        <>
          <p style={{ ...S.subtitle, margin: '0.5rem 0 1.5rem' }}>
            Every question in scope is mastered. Clear these sets to choose a different
            scenario, or come back later as questions cycle through review.
          </p>
          <div style={S.buttonRow}>
            <button className="btn-primary" style={S.primaryBtn} onClick={clearBuckets}>
              Clear Sets
            </button>
            <button className="btn-ghost" style={S.ghostBtn} onClick={() => onNavigate('home')}>
              Back to Home
            </button>
          </div>
        </>
      )}

      {/* ── Buckets exist with sets → the dashboard proper ── */}
      {hasSets && (
        <>
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={S.sectionLabel}>
              Your sets &middot; {scenarioLabel} &middot; {setSize} per set &middot; {totalSets} set
              {totalSets !== 1 ? 's' : ''}
            </div>
            <div style={S.setNavWrap}>
              {sets.map((s) => (
                <button
                  key={s.index}
                  className="btn-ghost"
                  style={S.setCard}
                  onClick={() => handleStartDrill(s.index)}
                  title={`Drill set ${s.index + 1}`}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Set {s.index + 1}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    {s.count} q &middot; {Math.round(s.mastery * 100)}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={S.buttonRow}>
            <button className="btn-ghost" style={S.ghostBtn} onClick={handleReshuffle}>
              ↻ Reshuffle sets
            </button>
            <button className="btn-ghost" style={S.ghostBtn} onClick={clearBuckets}>
              Clear sets
            </button>
            <button className="btn-ghost" style={S.ghostBtn} onClick={() => onNavigate('home')}>
              Back to Home
            </button>
          </div>
        </>
      )}
    </div>
  );
}
