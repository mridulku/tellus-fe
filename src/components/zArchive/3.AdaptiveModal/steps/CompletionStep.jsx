// CompletionStep.jsx

import React from "react";
import {
  contentInnerStyle,
  buttonRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles";

/**
 * CompletionStep
 * --------------
 * Final step to congratulate the user, let them exit or review steps.
 */
export default function CompletionStep({ item, onClose, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>Session Complete!</h2>
      <p>Congratulations on completing this adaptive session!</p>
      <p>Keep going—practice again soon or set up your next session!</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Review Steps</button>
        <button style={primaryButtonStyle} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}