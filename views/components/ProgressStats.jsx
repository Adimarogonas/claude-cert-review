// Pure presentational component — no hooks, no 'use client' needed.
// Renders a grid of label/value metric tiles matching the home-screen style in index.jsx.

/**
 * ProgressStats
 *
 * Props:
 *   stats — array of { label: string, value: string|number, highlight?: boolean }
 *
 * When highlight=true the tile uses the success color tokens, matching the
 * "Result: Pass ✓" tile pattern on the exam results screen in index.jsx.
 */
export default function ProgressStats({ stats = [] }) {
  if (!stats.length) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 12,
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: stat.highlight
              ? "var(--color-background-success)"
              : "var(--color-background-secondary)",
            border: "1px solid var(--color-border-tertiary)",
            borderRadius: 10,
            padding: "1rem",
            minHeight: 92,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginBottom: 6,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.1,
              color: stat.highlight
                ? "var(--color-text-success)"
                : "var(--color-text-primary)",
            }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
