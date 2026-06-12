'use client';

import { useState } from 'react';
import QuestionCard from '@/views/components/QuestionCard';
import { useScenarioPractice } from '@/controllers/useScenarioPractice';

/**
 * ReviewView
 *
 * Props:
 *   onNavigate — function(route: string) — navigation callback
 *
 * Shows all questions grouped by filter. Filter chips display live counts.
 * Every QuestionCard renders with reveal=true so the correct answer and
 * explanation are always visible. selectedIndex reflects what the student
 * answered (may be undefined/null if unanswered).
 */
export default function ReviewView({ onNavigate }) {
  const { getReviewQuestions, reviewCounts, getAnswer } = useScenarioPractice();

  const [filter, setFilter] = useState('all');

  const FILTERS = [
    { key: 'all',        label: 'All',        count: reviewCounts.all },
    { key: 'correct',    label: 'Correct',    count: reviewCounts.correct },
    { key: 'incorrect',  label: 'Incorrect',  count: reviewCounts.incorrect },
    { key: 'unanswered', label: 'Unanswered', count: reviewCounts.unanswered },
  ];

  const questions = getReviewQuestions(filter);

  return (
    <div className="page-stack">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={() => onNavigate('home')}>← Back</button>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-h2)',
            fontWeight: 500,
            letterSpacing: '-0.015em',
            lineHeight: 1.08,
            margin: 0,
          }}
        >
          All questions
        </h2>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, label, count }) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              className={isActive ? 'btn-primary' : undefined}
              onClick={() => setFilter(key)}
              style={{
                fontSize: 13,
                minHeight: 'auto',
                padding: '0.5rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Question list */}
      {questions.length === 0 ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            fontSize: 14,
          }}
        >
          No questions in this category yet.
        </div>
      ) : (
        questions.map((q) => {
          const selectedIndex = getAnswer(q.id) ?? null;
          const hasAnswer = selectedIndex !== null;

          // Border color mirrors original: unanswered → secondary, correct → success, incorrect → danger
          const borderColor =
            !hasAnswer
              ? 'var(--color-border-secondary)'
              : selectedIndex === q.correct
              ? 'var(--color-border-success)'
              : 'var(--color-border-danger)';

          return (
            <div
              key={q.id}
              style={{
                marginBottom: '2rem',
                borderLeft: `3px solid ${borderColor}`,
                paddingLeft: '1.125rem',
              }}
            >
              {/* Scenario label */}
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 4,
                }}
              >
                {q.scenarioTitle}
              </div>

              <QuestionCard
                question={q}
                selectedIndex={selectedIndex}
                reveal={true}
                onSelect={undefined}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
