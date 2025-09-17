import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PersonalizationProgress() {
  const navigate = useNavigate();

  // Tracks the countdown progress (0 to 100) over ~30 seconds
  const [progress, setProgress] = useState(0);

  // We’ll display different messages at various progress milestones
  const steps = [
    { progress: 0, text: "Gathering your preferences..." },
    { progress: 25, text: "Analyzing your learning style..." },
    { progress: 50, text: "Preparing curated content..." },
    { progress: 75, text: "Almost ready to personalize your experience!" },
    { progress: 100, text: "All set! Let's begin." },
  ];

  // Use an interval that increments progress until it reaches 100 (~30s total)
  useEffect(() => {
    const totalSeconds = 30;
    const increment = 100 / totalSeconds; // ~3.33% each second

    const timer = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + increment;
        if (nextVal >= 100) {
          clearInterval(timer);
          return 100;
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Determine which message to display based on current progress
  const currentStep = steps.find((step, i, arr) => {
    // if it's the last step, or progress < next step's progress
    return (
      progress >= step.progress &&
      (i === arr.length - 1 || progress < arr[i + 1].progress)
    );
  });

  const handleContinue = () => {
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Open Sans', sans-serif",
        color: "#fff",
        padding: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          borderRadius: "10px",
          padding: "40px",
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Preparing Your Personalized Experience</h1>

        {/* Status Message */}
        <p
          style={{
            fontSize: "1.1rem",
            marginBottom: "30px",
            lineHeight: 1.6,
            minHeight: "48px", // keep consistent height as messages change
          }}
        >
          {currentStep ? currentStep.text : "Just a moment..."}
        </p>

        {/* Progress Bar */}
        <div
          style={{
            width: "100%",
            height: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#FFD700",
              transition: "width 0.5s",
            }}
          />
        </div>

        {/* Countdown Timer or Percentage Display */}
        <p style={{ marginBottom: "30px" }}>
          {Math.round(progress)}% complete
        </p>

        {/* Continue Button (visible after progress reaches 100) */}
        {progress >= 100 && (
          <button
            onClick={handleContinue}
            style={{
              padding: "15px 30px",
              fontSize: "1rem",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              background: "#FFD700",
              color: "#000",
              cursor: "pointer",
              transition: "opacity 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

export default PersonalizationProgress;