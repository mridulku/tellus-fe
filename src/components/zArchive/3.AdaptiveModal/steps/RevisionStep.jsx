// RevisionStep.jsx

import React from "react";
import {
  contentInnerStyle,
  buttonRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles";

/**
 * RevisionStep
 * ------------
 * Could be used for flashcards, summary, or re-reading certain subchapters.
 */
export default function RevisionStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>{item.label}</h2>
      <p>Revision of: {JSON.stringify(item.revisionOf || [])}</p>
      <p>(Placeholder) Show flashcards or a short summary of these subchapters here.</p>
      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Done Revising</button>
      </div>
    </div>
  );
}