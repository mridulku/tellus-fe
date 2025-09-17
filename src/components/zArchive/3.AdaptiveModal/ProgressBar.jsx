import React from "react";
import { progressBarContainer, progressBarFill } from "./styles";

/**
 * ProgressBar
 * -----------
 * A simple component that shows a gold "fill" based on `stepPercent`.
 * 
 * PROPS:
 *  - stepPercent (number): percentage to fill, e.g. 0..100
 */
export default function ProgressBar({ stepPercent = 0 }) {
  return (
    <div style={progressBarContainer}>
      <div style={{ ...progressBarFill, width: `${stepPercent}%` }} />
    </div>
  );
}