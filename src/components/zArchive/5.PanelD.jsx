// src/components/DetailedBookViewer/PanelD.jsx

import React from "react";

function PanelD() {
  // These might come from props or an API call in the future
  const userStats = {
    wpm: 220, // words per minute
    dailyTime: 30, // minutes per day
    learnerType: "Visual Learner",
    masteryLevel: "Intermediate",
    improvementNote:
      "Our adaptive system refines your plan based on your speed, accuracy, and engagement—ensuring you reach your goals efficiently!",
  };

  return (
    <div style={panelStyle}>
      <h2 style={headingStyle}>Your Reading & Learning Stats</h2>

      <div style={statsContainerStyle}>
        {/* WPM */}
        <div style={statBlockStyle}>
          <h3 style={statTitleStyle}>Words Per Minute</h3>
          <p style={statValueStyle}>{userStats.wpm}</p>
        </div>

        {/* Daily Study Time */}
        <div style={statBlockStyle}>
          <h3 style={statTitleStyle}>Daily Study Time</h3>
          <p style={statValueStyle}>{userStats.dailyTime} mins</p>
        </div>

        {/* Learner Type */}
        <div style={statBlockStyle}>
          <h3 style={statTitleStyle}>Learner Type</h3>
          <p style={statValueStyle}>{userStats.learnerType}</p>
        </div>

        {/* Mastery Level */}
        <div style={statBlockStyle}>
          <h3 style={statTitleStyle}>Mastery Level</h3>
          <p style={statValueStyle}>{userStats.masteryLevel}</p>
        </div>
      </div>

      {/* Adaptive Explanation */}
      <p style={infoTextStyle}>{userStats.improvementNote}</p>
    </div>
  );
}

// ================== Styles ==================

const panelStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  overflowY: "auto",
  maxHeight: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const headingStyle = {
  margin: 0,
  fontSize: "1.5rem",
  marginBottom: "10px",
};

const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "15px",
};

const statBlockStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "6px",
  padding: "15px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const statTitleStyle = {
  margin: "0 0 10px",
  fontSize: "1rem",
  opacity: 0.8,
};

const statValueStyle = {
  margin: 0,
  fontSize: "1.4rem",
  fontWeight: "bold",
};

const infoTextStyle = {
  fontSize: "0.95rem",
  lineHeight: "1.4",
  opacity: 0.9,
};

export default PanelD;