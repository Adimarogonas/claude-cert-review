'use client';

import { useModules } from '@/controllers/useModules';

const S = {
  root: { maxWidth: 840, margin: '0 auto' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-h1)',
    fontWeight: 500,
    letterSpacing: '-0.02em',
    lineHeight: 1.04,
    margin: '0 0 0.75rem',
  },
  subtitle: {
    fontFamily: 'var(--font-deck)',
    color: 'var(--color-text-secondary)',
    margin: '0 0 2rem',
    fontSize: 'var(--text-subhead)',
    fontWeight: 400,
    lineHeight: 1.6,
    maxWidth: 600,
  },
  domainCard: {
    marginBottom: '1.5rem',
    border: '1px solid var(--color-border-tertiary)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  domainHeader: {
    padding: '1rem 1.125rem',
    background: 'var(--color-background-secondary)',
    borderBottom: '1px solid var(--color-border-tertiary)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  domainTitle: {
    fontFamily: 'var(--font-deck)',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.01em',
  },
  domainMeta: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  taskList: { display: 'flex', flexDirection: 'column' },
  taskRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1.125rem',
    borderBottom: '1px solid var(--color-border-tertiary)',
    gap: 12,
    textAlign: 'left',
    cursor: 'pointer',
    background: 'transparent',
    width: '100%',
    transition: 'background 0.1s',
  },
  taskTitle: {
    fontFamily: 'var(--font-text)',
    fontSize: 14,
    fontWeight: 400,
    flex: 1,
    minWidth: 0,
    lineHeight: 1.5,
  },
  taskId: {
    fontSize: 11,
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    marginBottom: 2,
    letterSpacing: '0.05em',
  },
  taskProgress: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 60,
  },
  progressBar: {
    height: 3,
    background: 'var(--color-border-tertiary)',
    borderRadius: 2,
    overflow: 'hidden',
    width: 60,
  },
};

export default function ModuleListView({ onNavigate }) {
  const { domains } = useModules();

  return (
    <div style={S.root}>
      <h2 style={S.title}>Study by Domain</h2>
      <p style={S.subtitle}>
        27 task statements across 5 domains. Each module covers knowledge, skills, gotchas, and practice questions.
      </p>

      {domains.map((domain) => {
        const domainPct =
          domain.progress.total > 0
            ? Math.round((domain.progress.answered / domain.progress.total) * 100)
            : 0;

        return (
          <div key={domain.id} style={S.domainCard}>
            <div style={S.domainHeader}>
              <div>
                <div style={S.domainTitle}>
                  Domain {domain.id}: {domain.title}
                </div>
              </div>
              <div style={S.domainMeta}>
                <span>{domain.weight}% of exam</span>
                <span>{domain.progress.answered}/{domain.progress.total} answered</span>
              </div>
            </div>

            <div style={S.taskList}>
              {domain.taskStatements.map((ts, idx) => {
                const pct =
                  ts.progress.total > 0
                    ? Math.round((ts.progress.answered / ts.progress.total) * 100)
                    : 0;
                const allCorrect =
                  ts.progress.answered === ts.progress.total &&
                  ts.progress.correct === ts.progress.total &&
                  ts.progress.total > 0;
                const isLast = idx === domain.taskStatements.length - 1;

                return (
                  <button
                    key={ts.id}
                    style={{
                      ...S.taskRow,
                      borderBottom: isLast ? 'none' : '1px solid var(--color-border-tertiary)',
                    }}
                    onClick={() => onNavigate('module', ts.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.taskId}>{ts.id}</div>
                      <div style={S.taskTitle}>{ts.title}</div>
                    </div>

                    <div style={S.taskProgress}>
                      <span
                        style={{
                          fontWeight: allCorrect ? 700 : 400,
                          color: allCorrect ? 'var(--carbon)' : 'var(--color-text-secondary)',
                        }}
                      >
                        {ts.progress.correct}/{ts.progress.total}
                      </span>
                      <div style={S.progressBar}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: allCorrect ? 'var(--carbon)' : 'var(--color-text-secondary)',
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
