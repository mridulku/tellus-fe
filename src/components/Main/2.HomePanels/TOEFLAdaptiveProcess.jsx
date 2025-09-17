// src/components/TOEFLAdaptiveProcess.jsx
import React from "react";

/**
 * TOEFLAdaptiveProcess
 * --------------------
 * A simple panel explaining how the TOEFL adaptive learning process
 * works in your platform (no book/PDF uploads, strictly TOEFL).
 *
 * Feel free to adjust icons and step text as needed.
 */
function TOEFLAdaptiveProcess() {
  // Steps in the TOEFL adaptive learning process
  const steps = [
    {
      title: "1. Tell Us Your Test Date & Goals",
      description:
        "Enter your planned TOEFL date and your target score. We'll gather a baseline of your English level, daily available study time, and personal preferences.",
      icon: "🎯",
    },
    {
      title: "2. Receive a Personalized Plan",
      description:
        "We generate daily tasks covering reading, listening, speaking, and writing, tailored to your baseline level and target goals.",
      icon: "📋",
    },
    {
      title: "3. Practice & Track Progress",
      description:
        "Complete your daily tasks. You’ll get instant feedback on reading and listening, plus guided scoring insights for speaking and writing.",
      icon: "✅",
    },
    {
      title: "4. We Adapt as You Improve",
      description:
        "We monitor your performance to pinpoint weaknesses and adjust future tasks, keeping you challenged without overload.",
      icon: "⚙️",
    },
    {
      title: "5. Achieve Your TOEFL Goals",
      description:
        "By following your custom plan, you’ll systematically build the reading, listening, speaking, and writing skills needed to succeed on test day.",
      icon: "🚀",
    },
  ];

  return (
    <div style={panelContainerStyle}>
      <h2 style={headingStyle}>How Our TOEFL Adaptive Learning Works</h2>

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
  margin: "0 auto", // centers the panel in its parent container
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

export default TOEFLAdaptiveProcess;