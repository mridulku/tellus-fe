import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function PlatformIntro() {
  const navigate = useNavigate();

  /**
   * We’ll create an array of steps:
   * Each step can include a title, description,
   * image or illustration, etc.
   */
  const steps = [
    {
      title: "AI-Powered Personalization",
      content:
        "Our platform leverages advanced AI algorithms to tailor each lesson to your unique needs.",
      imgUrl: "https://via.placeholder.com/300?text=AI+Personalization", // placeholder
    },
    {
      title: "Adaptive Learning Path",
      content:
        "We monitor your progress and adjust content difficulty in real time, helping you master topics faster.",
      imgUrl: "https://via.placeholder.com/300?text=Adaptive+Path", // placeholder
    },
    {
      title: "Goal-Oriented Focus",
      content:
        "Set your goals and let our platform guide you with targeted exercises, quizzes, and insights to achieve them.",
      imgUrl: "https://via.placeholder.com/300?text=Goal+Focus", // placeholder
    },
  ];

  // Track current step index
  const [currentStep, setCurrentStep] = useState(0);

  // Move to the next step or finish
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // On final step, navigate to the homepage (or wherever you like)
      navigate("/learnerpersona");
    }
  };

  // Optional: Move to the previous step
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const { title, content, imgUrl } = steps[currentStep];

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
          position: "relative",
        }}
      >
        {/* Step Title */}
        <h1 style={{ marginBottom: "20px" }}>{title}</h1>

        {/* Optional image or illustration */}
        {imgUrl && (
          <img
            src={imgUrl}
            alt="Step Visual"
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          />
        )}

        {/* Step Content */}
        <p style={{ fontSize: "1.1rem", marginBottom: "30px", lineHeight: 1.6 }}>
          {content}
        </p>

        {/* Step Indicators (Optional) */}
        <div style={{ marginBottom: "20px" }}>
          {steps.map((_, index) => (
            <span
              key={index}
              style={{
                height: "10px",
                width: "10px",
                margin: "0 5px",
                display: "inline-block",
                borderRadius: "50%",
                backgroundColor:
                  index === currentStep ? "#FFD700" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={handlePrev}
            style={{
              visibility: currentStep === 0 ? "hidden" : "visible",
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#FFD700",
              color: "#000",
              cursor: "pointer",
              transition: "opacity 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Previous
          </button>

          <button
            type="button"
            onClick={handleNext}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#FFD700",
              color: "#000",
              cursor: "pointer",
              transition: "opacity 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {currentStep < steps.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlatformIntro;