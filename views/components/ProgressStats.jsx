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
            border: stat.highlight
              ? "1px solid var(--monolith)"
              : "1px solid var(--color-border-tertiary)",
            borderRadius: "var(--radius-md)",
            padding: "1rem 1.05rem",
            minHeight: 92,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-text)",
              fontSize: 11,
              color: stat.highlight
                ? "rgba(245, 243, 238, 0.7)"
                : "var(--color-text-secondary)",
              marginBottom: 8,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              lineHeight: 1.05,
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
