'use client';

/**
 * ExamView.jsx — Timed mock exam UI with live countdown, question navigation,
 * and scored results screen.
 *
 * Three phases driven by useExam().phase:
 *   'idle'        — Start screen with exam description and last-N history
 *   'in_progress' — Active exam: timer display, QuestionCard, navigator grid, nav buttons
 *   'completed'   — Results: raw/scaled score, pass/fail, per-question review
 */

import { useExam, TIME_PER_QUESTION_SEC, EXAM_QUESTION_COUNT } from '@/controllers/useExam';
import { useProgress } from '@/controllers/ProgressContext';
import QuestionCard from '@/views/components/QuestionCard';
import Timer from '@/views/components/Timer';
import ProgressStats from '@/views/components/ProgressStats';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format seconds as mm:ss */
function formatTime(seconds) {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Exam history summary (shown on idle screen) ───────────────────────────

function ExamHistorySummary({ examHistory }) {
  if (!examHistory || examHistory.length === 0) return null;

  const recent = examHistory.slice(-5).reverse(); // last 5, most recent first

  return (
    <div
      style={{
        marginBottom: '1.5rem',
        background: 'var(--color-background-secondary)',
        border: '1px solid var(--color-border-tertiary)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.125rem',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.6rem',
        }}
      >
        Recent exam history
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {recent.map((attempt, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 14,
            }}
          >
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {attempt.raw}/{attempt.total} raw
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {attempt.scaled} scaled
            </span>
            <span
              style={{
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: attempt.passed
                  ? 'var(--carbon)'
                  : 'var(--color-text-danger)',
              }}
            >
              {attempt.passed ? 'PASS' : 'FAIL'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phase: idle ──────────────────────────────────────────────────────────────

function IdleScreen({ startExam, examHistory }) {
  const totalQuestions = EXAM_QUESTION_COUNT;
  const minutesPerQuestion = Math.round(TIME_PER_QUESTION_SEC / 60);

  return (
    <div className="page-stack">
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h1)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.04,
          margin: '0 0 1rem',
          color: 'var(--color-text-primary)',
        }}
      >
        Mock Exam
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-deck)',
          color: 'var(--color-text-secondary)',
          margin: '0 0 2.25rem',
          fontSize: 'var(--text-subhead)',
          lineHeight: 1.6,
        }}
      >
        {totalQuestions} random questions &middot; {minutesPerQuestion} min per question &middot; passing score 720
      </p>

      <ExamHistorySummary examHistory={examHistory} />

      <button
        className="btn-accent"
        onClick={startExam}
        style={{
          fontSize: 15,
          padding: '0.8rem 1.4rem',
        }}
      >
        Start Mock Exam &rarr;
      </button>
    </div>
  );
}

// ─── Phase: in_progress ───────────────────────────────────────────────────────

