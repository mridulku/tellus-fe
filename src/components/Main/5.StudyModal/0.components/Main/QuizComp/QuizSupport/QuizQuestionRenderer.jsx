/**
 * File: QuizQuestionRenderer.jsx
 * Description:
 *   Renders one quiz question.  If the parent passes `readOnly={true}`,
 *   all inputs are disabled (handy for “last-attempt” review panels).
 */

import React from "react";

/* ----------------------------- styles -------------------------------- */
const styles = {
  container      : { marginBottom: "1rem" },
  questionPrompt : { margin: "0.5rem 0", fontWeight: "bold" },
  conceptLabel   : { fontStyle: "italic", fontSize: "0.9rem", color: "#aaa", margin: "0.5rem 0" },
  optionLabel    : { display: "block", marginLeft: "1.5rem" },
  input          : { width: "100%", padding: "8px", borderRadius: "4px", boxSizing: "border-box" },
  textarea       : { width: "100%", padding: "8px", minHeight: "60px", borderRadius: "4px" },
  scenarioBox    : { backgroundColor: "#444", padding: "8px", borderRadius: "4px", marginBottom: "0.5rem" },
};

import Chip from "@mui/material/Chip";   // ← add this line

/* --------------------------- component ------------------------------- */
export default function QuizQuestionRenderer({
  index,
  questionObj,
  userAnswer,
  onUserAnswerChange,
  readOnly = false,                // 👈 NEW — optional flag
}) {
  console.log("[QuizQuestionRenderer] render → index", index, "| type:", questionObj?.type);

  /* graceful fallback */
  if (!questionObj) return <div style={styles.container}>No question data.</div>;

  const qType        = questionObj.type    || "unknownType";
  const questionText = questionObj.question|| `Question ${index + 1}`;
  const conceptName  = questionObj.conceptName || "";

  return (
    <div style={styles.container}>
      <p style={styles.questionPrompt}>Q{index + 1}: {questionText}</p>

      {conceptName && (
  <Chip
    label={conceptName}
    size="small"
    sx={{
      bgcolor: "#263238",
      color: "#80cbc4",
      fontStyle: "normal",
      mb: .5
    }}
  />
)}

      {renderByType(qType, questionObj, userAnswer, onUserAnswerChange, readOnly)}
    </div>
  );
}

/* ------------------- render switch-board ----------------------------- */
function renderByType(qType, qObj, userAnswer, onUserAnswerChange, readOnly) {
  switch (qType) {
    case "multipleChoice": return renderMultipleChoice(qObj, userAnswer, onUserAnswerChange, readOnly);
    case "trueFalse"     : return renderTrueFalse    (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "fillInBlank"   : return renderFillInBlank  (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "shortAnswer":
    case "compareContrast":return renderShortAnswer  (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "scenario"      : return renderScenario     (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "ranking"       : return renderRanking      (qObj, userAnswer, onUserAnswerChange, readOnly);
    default              : return <p style={{ color: "red" }}>Unknown question type: <b>{qType}</b></p>;
  }
}

import { ToggleButton, ToggleButtonGroup } from "@mui/material";


function renderMultipleChoice(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <ToggleButtonGroup
      orientation="vertical"          // ⬅  stack choices top-to-bottom
      exclusive
      value={parseInt(userAnswer, 10)}
      onChange={(_, v) => v !== null && onUserAnswerChange(String(v))}
      sx={{
        width: "100%",                // <-- the whole group spans the card width
      }}
    >
      {qObj.options.map((opt, i) => (
        <ToggleButton
          key={i}
          value={i}
          disabled={readOnly}
          sx={{
            width: "100%",            // ⬅ every button takes the full width
            justifyContent: "flex-start",
            textTransform: "none",    // keep the original capitalisation
            whiteSpace: "normal",     // allow wrapping instead of one long line
            lineHeight: 1.4,
            borderRadius: 1,
            my: 0.5,
            px: 2,
            bgcolor: "#263238",
            color: "#cfd8dc",

            "&.Mui-selected": {
              bgcolor: "#512da8",
              color: "#fff",
              "&:hover": { bgcolor: "#4527a0" },
            },
            "&:hover": { bgcolor: "#37474f" },
          }}
        >
          {opt}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function renderTrueFalse(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      {["true", "false"].map((val) => (
        <label key={val} style={styles.optionLabel}>
          <input
            disabled={readOnly}
            type="radio"
            name={`tf-${qObj.question}`}
            value={val}
            checked={userAnswer === val}
            onChange={() => onUserAnswerChange(val)}
          />
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </label>
      ))}
    </div>
  );
}

function renderFillInBlank(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      <p>{qObj.blankPhrase || "Fill in the blank:"}</p>
      <input
        disabled={readOnly}
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
      />
    </div>
  );
}

function renderShortAnswer(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <textarea
      disabled={readOnly}
      style={styles.textarea}
      value={userAnswer}
      onChange={(e) => onUserAnswerChange(e.target.value)}
      placeholder="Enter your response..."
    />
  );
}

function renderScenario(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      {qObj.scenarioText && (
        <blockquote style={styles.scenarioBox}>{qObj.scenarioText}</blockquote>
      )}
      <textarea
        disabled={readOnly}
        style={styles.textarea}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder="Describe how you'd handle it..."
      />
    </div>
  );
}

function renderRanking(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      <p>(Ranking question not fully implemented.)</p>
      <input
        disabled={readOnly}
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder='e.g. "1,2,3" for your order'
      />
    </div>
  );
}