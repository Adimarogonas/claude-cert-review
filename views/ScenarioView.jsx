'use client';

import QuestionCard from '@/views/components/QuestionCard';
import { useScenarioPractice } from '@/controllers/useScenarioPractice';

/**
 * ScenarioView
 *
 * Props:
 *   scenarioId  — number — the id of the scenario to display
 *   onNavigate  — function(route: string) — navigation callback
 *
 * Shows scenario title + description, score summary, and all questions
 * as QuestionCard components with immediate per-question feedback on answer.
 */
export default function ScenarioView({ scenarioId, onNavigate }) {
  const { scenarios, scenarioStats, answerQuestion, resetScenario, isSubmitted, getAnswer } =
    useScenarioPractice();

  const scenario =
    scenarios.find((sc) => sc.id === scenarioId) ?? scenarios[0];

  if (!scenario) {
    return (
      <div className="page-stack">
        <button onClick={() => onNavigate('home')}>← Back</button>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
          Scenario not found.
        </p>
      </div>
    );
  }

  const stats = scenarioStats[scenario.id] ?? { total: scenario.questions.length, answered: 0, correct: 0 };

  const scenarioIndex = scenarios.findIndex((sc) => sc.id === scenario.id);
  const nextScenario =
    scenarioIndex >= 0 && scenarioIndex < scenarios.length - 1
      ? scenarios[scenarioIndex + 1]
      : null;
  const allAnswered = stats.answered >= stats.total;

  return (
    <div className="page-stack">
      {/* Header nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('home')}>← Scenarios</button>
      </div>

      {/* Scenario info block */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-secondary)',
            marginBottom: 8,
          }}
        >
          Scenario {scenario.id} of {scenarios.length}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1.08,
            margin: '0 0 1rem',
          }}
        >
          {scenario.title}
        </h2>
        <div
          style={{
            fontFamily: 'var(--font-deck)',
            fontSize: 15,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
            background: 'var(--color-background-secondary)',
            borderLeft: '2px solid var(--carbon)',
            padding: '0.95rem 1.1rem',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {scenario.description}
        </div>

        {/* Score + redo — only shown once at least one question is answered */}
        {stats.answered > 0 && (
          <div
            style={{
              marginTop: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Score: {stats.correct}/{stats.total} &nbsp;·&nbsp;{' '}
              {stats.answered}/{stats.total} answered &nbsp;·&nbsp;{' '}
              {Math.round((stats.correct / stats.total) * 100)}% correct
            </div>
            <button
              className="btn-ghost"
              onClick={() => resetScenario(scenario.id)}
              style={{
                fontSize: 13,
                minHeight: 'auto',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
              }}
            >
              ↻ Redo scenario
            </button>
          </div>
        )}
      </div>

      {/* Questions */}
      {scenario.questions.map((q, qi) => {
        const submitted = isSubmitted(q.id);
        const selectedIndex = getAnswer(q.id) ?? null;

        return (
          <div
            key={q.id}
            style={{
              marginBottom: '2.25rem',
              paddingBottom: '2.25rem',
              borderBottom:
                qi < scenario.questions.length - 1
                  ? '1px solid var(--color-border-tertiary)'
                  : 'none',
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-secondary)',
                marginBottom: 6,
              }}
            >
              Question {qi + 1}
            </div>

            <QuestionCard
              question={q}
              selectedIndex={selectedIndex}
              reveal={submitted}
              onSelect={(idx) => {
                if (!submitted) {
                  answerQuestion(q.id, idx);
                }
              }}
            />
          </div>
        );
      })}

      {/* End-of-scenario navigation — appears once every question is answered */}
      {allAnswered && (
        <div
          style={{
            marginTop: '0.5rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid var(--color-border-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {nextScenario ? (
            <>
              <button
                className="btn-primary"
                onClick={() => onNavigate('scenario', nextScenario.id)}
              >
                Next scenario: {nextScenario.title} →
              </button>
              <button className="btn-ghost" onClick={() => onNavigate('home')}>
                All scenarios
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                You've reached the last scenario.
              </div>
              <button className="btn-primary" onClick={() => onNavigate('home')}>
                Back to all scenarios
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
