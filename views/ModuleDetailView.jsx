'use client';

import { useState } from 'react';
import { getTaskStatement, getDomainForTask } from '@/models/modules';
import { SCENARIOS } from '@/models/scenarios';
import { getScenarioQuestionsForTask } from '@/models/scenarioMapping';
import { getCaseStudyForDomain } from '@/models/caseStudies';
import { useProgress } from '@/controllers/ProgressContext';
import CaseStudyView from '@/views/CaseStudyView';

const TABS = ['Study', 'Gotchas', 'Quiz', 'Case Study'];

const S = {
  root: { maxWidth: 840, margin: '0 auto' },
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    marginBottom: '1.25rem',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: 'var(--font-text)',
  },
  domainLabel: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 6,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-h2)',
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    margin: '0 0 1.5rem',
  },
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--color-border-tertiary)',
    marginBottom: '1.75rem',
  },
  tab: (active) => ({
    padding: '0.6rem 1.1rem',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--carbon)' : 'var(--color-text-secondary)',
    borderBottom: active ? '2px solid var(--carbon)' : '2px solid transparent',
    marginBottom: -1,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    borderBottomStyle: 'solid',
    borderBottomWidth: 2,
    borderBottomColor: active ? 'var(--carbon)' : 'transparent',
    fontFamily: 'var(--font-text)',
    transition: 'color 0.1s',
  }),
  // ── Study tab ──────────────────────────────────────────────────────────────
  studyIntro: {
    fontFamily: 'var(--font-deck)',
    fontSize: 15,
    lineHeight: 1.6,
    color: 'var(--color-text-secondary)',
    margin: '0 0 1.75rem',
    paddingBottom: '1.25rem',
    borderBottom: '1px solid var(--color-border-tertiary)',
  },
  studySection: { marginBottom: '2rem' },
  studySectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: '1rem',
  },
  studySectionTitle: {
    fontFamily: 'var(--font-deck)',
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'var(--color-text-primary)',
  },
  studySectionSub: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--color-text-secondary)',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  studyCard: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: '0.8rem 1rem',
    background: 'var(--color-background-primary)',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--color-text-primary)',
  },
  studyCardNum: {
    flexShrink: 0,
    fontFamily: 'var(--font-deck)',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--color-text-secondary)',
    minWidth: 18,
    paddingTop: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  skillTick: {
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--carbon)',
    minWidth: 18,
    paddingTop: 1,
  },
  gotchaItem: {
    padding: '0.875rem 1rem',
    background: 'var(--color-background-secondary)',
    borderLeft: '3px solid var(--alps)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  // Quiz styles
  questionWrap: {
    marginBottom: '1.75rem',
    padding: '1.25rem',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-md)',
  },
  questionText: {
    fontFamily: 'var(--font-deck)',
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 500,
    marginBottom: '1rem',
  },
  optionBtn: (state) => ({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '0.75rem 1rem',
    marginBottom: 8,
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    lineHeight: 1.5,
    cursor: state === 'default' ? 'pointer' : 'default',
    border:
      state === 'correct'
        ? '2px solid var(--carbon)'
        : state === 'wrong'
          ? '2px solid var(--alps)'
          : state === 'selected-wrong'
            ? '2px solid var(--alps)'
            : '1px solid var(--color-border-tertiary)',
    background:
      state === 'correct'
        ? 'var(--color-background-success)'
        : state === 'wrong' || state === 'selected-wrong'
          ? 'var(--color-background-danger)'
          : 'var(--color-background-primary)',
    color:
      state === 'correct'
        ? 'var(--color-text-on-success)'
        : 'var(--color-text-primary)',
    fontFamily: 'var(--font-text)',
    transition: 'border-color 0.15s, background 0.15s',
  }),
  explanation: {
    marginTop: '0.875rem',
    padding: '0.875rem 1rem',
    background: 'var(--color-background-secondary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    lineHeight: 1.65,
    color: 'var(--color-text-secondary)',
    borderLeft: '2px solid var(--carbon)',
  },
};

