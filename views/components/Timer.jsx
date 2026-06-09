"use client";

import { useState, useEffect } from "react";

/**
 * Timer
 *
 * Counts down from totalSeconds to 0, renders in mm:ss format.
 * Calls onExpire when it reaches 0.
 * Clears its interval on unmount AND on expiry.
 *
 * Props:
 *   totalSeconds — positive integer, initial countdown value
 *   onExpire     — callback invoked once when the timer reaches 0
 */
export default function Timer({ totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    // Reset if totalSeconds prop changes (e.g. new question)
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire && onExpire();
      return; // no interval to set; also acts as cleanup guard
    }

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          onExpire && onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup: clear interval on unmount or when remaining changes
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const isLow = remaining <= 30;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 15,
        fontWeight: 500,
        color: isLow ? "var(--color-text-danger)" : "var(--color-text-secondary)",
        background: isLow ? "var(--color-background-danger)" : "var(--color-background-secondary)",
        border: isLow
          ? "1px solid var(--color-border-danger)"
          : "1px solid var(--color-border-tertiary)",
        borderRadius: 999,
        padding: "0.55rem 0.85rem",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {display}
    </div>
  );
}
