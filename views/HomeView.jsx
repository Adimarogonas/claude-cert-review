'use client';

/**
 * HomeView.jsx — Landing screen.
 *
 * Shows overall stats, three study-mode entry points (Mock Exam,
 * Practice by Scenario, Spaced Repetition) plus Review Answers, a spaced-
 * repetition mastery readout, the per-scenario score list, and the last
 * exam result if one exists.
 *
 * Props
 * ─────
 *   onNavigate(mode, scenarioId?) — navigation callback
 *     modes: 'home' | 'scenario' | 'review' | 'exam' | 'spaced'
 *     scenarioId: optional numeric id passed when navigating to a specific
 *                 scenario from the scenario list
 */

import { useMemo } from 'react';
import { useProgress } from '@/controllers/ProgressContext';
import { useScenarioPractice } from '@/controllers/useScenarioPractice';
import { useSpacedRepetition } from '@/controllers/useSpacedRepetition';
import ProgressStats from '@/views/components/ProgressStats';

// ─── Styles ───────────────────────────────────────────────────────────────────
// All colours use var(--color-*) custom property tokens to match index.jsx.

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
  },
  subtitle: {
    fontFamily: 'var(--font-deck)',
    color: 'var(--color-text-secondary)',
    margin: '0 0 2.25rem',
    fontSize: 'var(--text-subhead)',
    fontWeight: 400,
    lineHeight: 1.6,
    maxWidth: 620,
  },
  statsWrap: {
    marginBottom: '1.75rem',
  },
  modePicker: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 10,
    marginBottom: '1rem',
  },
  modeBtn: {
    justifyContent: 'center',
    fontWeight: 500,
    padding: '0.95rem 1rem',
  },
  masteryReadout: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginBottom: '1.5rem',
    padding: '0.6rem 0.85rem',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-sm)',
    display: 'inline-block',
  },
  lastExamWrap: {
    marginBottom: '1.5rem',
    padding: '1rem 1.125rem',
    background: 'var(--color-background-secondary)',
    borderLeft: '2px solid var(--carbon)',
    borderRadius: 'var(--radius-sm)',
  },
  lastExamLabel: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    marginBottom: 6,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  lastExamRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
  },
  scenarioSection: {
    borderTop: '1px solid var(--color-border-tertiary)',
    paddingTop: '1.75rem',
  },
  scenarioSectionLabel: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    marginBottom: '0.85rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  scenarioList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  scenarioBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    padding: '1rem 1.125rem',
    borderRadius: 'var(--radius-md)',
  },
  scenarioBtnLeft: {
    flex: 1,
    minWidth: 0,
  },
  scenarioBtnTitle: {
    fontFamily: 'var(--font-deck)',
    fontWeight: 500,
    fontSize: 15,
  },
  scenarioBtnSub: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginTop: 2,
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * HomeView
 *
 * @param {{ onNavigate: (mode: string, scenarioId?: number) => void }} props
 */