function StudyTab({ taskStatement }) {
  return (
    <div>
      <p style={S.studyIntro}>
        What this task statement expects you to <strong>know</strong> and be able to{' '}
        <strong>do</strong> on the exam.
      </p>

      <div style={S.studySection}>
        <div style={S.studySectionHead}>
          <span style={S.studySectionTitle}>Knowledge</span>
          <span style={S.studySectionSub}>{taskStatement.knowledge.length} concepts</span>
        </div>
        <ul style={S.cardList}>
          {taskStatement.knowledge.map((item, i) => (
            <li key={i} style={S.studyCard}>
              <span style={S.studyCardNum}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ ...S.studySection, marginBottom: 0 }}>
        <div style={S.studySectionHead}>
          <span style={S.studySectionTitle}>Skills</span>
          <span style={S.studySectionSub}>{taskStatement.skills.length} you should be able to apply</span>
        </div>
        <ul style={S.cardList}>
          {taskStatement.skills.map((item, i) => (
            <li key={i} style={S.studyCard}>
              <span style={S.skillTick}>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function GotchasTab({ taskStatement }) {
  return (
    <div>
      <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Common mistakes and exam distractors for this task statement.
      </p>
      {taskStatement.gotchas.map((g, i) => (
        <div key={i} style={S.gotchaItem}>
          {g}
        </div>
      ))}
    </div>
  );
}

function QuestionCard({ q, selected, progress, onSelect }) {
  const submittedIdx =
    selected[q.id] !== undefined
      ? selected[q.id]
      : progress.submitted[q.id]
        ? progress.answers[q.id]
        : undefined;
  const isSubmitted = submittedIdx !== undefined;

  return (
    <div style={S.questionWrap}>
      {q.scenarioTitle && (
        <div style={{
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          From: {q.scenarioTitle}
        </div>
      )}
      <div style={S.questionText}>{q.text}</div>

      {q.options.map((opt, i) => {
        let state = 'default';
        if (isSubmitted) {
          if (i === q.correct) state = 'correct';
          else if (i === submittedIdx) state = 'selected-wrong';
          else state = 'neutral';
        }

        return (
          <button
            key={i}
            style={S.optionBtn(state)}
            onClick={() => onSelect(q.id, i, q.correct)}
            disabled={isSubmitted}
          >
            <span style={{ fontWeight: 500, marginRight: 8 }}>
              {String.fromCharCode(65 + i)})
            </span>
            {opt}
          </button>
        );
      })}

      {isSubmitted && (
        <div style={S.explanation}>
          <strong>Explanation:</strong> {q.explanation}
        </div>
      )}
    </div>
  );
}

function QuizTab({ taskStatement }) {
  const { progress, recordPractice } = useProgress();
  const [selected, setSelected] = useState({});

  const scenarioQuestions = getScenarioQuestionsForTask(taskStatement.id, SCENARIOS);

  function handleSelect(qid, optIdx, correctIdx) {
    if (selected[qid] !== undefined || progress.submitted[qid]) return;
    const isCorrect = optIdx === correctIdx;
    setSelected((prev) => ({ ...prev, [qid]: optIdx }));
    recordPractice(qid, optIdx, isCorrect);
  }

  return (
    <div>
      {taskStatement.questions.map((q) => (
        <QuestionCard
          key={q.id}
          q={q}
          selected={selected}
          progress={progress}
          onSelect={handleSelect}
        />
      ))}

      {scenarioQuestions.length > 0 && (
        <>
          <div style={{
            borderTop: '1px solid var(--color-border-tertiary)',
            margin: '1.75rem 0 1.25rem',
            paddingTop: '1.25rem',
          }}>
            <div style={{
              fontSize: 11,
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '1rem',
            }}>
              Related questions from the scenario bank
            </div>
          </div>
          {scenarioQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              selected={selected}
              progress={progress}
              onSelect={handleSelect}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default function ModuleDetailView({ taskId, onBack }) {
  const [activeTab, setActiveTab] = useState('Study');
  const result = getTaskStatement(taskId);

  if (!result) {
    return (
      <div style={S.root}>
        <button style={S.back} onClick={onBack}>← Back to Modules</button>
        <p>Task statement not found.</p>
      </div>
    );
  }

  const { domain, taskStatement } = result;
  const caseStudy = getCaseStudyForDomain(domain.id);

  return (
    <div style={S.root}>
      <button style={S.back} onClick={onBack}>← Back to Modules</button>

      <div style={S.domainLabel}>
        Domain {domain.id}: {domain.title} · {domain.weight}% of exam
      </div>
      <h2 style={S.title}>
        {taskStatement.id} — {taskStatement.title}
      </h2>

      <div style={S.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            style={S.tab(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Study' && <StudyTab taskStatement={taskStatement} />}
      {activeTab === 'Gotchas' && <GotchasTab taskStatement={taskStatement} />}
      {activeTab === 'Quiz' && <QuizTab taskStatement={taskStatement} />}
      {activeTab === 'Case Study' && (
        <div>
          {caseStudy && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>{caseStudy.title}</strong>
              {' '}— a Domain {domain.id} decision scenario. Work through each call the way you would on the job; the concepts span this whole domain.
            </p>
          )}
          <CaseStudyView caseStudy={caseStudy} />
        </div>
      )}
    </div>
  );
}
