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
          fontSize: 22,
          fontWeight: 700,
          marginBottom: "1.25rem",
          lineHeight: 1.35,
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
            marginTop: "0.75rem",
            padding: "1rem 1.125rem",
            background: "var(--color-background-secondary)",
            border: "1px solid var(--color-border-tertiary)",
            borderRadius: 10,
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--color-text-secondary)",
          }}
        >
          {explanation}
        </div>
      )}
    </div>
  );
}
