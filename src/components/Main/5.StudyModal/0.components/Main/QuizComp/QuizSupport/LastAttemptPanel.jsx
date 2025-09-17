/**
 * File: QuizComp/LastAttemptPanel.jsx
 * -----------------------------------
 * Collapsible panel that shows the user’s most-recent quiz attempt
 * in a read-only format.
 *
 * It now accepts either of the two common data-shapes:
 *   • { questions, results, score, passed }
 *   • { quizSubmission, score, ... }  (as returned from backend)
 */

import React, { useState } from "react";
import QuizQuestionRenderer from "./QuizQuestionRenderer";

export default function LastAttemptPanel({ attempt }) {
  /* ------------------------------------------------------------
   * 1) Nothing yet?  – render nothing.
   * ---------------------------------------------------------- */
  if (!attempt) return null;

  /* ------------------------------------------------------------
   * 2) Normalise the data shape so the rest of the component
   *    can use a single structure.
   *    - ‘questions / results’ ➜ our in-memory object
   *    - ‘quizSubmission’      ➜ objects coming back from server
   * ---------------------------------------------------------- */
  const questions =
    attempt.questions || attempt.quizSubmission || []; // array of question objects

  // Build a parallel results array if not already present
  const results =
    attempt.results ||
    questions.map((q) => ({
      score:    typeof q.score    !== "undefined" ? q.score    : null,
      feedback: typeof q.feedback !== "undefined" ? q.feedback : "",
    }));

  // If for some reason there are still no questions, bail out gracefully
  if (questions.length === 0) return null;

  /* ------------------------------------------------------------
   * 3) Local state – collapsed / expanded
   * ---------------------------------------------------------- */
  const [open, setOpen] = useState(false);

  /* ------------------------------------------------------------
   * 4) Render
   * ---------------------------------------------------------- */
  return (
    <div style={styles.wrapper}>
      <button style={styles.toggleBtn} onClick={() => setOpen((p) => !p)}>
        {open ? "▼  Hide last quiz" : "▲  Show last quiz"}
      </button>

      {open && (
        <div style={styles.inner}>
          <p style={{ margin: "4px 0 12px 0" }}>
            <b>Last quiz score:</b> {attempt.score ?? "N/A"}{" "}
            <span style={{ color: attempt.passed ? "limegreen" : "red" }}>
              ({attempt.passed ? "PASS" : "FAIL"})
            </span>
          </p>

          {/* ——— Render every question in read-only mode ——— */}
          {questions.map((qObj, i) => (
            <QuizQuestionRenderer
              key={i}
              index={i}
              questionObj={qObj}
              userAnswer={qObj.userAnswer ?? qObj.userAns ?? ""}
              readOnly                              /* disables inputs */
              score={results[i]?.score}
              feedback={results[i]?.feedback}
              onUserAnswerChange={() => {}}         /* no-op */
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline styles                                                      */
/* ------------------------------------------------------------------ */
const styles = {
  wrapper: { marginBottom: "1rem" },

  toggleBtn: {
    background: "#444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "6px",
  },

  inner: {
    background: "#222",
    padding: "8px",
    borderRadius: "4px",
  },
};