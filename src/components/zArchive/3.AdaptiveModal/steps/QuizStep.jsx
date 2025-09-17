// QuizStep.jsx

import React from "react";
import {
  contentInnerStyle,
  buttonRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles";

/**
 * QuizStep
 * --------
 * Renders multiple-choice questions. 
 * "answers" is an object with questionIndex -> chosenOptionIndex
 * "onOptionSelect" is a callback to update the user’s choice.
 */
export default function QuizStep({ item, answers, onOptionSelect, onNext, onPrev }) {
  const questions = item.quizQuestions || [];

  const handleOptionChange = (qIndex, optIndex) => {
    onOptionSelect(qIndex, optIndex);
  };

  return (
    <div style={contentInnerStyle}>
      <h2>{item.label}</h2>

      {questions.map((q, qIndex) => {
        const userAnswer = answers[qIndex] ?? null;
        return (
          <div key={qIndex} style={{ marginBottom: "15px" }}>
            <p style={{ fontWeight: "bold" }}>{q.question}</p>
            {q.options.map((opt, optIndex) => {
              const isSelected = userAnswer === optIndex;
              return (
                <label
                  key={optIndex}
                  style={{
                    display: "block",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "rgba(255,215,0,0.2)" : "transparent",
                    borderRadius: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <input
                    type="radio"
                    name={`quiz-${item.id}-q${qIndex}`}
                    checked={isSelected}
                    onChange={() => handleOptionChange(qIndex, optIndex)}
                    style={{ marginRight: "6px" }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );
      })}

      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}