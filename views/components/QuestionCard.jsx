// Pure presentational component — no hooks, no 'use client' needed.
// Renders a question with its four options and optional explanation.

import OptionButton from "./OptionButton";

/**
 * Derives the OptionButton state for a given option index.
 *
 *  reveal=false:
 *    - selectedIndex matches idx → "selected"
 *    - otherwise → "idle"
 *
 *  reveal=true:
 *    - idx === correct                          → "correct"
 *    - idx === selectedIndex && idx !== correct → "incorrect"
 *    - otherwise                                → "disabled"
 */
function deriveState({ idx, correct, selectedIndex, reveal }) {
  if (!reveal) {
    return selectedIndex === idx ? "selected" : "idle";
  }
  if (idx === correct) return "correct";
  if (idx === selectedIndex) return "incorrect";
  return "disabled";
}

/**
 * QuestionCard
 *
 * Props:
 *   question      — { text, options: string[], correct: number, explanation: string }
 *   selectedIndex — number | null  (null = no answer chosen yet)
 *   reveal        — boolean        (true = show correct/incorrect highlighting + explanation)
 *   onSelect      — function(idx)  callback when user picks an option
 */
export default function QuestionCard({
  question,
  selectedIndex = null,
  reveal = false,
  onSelect,
}) {
  if (!question) return null;

  const { text, options, correct, explanation } = question;

  return (
    <div>
      {/* Question text */}
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-h3)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          marginBottom: "1.4rem",
          lineHeight: 1.3,
          color: "var(--color-text-primary)",
        }}
      >
        {text}
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: reveal ? "1rem" : 0 }}>
        {options.map((opt, idx) => {
          const state = deriveState({ idx, correct, selectedIndex, reveal });
          const letter = String.fromCharCode(65 + idx); // A, B, C, D
          return (
            <OptionButton
              key={idx}
              letter={letter}
              text={opt}
              state={state}
              onClick={() => onSelect && onSelect(idx)}
            />
          );
        })}
      </div>

      {/* Explanation block — only shown when reveal=true */}
      {reveal && explanation && (
        <div
          style={{
            marginTop: "0.85rem",
            padding: "0.95rem 1.1rem",
            background: "var(--color-background-secondary)",
            borderLeft: "2px solid var(--carbon)",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            lineHeight: 1.65,
            color: "var(--color-text-secondary)",
          }}
        >
          {explanation}
        </div>
      )}
    </div>
  );
}
