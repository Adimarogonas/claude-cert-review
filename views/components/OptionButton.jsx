// Pure presentational component — no hooks, no 'use client' needed.
// Renders one lettered option (A./B./C./D.) with prop-driven visual state.

const STATE_STYLES = {
  idle: {
    background: "var(--color-background-primary)",
    border: "1px solid var(--color-border-tertiary)",
    color: "var(--color-text-primary)",
    cursor: "pointer",
  },
  selected: {
    background: "var(--color-background-info)",
    border: "2px solid var(--color-border-info)",
    color: "var(--color-text-info)",
    cursor: "pointer",
  },
  correct: {
    background: "var(--color-background-success)",
    border: "1px solid var(--color-border-success)",
    color: "var(--color-text-success)",
    cursor: "default",
  },
  incorrect: {
    background: "var(--color-background-danger)",
    border: "1px solid var(--color-border-danger)",
    color: "var(--color-text-danger)",
    cursor: "default",
  },
  disabled: {
    background: "var(--color-background-secondary)",
    border: "1px solid var(--color-border-tertiary)",
    color: "var(--color-text-secondary)",
    cursor: "default",
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
  const isInteractive = state === "idle" || state === "selected";

  return (
    <button
      disabled={!isInteractive}
      onClick={isInteractive ? onClick : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "2rem 1fr auto",
        alignItems: "start",
        gap: 12,
        textAlign: "left",
        padding: "1rem 1.125rem",
        borderRadius: 10,
        fontSize: 15,
        lineHeight: 1.5,
        width: "100%",
        minHeight: "auto",
        boxShadow: "none",
        ...styles,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.72)",
          border: "1px solid var(--color-border-tertiary)",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {letter}
      </span>
      <span>{text}</span>
      {state === "correct" && (
        <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Correct</span>
      )}
      {state === "incorrect" && (
        <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>Your answer</span>
      )}
    </button>
  );
}
