// TopBar.jsx

import React from "react";
import SessionTimer from "./SessionTimer";
import { topBarStyle, topBarLeftStyle, timerStyle } from "./styles";

export default function TopBar({
  daysUntilExam,
  sessionLength,
  secondsLeft,
  onClose,
}) {
  return (
    <div style={topBarStyle}>
      <div style={topBarLeftStyle}>
        <h3 style={{ margin: 0 }}>
          Exam in {daysUntilExam} days • Session: {sessionLength} min
        </h3>
      </div>
      <div style={timerStyle}>
        <SessionTimer secondsLeft={secondsLeft} />
      </div>
      <div style={{ cursor: "pointer", fontSize: "1.5rem" }} onClick={onClose}>
        ✕
      </div>
    </div>
  );
}