export default function HomeView({ onNavigate }) {
  const { progress } = useProgress();
  const { scenarios, scenarioStats } = useScenarioPractice();
  const { masteryStats } = useSpacedRepetition();

  // ── Derive overall totals from scenarioStats ──────────────────────────────

  const { totalQuestions, totalAnswered, totalCorrect } = useMemo(() => {
    let total = 0;
    let answered = 0;
    let correct = 0;
    for (const stat of Object.values(scenarioStats)) {
      total += stat.total;
      answered += stat.answered;
      correct += stat.correct;
    }
    return { totalQuestions: total, totalAnswered: answered, totalCorrect: correct };
  }, [scenarioStats]);

  const accuracy =
    totalAnswered > 0 ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '—';

  const examsCompleted = progress.examHistory ? progress.examHistory.length : 0;

  // ── Last exam result ───────────────────────────────────────────────────────

  const lastExam = useMemo(() => {
    if (!progress.examHistory || progress.examHistory.length === 0) return null;
    return progress.examHistory[progress.examHistory.length - 1];
  }, [progress.examHistory]);

  // ── ProgressStats tiles ───────────────────────────────────────────────────

  const statsTiles = [
    { label: 'Total Questions', value: totalQuestions },
    { label: 'Answered', value: `${totalAnswered}/${totalQuestions}` },
    { label: 'Correct', value: totalCorrect },
    { label: 'Accuracy', value: accuracy },
    { label: 'Exams Taken', value: examsCompleted },
  ];

  // ── Mastery display values ────────────────────────────────────────────────

  const masteryPct = Math.round((masteryStats.overall ?? 0) * 100);
  const masteredCount = masteryStats.masteredCount ?? 0;
  const totalSrCount = masteryStats.totalCount ?? totalQuestions;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={S.root}>
      {/* Header */}
      <h2 style={S.title}>Claude Certified Architect — Practice Exam</h2>
      <p style={S.subtitle}>
        {totalQuestions} questions across {scenarios.length} scenarios. Study by scenario, take a
        mock exam, or drill with spaced repetition.
      </p>

      {/* Overall stats grid */}
      <div style={S.statsWrap}>
        <ProgressStats stats={statsTiles} />
      </div>

      {/* Mode picker */}
      <div style={S.modePicker}>
        <button className="btn-primary" style={S.modeBtn} onClick={() => onNavigate('exam')}>
          Mock Exam ↗
        </button>
        <button style={S.modeBtn} onClick={() => onNavigate('scenario')}>
          Practice by Scenario
        </button>
        <button style={S.modeBtn} onClick={() => onNavigate('spaced')}>
          Spaced Repetition — {masteryPct}% mastered
        </button>
        <button style={S.modeBtn} onClick={() => onNavigate('review')}>
          Review Answers
        </button>
      </div>

      {/* Spaced repetition mastery readout */}
      <div style={S.masteryReadout}>
        {masteryPct}% mastered &middot; {masteredCount}/{totalSrCount} questions
      </div>

      {/* Last exam result (if any) */}
      {lastExam && (
        <div style={S.lastExamWrap}>
          <div style={S.lastExamLabel}>Last mock exam</div>
          <div style={S.lastExamRow}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Scaled score&nbsp;
              </span>
              <span style={{ fontSize: 18, fontWeight: 500 }}>{lastExam.scaled}</span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: lastExam.passed
                  ? 'var(--carbon)'
                  : 'var(--color-text-secondary)',
              }}
            >
              {lastExam.passed ? 'Pass ✓' : 'Not yet'}
            </div>
            {!lastExam.passed && (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {720 - lastExam.scaled} points to passing
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scenario list */}
      <div style={S.scenarioSection}>
        <div style={S.scenarioSectionLabel}>Study by scenario</div>
        <div style={S.scenarioList}>
          {scenarios.map((sc) => {
            const stats = scenarioStats[sc.id] ?? { total: sc.questions.length, answered: 0, correct: 0 };
            const scAccuracy =
              stats.answered > 0
                ? `${Math.round((stats.correct / stats.answered) * 100)}%`
                : null;
            const allDone =
              stats.answered === stats.total && stats.answered > 0;
            const allCorrect = allDone && stats.correct === stats.total;

            return (
              <button
                key={sc.id}
                style={S.scenarioBtn}
                onClick={() => onNavigate('scenario', sc.id)}
              >
                <div style={S.scenarioBtnLeft}>
                  <div style={S.scenarioBtnTitle}>
                    {sc.id}. {sc.title}
                  </div>
                  <div style={S.scenarioBtnSub}>{sc.questions.length} questions</div>
                </div>

                {stats.answered > 0 && (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: allCorrect ? 700 : 400,
                      color: allCorrect
                        ? 'var(--carbon)'
                        : 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      marginLeft: 12,
                      textAlign: 'right',
                    }}
                  >
                    <div>
                      {stats.correct}/{stats.total}
                    </div>
                    {scAccuracy && (
                      <div style={{ fontSize: 12, marginTop: 1 }}>{scAccuracy}</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