function InProgressScreen({
  examQuestions,
  currentIndex,
  examAnswers,
  secondsLeft,
  currentQuestion,
  allAnswered,
  isAnswered,
  answer,
  next,
  prev,
  goTo,
  submit,
}) {
  const total = examQuestions.length;
  const answered = Object.keys(examAnswers).length;

  // Confirm-and-submit when not all questions answered
  function handleSubmitClick() {
    if (allAnswered) {
      submit();
      return;
    }
    const unanswered = total - answered;
    if (window.confirm(`You have ${unanswered} unanswered question${unanswered !== 1 ? 's' : ''}. Submit anyway?`)) {
      submit();
    }
  }

  return (
    <div className="page-stack">
      {/* ── Header bar: counter + timer ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
          Question {currentIndex + 1} of {total} &middot; {answered} answered
        </div>

        {/* Timer: useExam owns the countdown; we pass secondsLeft as totalSeconds
            so the display reflects controller state. onExpire is belt-and-suspenders. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Timer totalSeconds={secondsLeft} onExpire={submit} />
          <button className="btn-primary" onClick={handleSubmitClick}>
            Submit exam &rarr;
          </button>
        </div>
      </div>

      {/* ── Scenario context banner ── */}
      {currentQuestion && currentQuestion.scenarioTitle && (
        <div
          style={{
            background: 'var(--color-background-secondary)',
            borderLeft: '2px solid var(--carbon)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.05rem',
            marginBottom: '1rem',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
          }}
        >
          <strong style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {currentQuestion.scenarioTitle}
          </strong>
          {currentQuestion.scenarioDesc && (
            <>  {currentQuestion.scenarioDesc}</>
          )}
        </div>
      )}

      {/* ── QuestionCard ── */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedIndex={examAnswers[currentQuestion.id] !== undefined ? examAnswers[currentQuestion.id] : null}
          reveal={false}
          onSelect={(idx) => answer(currentQuestion.id, idx)}
        />
      )}

      {/* ── Navigation buttons ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: '1.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={prev}
          disabled={currentIndex === 0}
        >
          &larr; Prev
        </button>
        <button
          onClick={next}
          disabled={currentIndex === total - 1}
        >
          Next &rarr;
        </button>
      </div>

      {/* ── Question navigator grid ── */}
      <div
        style={{
          marginTop: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        {examQuestions.map((q, i) => {
          const isCurrent = i === currentIndex;
          const isDone = isAnswered(q.id);

          let bg = 'var(--color-background-secondary)';
          let color = 'var(--color-text-secondary)';
          let border = '1px solid var(--color-border-tertiary)';

          if (isDone) {
            bg = 'var(--color-background-success)';
            color = 'var(--color-text-success)';
            border = '1px solid var(--monolith)';
          }
          if (isCurrent) {
            border = '1.5px solid var(--carbon)';
            color = 'var(--carbon)';
            if (!isDone) bg = 'var(--paper)';
          }

          return (
            <div
              key={i}
              onClick={() => goTo(i)}
              title={`Question ${i + 1}${isDone ? ' (answered)' : ''}`}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
                background: bg,
                color,
                border,
                userSelect: 'none',
              }}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Phase: completed ─────────────────────────────────────────────────────────

function CompletedScreen({
  result,
  examQuestions,
  examAnswers,
  startExam,
  onNavigate,
}) {
  const { raw, total, scaled, passed } = result;
  const pointsToPass = passed ? 0 : 720 - scaled;

  const stats = [
    { label: 'Raw score', value: `${raw}/${total}` },
    { label: 'Scaled score', value: scaled },
    { label: 'Result', value: passed ? 'PASS' : 'FAIL', highlight: passed },
  ];

  return (
    <div className="page-stack">
      {/* ── Score summary ── */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-secondary)',
            marginBottom: 12,
          }}
        >
          Mock exam complete
        </div>

        <ProgressStats stats={stats} />

        <div
          style={{
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            marginTop: '0.75rem',
          }}
        >
          Passing score: 720.{' '}
          {passed
            ? 'You passed this mock exam.'
            : `You need ${pointsToPass} more point${pointsToPass !== 1 ? 's' : ''} to pass.`}
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={startExam}>
          Take Another Exam &rarr;
        </button>
        <button className="btn-ghost" onClick={() => onNavigate('home')}>
          &larr; Back to Home
        </button>
      </div>

      {/* ── Per-question review ── */}
      <div
        style={{
          borderTop: '1px solid var(--color-border-tertiary)',
          paddingTop: '1.5rem',
        }}
      >
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            marginBottom: '0.75rem',
            fontWeight: 500,
          }}
        >
          Question review
        </div>

        {examQuestions.map((q, i) => {
          const userAns = examAnswers[q.id] !== undefined ? examAnswers[q.id] : null;
          const isCorrect = userAns === q.correct;

          return (
            <div
              key={q.id}
              style={{
                marginBottom: '1.75rem',
                borderLeft: `3px solid ${
                  isCorrect
                    ? 'var(--color-border-success)'
                    : 'var(--color-border-danger)'
                }`,
                paddingLeft: '1rem',
              }}
            >
              {q.scenarioTitle && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    marginBottom: 4,
                  }}
                >
                  {q.scenarioTitle}
                </div>
              )}
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                Q{i + 1}
              </div>
              <QuestionCard
                question={q}
                selectedIndex={userAns}
                reveal={true}
                onSelect={undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ExamView ─────────────────────────────────────────────────────────────────

/**
 * ExamView
 *
 * Props:
 *   onNavigate — function(route: string) — called with 'home' to navigate back
 */
export default function ExamView({ onNavigate }) {
  const {
    phase,
    examQuestions,
    currentIndex,
    examAnswers,
    secondsLeft,
    result,
    currentQuestion,
    isAnswered,
    allAnswered,
    startExam,
    next,
    prev,
    goTo,
    answer,
    submit,
  } = useExam();

  const { progress } = useProgress();
  const examHistory = progress?.examHistory ?? [];

  if (phase === 'idle') {
    return (
      <IdleScreen
        startExam={startExam}
        examHistory={examHistory}
      />
    );
  }

  if (phase === 'in_progress') {
    return (
      <InProgressScreen
        examQuestions={examQuestions}
        currentIndex={currentIndex}
        examAnswers={examAnswers}
        secondsLeft={secondsLeft}
        currentQuestion={currentQuestion}
        allAnswered={allAnswered}
        isAnswered={isAnswered}
        answer={answer}
        next={next}
        prev={prev}
        goTo={goTo}
        submit={submit}
      />
    );
  }

  if (phase === 'completed' && result) {
    return (
      <CompletedScreen
        result={result}
        examQuestions={examQuestions}
        examAnswers={examAnswers}
        startExam={startExam}
        onNavigate={onNavigate}
      />
    );
  }

  // Fallback (should not be reached in normal flow)
  return null;
}
