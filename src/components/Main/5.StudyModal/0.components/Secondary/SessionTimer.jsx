// SessionTimer.jsx
import React from "react";

export default function SessionTimer({ secondsLeft }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
      {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      <span style={{ fontSize: "0.8rem", marginLeft: "6px" }}>left</span>
    </div>
  );
}