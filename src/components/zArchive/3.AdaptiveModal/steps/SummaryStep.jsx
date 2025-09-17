// SummaryStep.jsx

import React from "react";
import {
  contentInnerStyle,
  buttonRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles";

/**
 * SummaryStep
 * -----------
 * At the end of your session, show stats. 
 * E.g. reading completed, quiz results, time spent, recommended next steps.
 */
export default function SummaryStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>Session Summary</h2>
      <p>Great job reaching the summary!</p>
      <p>Here, you could show: 
        <ul>
          <li>Reading done</li>
          <li>Quiz correctness</li>
          <li>Time spent</li>
          <li>Next recommended subchapter</li>
        </ul>
      </p>
      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}