// ReadingStep.jsx

import React, { useState, useEffect } from "react";
import {
  contentInnerStyle,
  buttonRowStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
} from "../styles";

/**
 * ReadingStep
 * -----------
 * Shows subchapter content. If you need to fetch real data based on subChapterId,
 * you can do so via a useEffect call here.
 */
export default function ReadingStep({ item, onNext, onPrev }) {
  // If you want to fetch real subchapter text:
  const [subchapterText, setSubchapterText] = useState(null);

  useEffect(() => {
    if (item.subChapterId) {
      // e.g. fetch(`/api/subchapters/${item.subChapterId}`)
      //   .then(res => res.json())
      //   .then(data => setSubchapterText(data.text));
      // For now, we just store a placeholder:
      setSubchapterText(`Placeholder text for subchapter ID: ${item.subChapterId}`);
    }
  }, [item.subChapterId]);

  return (
    <div style={contentInnerStyle}>
      <h2>{item.label}</h2>

      {!subchapterText ? (
        <p>Loading subchapter text...</p>
      ) : (
        <p style={{ whiteSpace: "pre-wrap" }}>{subchapterText}</p>
      )}

      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>
          Back
        </button>
        <button style={primaryButtonStyle} onClick={onNext}>
          Done Reading
        </button>
      </div>
    </div>
  );
}