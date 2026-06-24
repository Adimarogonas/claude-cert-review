'use client';

import { useMemo } from 'react';
import { DOMAINS, getAllTaskStatements } from '@/models/modules';
import { useProgress } from '@/controllers/ProgressContext';

/**
 * useModules()
 *
 * Returns domain list enriched with per-task-statement progress derived
 * from the shared progress store (same store used by scenario questions).
 */
export function useModules() {
  const { progress, recordPractice } = useProgress();

  const domainsWithProgress = useMemo(() => {
    return DOMAINS.map((domain) => {
      const taskStatements = domain.taskStatements.map((ts) => {
        const qids = ts.questions.map((q) => q.id);
        const answered = qids.filter((qid) => progress.submitted[qid]).length;
        const correct = qids.filter((qid) => {
          const sr = progress.srState[qid];
          return sr && sr.correct > 0;
        }).length;
        return {
          ...ts,
          progress: { total: qids.length, answered, correct },
        };
      });

      const totalQuestions = taskStatements.reduce((s, ts) => s + ts.progress.total, 0);
      const totalAnswered = taskStatements.reduce((s, ts) => s + ts.progress.answered, 0);
      const totalCorrect = taskStatements.reduce((s, ts) => s + ts.progress.correct, 0);

      return {
        ...domain,
        taskStatements,
        progress: { total: totalQuestions, answered: totalAnswered, correct: totalCorrect },
      };
    });
  }, [progress]);

  return { domains: domainsWithProgress, recordPractice };
}
