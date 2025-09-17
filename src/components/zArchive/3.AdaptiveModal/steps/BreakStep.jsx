// BreakStep.jsx

import React from "react";
import {
  contentInnerStyle,
  buttonRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles";

/**
 * BreakStep
 * ---------
 * A short break. We might just show a message, maybe a timer, etc.
 */
export default function BreakStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>Take a Break!</h2>
      <p>Grab a coffee, stretch your legs, or just relax for a few minutes.</p>
      <p>Scheduled Break: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}