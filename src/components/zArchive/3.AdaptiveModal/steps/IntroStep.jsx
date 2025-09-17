// steps/IntroStep.jsx

import React from "react";
import { contentInnerStyle, buttonRowStyle, primaryButtonStyle, secondaryButtonStyle } from "../styles";

export default function IntroStep({ item, userName, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h1>Welcome, {userName}!</h1>
      <p>This session will guide you through reading, quizzes, breaks, and more!</p>
      <p>Estimated time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev} disabled>
          Back
        </button>
        <button style={primaryButtonStyle} onClick={onNext}>
          Start
        </button>
      </div>
    </div>
  );
}