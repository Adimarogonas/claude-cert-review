'use client';

/**
 * CaseStudyView.jsx — Interactive branching decision scenario player.
 *
 * Renders one domain's authored case study as a step-by-step decision game:
 * the learner reads a situation, picks an option, sees the consequence, and
 * advances once they land on the best choice. First-try-correct decisions are
 * scored. Fully self-contained (local state, no persistence) — a learning tool
 * that sits alongside the graded quiz.
 */

import { useState } from 'react';

const S = {
  root: { maxWidth: 760, margin: '0 auto' },

  scenarioCard: {
    padding: '1.25rem 1.375rem',
    background: 'var(--color-background-secondary)',
    borderLeft: '3px solid var(--carbon)',
    borderRadius: 'var(--radius-sm)',
    marginBottom: '1.5rem',
  },
  scenarioLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
  },
  scenarioText: {
    fontFamily: 'var(--font-deck)',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--color-text-primary)',
  },

  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: '1.5rem',
  },
  pip: (state) => ({
    flex: 1,
    height: 4,
    borderRadius: 2,
    background:
      state === 'done'
        ? 'var(--carbon)'
        : state === 'current'
          ? 'var(--color-text-secondary)'
          : 'var(--color-border-tertiary)',
    transition: 'background 0.2s',
  }),
  stepCounter: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
  },

  prompt: {
    fontFamily: 'var(--font-deck)',
    fontSize: 17,
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '-0.01em',
    margin: '0 0 1.25rem',
  },

  option: (state) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.8rem 1rem',
    marginBottom: 9,
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'var(--font-text)',
    cursor: state === 'idle' ? 'pointer' : 'default',
    transition: 'border-color 0.12s, background 0.12s, opacity 0.12s',
    border:
      state === 'correct'
        ? '2px solid var(--carbon)'
        : state === 'wrong'
          ? '2px solid var(--alps)'
          : '1px solid var(--color-border-tertiary)',
    background:
      state === 'correct'
        ? 'var(--color-background-success)'
        : 'var(--color-background-primary)',
    color:
      state === 'correct' ? 'var(--color-text-success)' : 'var(--color-text-primary)',
    opacity: state === 'dim' ? 0.5 : 1,
  }),
  optionRow: { display: 'flex', gap: 10, alignItems: 'baseline' },
  optionMark: (state) => ({
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 700,
    width: 16,
    color:
      state === 'correct'
        ? 'var(--color-text-success)'
        : state === 'wrong'
          ? 'var(--alps)'
          : 'var(--color-text-secondary)',
  }),

  consequence: (kind) => ({
    marginTop: -2,
    marginBottom: 12,
    marginLeft: 26,
    padding: '0.7rem 0.9rem',
    fontSize: 13,
    lineHeight: 1.6,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-background-secondary)',
    borderLeft: `2px solid ${kind === 'correct' ? 'var(--carbon)' : 'var(--alps)'}`,
    color: 'var(--color-text-secondary)',
  }),

  continueBtn: {
    marginTop: 6,
    fontWeight: 500,
  },

  // Outcome screen
  outcomeCard: {
    padding: '1.5rem 1.5rem',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center',
  },
  scoreNum: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-h2)',
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1,
    margin: '0.25rem 0 0.5rem',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: 'var(--color-text-secondary)',
  },
  outcomeText: {
    fontFamily: 'var(--font-deck)',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--color-text-primary)',
    margin: '1.25rem 0 1.5rem',
    textAlign: 'left',
  },
};

function findCorrectIndex(options) {
  return options.findIndex((o) => o.correct === true);
}

export default function CaseStudyView({ caseStudy }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [picks, setPicks] = useState([]); // indices chosen on the current step (in order)
  const [solvedFirstTry, setSolvedFirstTry] = useState(0);
  const [done, setDone] = useState(false);

  if (!caseStudy) {
    return (
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
        No case study is available for this domain yet.
      </p>
    );
  }

  const steps = caseStudy.steps;
  const step = steps[stepIdx];
  const correctIdx = findCorrectIndex(step.options);
  const solved = picks.includes(correctIdx);

  function choose(i) {
    if (solved || picks.includes(i)) return;
    const nextPicks = [...picks, i];
    setPicks(nextPicks);
    if (i === correctIdx && picks.length === 0) {
      setSolvedFirstTry((n) => n + 1);
    }
  }

  function advance() {
    if (stepIdx + 1 >= steps.length) {
      setDone(true);
    } else {
      setStepIdx((n) => n + 1);
      setPicks([]);
    }
  }

  function restart() {
    setStepIdx(0);
    setPicks([]);
    setSolvedFirstTry(0);
    setDone(false);
  }

  // ── Outcome screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={S.root}>
        <div style={S.outcomeCard}>
          <div style={S.scoreLabel}>Decisions nailed first try</div>
          <div style={S.scoreNum}>
            {solvedFirstTry}/{steps.length}
          </div>
          <div style={S.outcomeText}>{caseStudy.outcome}</div>
          <button className="btn-primary" onClick={restart}>
            Replay case
          </button>
        </div>
      </div>
    );
  }

  // ── Active step ───────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <div style={S.scenarioCard}>
        <div style={S.scenarioLabel}>The situation</div>
        <div style={S.scenarioText}>{caseStudy.scenario}</div>
      </div>

      <div style={S.progressRow}>
        {steps.map((_, i) => (
          <div
            key={i}
            style={S.pip(i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo')}
          />
        ))}
        <span style={S.stepCounter}>
          {stepIdx + 1} / {steps.length}
        </span>
      </div>

      <p style={S.prompt}>{step.prompt}</p>

      {step.options.map((opt, i) => {
        const isPicked = picks.includes(i);
        const isCorrect = i === correctIdx;
        let state = 'idle';
        if (isPicked && isCorrect) state = 'correct';
        else if (isPicked) state = 'wrong';
        else if (solved) state = 'dim';

        return (
          <div key={i}>
            <button
              style={S.option(state)}
              onClick={() => choose(i)}
              disabled={solved || isPicked}
            >
              <span style={S.optionRow}>
                <span style={S.optionMark(state)}>
                  {state === 'correct' ? '✓' : state === 'wrong' ? '✕' : String.fromCharCode(65 + i)}
                </span>
                <span>{opt.text}</span>
              </span>
            </button>
            {isPicked && (
              <div style={S.consequence(isCorrect ? 'correct' : 'wrong')}>
                {opt.consequence}
              </div>
            )}
          </div>
        );
      })}

      {solved && (
        <button className="btn-primary" style={S.continueBtn} onClick={advance}>
          {stepIdx + 1 >= steps.length ? 'See outcome →' : 'Continue →'}
        </button>
      )}
    </div>
  );
}
