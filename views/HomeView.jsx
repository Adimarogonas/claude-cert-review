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
    fontSize: 34,
    fontWeight: 750,
    lineHeight: 1.12,
    margin: '0 0 0.75rem',
  },
  subtitle: {
    color: 'var(--color-text-secondary)',
    margin: '0 0 2rem',
    fontSize: 16,
    lineHeight: 1.65,
    maxWidth: 680,
  },
  statsWrap: {
    marginBottom: '1.75rem',
  },
  modePicker: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 12,
    marginBottom: '1rem',
  },
  modeBtn: {
    justifyContent: 'center',
    fontWeight: 700,
    padding: '0.9rem 1rem',
  },
  masteryReadout: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginBottom: '1.5rem',
    padding: '0.65rem 0.9rem',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 999,
    display: 'inline-block',
  },
  lastExamWrap: {
    marginBottom: '1.5rem',
    padding: '1rem 1.125rem',
    background: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 10,
  },
  lastExamLabel: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    marginBottom: 4,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginBottom: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  scenarioList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  scenarioBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left',
    padding: '1rem 1.125rem',
    borderRadius: 10,
  },
  scenarioBtnLeft: {
    flex: 1,
    minWidth: 0,
  },
  scenarioBtnTitle: {
    fontWeight: 700,
    fontSize: 15,
  },
  scenarioBtnSub: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginTop: 1,
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
        <button style={S.modeBtn} onClick={() => onNavigate('exam')}>
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
                fontWeight: 500,
                color: lastExam.passed
                  ? 'var(--color-text-success)'
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
                      color: allCorrect
                        ? 'var(--color-text-success)'
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
