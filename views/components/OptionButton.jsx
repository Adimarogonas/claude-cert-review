// Pure presentational component — no hooks, no 'use client' needed.
// Renders one lettered option (A./B./C./D.) with prop-driven visual state.
//
// CSL state reading (sealed palette):
//   idle      → warm paper, hairline chrome
//   selected  → Carbon Black outline + filled ink letter chip (active)
//   correct   → Monolith slab fill, Intelligence White text (the brand signature)
//   incorrect → Alps Red outline + ink (the only red in the option set)
//   disabled  → sunken paper, muted

const STATE_STYLES = {
  idle: {
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-tertiary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    chip: { background: "var(--sunken)", border: "1px solid var(--color-border-tertiary)", color: "var(--carbon)" },
  },
  selected: {
    background: "var(--color-background-info)",
    border: "1.5px solid var(--carbon)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
    chip: { background: "var(--carbon)", border: "1px solid var(--carbon)", color: "var(--intelligence)" },
  },
  correct: {
    background: "var(--monolith)",
    border: "1.5px solid var(--monolith)",
    color: "var(--intelligence)",
    cursor: "default",
    chip: { background: "var(--intelligence)", border: "1px solid var(--intelligence)", color: "var(--carbon)" },
  },
  incorrect: {
    background: "var(--color-background-danger)",
    border: "1.5px solid var(--alps)",
    color: "var(--alps)",
    cursor: "default",
    chip: { background: "var(--alps)", border: "1px solid var(--alps)", color: "var(--intelligence)" },
  },
  disabled: {
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    color: "var(--color-text-secondary)",
    cursor: "default",
    chip: { background: "var(--paper)", border: "1px solid var(--color-border-tertiary)", color: "var(--color-text-secondary)" },
  },
};

/**
 * OptionButton
 *
 * Props:
 *   letter   — "A" | "B" | "C" | "D"
 *   text     — option text string
 *   state    — "idle" | "selected" | "correct" | "incorrect" | "disabled"
 *   onClick  — callback, called only when state is idle or selected
 */
export default function OptionButton({ letter, text, state = "idle", onClick }) {
  const styles = STATE_STYLES[state] ?? STATE_STYLES.idle;
  const { chip, ...box } = styles;
  const isInteractive = state === "idle" || state === "selected";

  return (
    <button
      disabled={!isInteractive}
      onClick={isInteractive ? onClick : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "1.75rem 1fr auto",
        alignItems: "start",
        gap: 14,
        textAlign: "left",
        padding: "0.95rem 1.05rem",
        borderRadius: "var(--radius-md)",
        fontFamily: "var(--font-text)",
        fontSize: 15,
        fontWeight: 400,
        lineHeight: 1.5,
        width: "100%",
        minHeight: "auto",
        boxShadow: "none",
        transition: "border-color 0.14s ease, background-color 0.14s ease, color 0.14s ease",
        ...box,
      }}
    >
      <span
        style={{
          width: 26,
          height: 26,
          borderRadius: "var(--radius-sm)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-text)",
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1,
          ...chip,
        }}
      >
        {letter}
      </span>
      <span>{text}</span>
      {state === "correct" && (
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Correct
        </span>
      )}
      {state === "incorrect" && (
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          Your answer
        </span>
      )}
    </button>
  );
}
