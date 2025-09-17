// src/components/DetailedBookViewer/PanelAdaptiveProcess.jsx

import React from "react";

/**
 * A simple panel that explains the adaptive learning process in a flow/diagram style.
 * You can place this component below your existing sections to visually guide users
 * through how your system works.
 */
function PanelAdaptiveProcess() {
  // A list of steps in the adaptive learning process (with optional icons).
  const steps = [
    {
      title: "Upload Your Book(s)",
      description: "You provide the material you want to learn or teach.",
      icon: "📁",
    },
    {
      title: "We Break It Down",
      description: "Chapters, sub-chapters, and key content are extracted.",
      icon: "🔎",
    },
    {
      title: "Provide Your Requirements",
      description:
        "Set your target date, reading speed, daily hours, and other preferences.",
      icon: "⚙️",
    },
    {
      title: "Generate Adaptive Plan",
      description:
        "We create a custom learning schedule based on your unique profile.",
      icon: "📝",
    },
    {
      title: "We Learn More About You",
      description:
        "Your performance and interactions refine future learning plans.",
      icon: "🤔",
    },
    {
      title: "Deliver & Iterate",
      description:
        "You follow the plan; we adapt as you progress to ensure success.",
      icon: "🚀",
    },
  ];

  return (
    <div style={panelContainerStyle}>
      <h2 style={headingStyle}>How Our Adaptive Learning Works</h2>

      <div style={stepsContainerStyle}>
        {steps.map((step, index) => (
          <div key={index} style={stepItemStyle}>
            {/* Step icon (could be an emoji or an actual image/svg) */}
            <div style={iconContainerStyle}>{step.icon}</div>

            {/* Step title and description */}
            <h3 style={stepTitleStyle}>{step.title}</h3>
            <p style={stepDescriptionStyle}>{step.description}</p>

            {/* Draw an arrow (except after the last step) */}
            {index < steps.length - 1 && (
              <div style={arrowContainerStyle}>
                <span style={arrowStyle}>↓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// -------------------- CSS-In-JS Styles --------------------

const panelContainerStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  maxWidth: "800px",
  margin: "0 auto", // center in parent container
};

const headingStyle = {
  margin: "0 0 30px",
  textAlign: "center",
};

const stepsContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "20px",
};

const stepItemStyle = {
  position: "relative",
  backgroundColor: "rgba(255, 255, 255, 0.15)",
  borderRadius: "6px",
  padding: "15px",
  textAlign: "center",
};

const iconContainerStyle = {
  fontSize: "2.5rem",
  marginBottom: "10px",
};

const stepTitleStyle = {
  margin: "10px 0 5px 0",
};

const stepDescriptionStyle = {
  margin: "5px 0",
  fontSize: "0.95rem",
  lineHeight: "1.4",
};

const arrowContainerStyle = {
  position: "absolute",
  left: "50%",
  bottom: "-15px", // arrow points down from the item
  transform: "translateX(-50%)",
};

const arrowStyle = {
  display: "block",
  fontSize: "2rem",
  lineHeight: "1",
};

export default PanelAdaptiveProcess;