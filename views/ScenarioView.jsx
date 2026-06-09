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
  const { scenarios, scenarioStats, answerQuestion, isSubmitted, getAnswer } =
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

  return (
    <div className="page-stack">
      {/* Header nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('home')}>← Scenarios</button>
      </div>

      {/* Scenario info block */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          Scenario {scenario.id} of {scenarios.length}
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 750, lineHeight: 1.18, margin: '0 0 0.75rem' }}>
          {scenario.title}
        </h2>
        <div
          style={{
            fontSize: 15,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            background: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border-tertiary)',
            padding: '1rem 1.125rem',
            borderRadius: 10,
          }}
        >
          {scenario.description}
        </div>

        {/* Score — only shown once at least one question is answered */}
        {stats.answered > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Score: {stats.correct}/{stats.total} &nbsp;·&nbsp;{' '}
            {stats.answered}/{stats.total} answered &nbsp;·&nbsp;{' '}
            {Math.round((stats.correct / stats.total) * 100)}% correct
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
    </div>
  );
}
