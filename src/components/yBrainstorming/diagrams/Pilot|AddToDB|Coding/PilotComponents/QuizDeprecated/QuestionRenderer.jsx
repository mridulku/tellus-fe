// File: QuestionRenderer.jsx

import React from "react";

const styles = {
  questionBlock: { marginBottom: "1rem" },
  block: { marginTop: "0.5rem" },
  optionLabel: {
    display: "block",
    marginLeft: "1.5rem",
    marginBottom: "0.3rem",
  },
  input: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    borderRadius: "4px",
  },
  scenarioBox: {
    backgroundColor: "#444",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "0.5rem",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    minHeight: "60px",
    marginTop: "0.5rem",
  },
};

/**
 * Renders a single question's UI.
 * questionObj: { type, question, ...specific fields }
 * index: number
 * userAnswer: string|number|etc.
 * onUserAnswerChange: (newVal) => void
 */
export default function QuestionRenderer({
  questionObj,
  index,
  userAnswer,
  onUserAnswerChange,
}) {
  const qType = questionObj.type || "";
  const questionText = questionObj.question || "(No question text)";

  return (
    <div style={styles.questionBlock}>
      <p>
        <b>Question {index + 1}:</b> {questionText}
      </p>
      {renderQuestionByType(qType, questionObj, userAnswer, onUserAnswerChange)}
    </div>
  );
}

// A helper function that decides how to render each question type
function renderQuestionByType(qType, questionObj, userAnswer, onUserAnswerChange) {
  switch (qType) {
    case "multipleChoice":
      return (
        <>
          {Array.isArray(questionObj.options) &&
            questionObj.options.map((opt, optIdx) => (
              <label key={optIdx} style={styles.optionLabel}>
                <input
                  type="radio"
                  name={`q-mc-${questionObj.question}`}
                  value={optIdx}
                  checked={parseInt(userAnswer, 10) === optIdx}
                  onChange={() => onUserAnswerChange(optIdx)}
                />
                {opt}
              </label>
            ))}
        </>
      );

    case "trueFalse":
      return (
        <div style={styles.block}>
          <p>{questionObj.statement}</p>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name={`q-tf-${questionObj.question}`}
              value="true"
              checked={userAnswer === "true"}
              onChange={() => onUserAnswerChange("true")}
            />
            True
          </label>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name={`q-tf-${questionObj.question}`}
              value="false"
              checked={userAnswer === "false"}
              onChange={() => onUserAnswerChange("false")}
            />
            False
          </label>
        </div>
      );

    case "fillInBlank":
      return (
        <div style={styles.block}>
          <p>{questionObj.blankPhrase || "Fill in the blank:"}</p>
          <input
            type="text"
            style={styles.input}
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Type your answer..."
          />
        </div>
      );

    case "shortAnswer":
      return (
        <div style={styles.block}>
          <textarea
            style={styles.textarea}
            rows={3}
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Short answer..."
          />
        </div>
      );

    case "scenario":
      return (
        <div style={styles.block}>
          {questionObj.scenarioText && (
            <blockquote style={styles.scenarioBox}>
              {questionObj.scenarioText}
            </blockquote>
          )}
          <p>Your response:</p>
          <textarea
            style={styles.textarea}
            rows={4}
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Describe how you'd handle it..."
          />
        </div>
      );

    case "compareContrast":
      return (
        <div style={styles.block}>
          {Array.isArray(questionObj.itemsToCompare) &&
            questionObj.itemsToCompare.length > 0 && (
              <p>
                Compare: <b>{questionObj.itemsToCompare.join(" vs ")}</b>
              </p>
            )}
          <textarea
            style={styles.textarea}
            rows={4}
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Write your comparison here..."
          />
        </div>
      );

    case "rankingOrSorting":
      return (
        <div style={styles.block}>
          {Array.isArray(questionObj.items) && questionObj.items.length > 0 && (
            <p>
              Please rank or sort these items:
              <ul>
                {questionObj.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </p>
          )}
          <textarea
            style={styles.textarea}
            rows={3}
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Type your final ordering or explanation..."
          />
        </div>
      );

    case "openEnded":
      return (
        <div style={styles.block}>
          <textarea
            style={styles.textarea}
            rows={4}
            value={userAnswer}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Write your open-ended response..."
          />
        </div>
      );

    default:
      return (
        <div style={styles.block}>
          <p style={{ color: "red" }}>
            Unknown question type: <b>{qType}</b>
          </p>
        </div>
      );
  }
}