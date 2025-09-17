import React, { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

import {
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Box,
  Divider,
  LinearProgress
} from "@mui/material";

// 1) Import the separate PlanPreview
import PlanPreview from "./PlanPreview";

// 2) Import your Carousel (Step 0)
import TOEFLOnboardingCarousel from "./TOEFLOnboardingCarousel";

export default function TOEFLOnboardingModal({ open, onClose, userId }) {
  const [currentStep, setCurrentStep] = useState(0);

  const [toeflBooks, setToeflBooks] = useState([]);
  useEffect(() => {
    if (!userId) return;
    async function fetchUserDoc() {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (Array.isArray(userData.clonedToeflBooks)) {
            setToeflBooks(userData.clonedToeflBooks);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user doc:", err);
      }
    }
    fetchUserDoc();
  }, [userId]);

  // Step 1: timeframe + daily reading
  const [examTimeframe, setExamTimeframe] = useState("1_month");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);
  const [targetDate, setTargetDate] = useState("");

  // Hard-coded
  const currentKnowledge = "none";
  const goalLevel = "advanced";

  // Step 2: plan creation
  const [isCreatingPlans, setIsCreatingPlans] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [planCreationResults, setPlanCreationResults] = useState([]);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);

  // Step 3: Plan Preview is now in a separate component

  // We have 4 steps total now
  const steps = ["Intro Slides", "Plan Info", "Processing", "Plan Preview"];

  // For computing target date in Step 1
  const TIMEFRAME_OFFSETS = {
    "1_week": 7,
    "2_weeks": 14,
    "1_month": 30,
    "2_months": 60,
    "6_months": 180,
    "not_sure": 60
  };

  // For plan creation (Step 2)
  const planCreationEndpoint = "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";
  const skillMap = {
    "NwNZ8WWCz54Y4BeCli0c": "Reading",
    "fuyAbhDo3GXLbtEdZ9jj": "Listening",
    "5UWQEvQet8GgkZmjEwAO": "Speaking",
    "pFAfUSWtwipFZG2RStKg": "Writing",
  };

  // Step transitions
  const handleNext = async () => {
    // Step 1 => Step 2
    if (currentStep === 1) {
      computeTargetDate();
      setCurrentStep(2);
      return;
    }
    // Step 2 => Step 3 (only if done)
    if (currentStep === 2 && isDone) {
      setCurrentStep(3);
      return;
    }
    // Step 3 => finish => mark onboarded => close
    if (currentStep === 3) {
      await markUserOnboarded();
      if (onClose) onClose();
      return;
    }
    // Step 0 => Step 1
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentStep(0);
      return;
    }
    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }
    if (currentStep === 3) {
      setCurrentStep(2);
      return;
    }
    if (onClose) onClose();
  };

  // Step 1
  function computeTargetDate() {
    const offset = TIMEFRAME_OFFSETS[examTimeframe] || 30;
    const date = new Date();
    date.setDate(date.getDate() + offset);
    setTargetDate(date.toISOString().substring(0, 10));
  }

  // Step 2
  const LOADING_MESSAGES = [
    "Analyzing your data...",
    "Generating your reading plan...",
    "Creating listening modules...",
    "Finalizing writing tasks...",
    "Reviewing everything...",
  ];
  useEffect(() => {
    if (currentStep === 2) {
      startProgressAnimation();
      createFourPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  function startProgressAnimation() {
    setProgress(0);
    setIsDone(false);
    setIsTakingLong(false);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + 5;
        if (nextVal >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return nextVal;
      });
    }, 1000);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }

  useEffect(() => {
    if (progress === 100 && !isDone && currentStep === 2) {
      setIsTakingLong(true);
    }
  }, [progress, isDone, currentStep]);

  async function createFourPlans() {
    setIsCreatingPlans(true);
    setServerError(null);
    setPlanCreationResults([]);
    try {
      const planType = `${currentKnowledge}-${goalLevel}`;
      const quizTime = 3;
      const reviseTime = 3;

      const baseBody = {
        userId,
        targetDate,
        dailyReadingTime,
        planType,
        quizTime,
        reviseTime,
      };

      const promises = toeflBooks.map(async (bookObj) => {
        const skillName = skillMap[bookObj.oldBookId] || "TOEFL Course";
        const response = await axios.post(planCreationEndpoint, {
          ...baseBody,
          bookId: bookObj.newBookId,
        });
        return {
          skill: skillName,
          planId: response.data.planId,
          planDoc: response.data.planDoc,
        };
      });

      const results = await Promise.all(promises);
      setPlanCreationResults(results);
      console.log("Plan creation succeeded, results:", results);
      setIsDone(true);
    } catch (err) {
      console.error("Error creating TOEFL plans:", err);
      setServerError(err.message || "Failed to create TOEFL plans.");
    } finally {
      setIsCreatingPlans(false);
    }
  }

  // Step 3 => PlanPreview is in a separate component now

  // Mark Onboarded
  const [isMarkingOnboarded, setIsMarkingOnboarded] = useState(false);
  async function markUserOnboarded() {
    if (!userId) return;
    try {
      setIsMarkingOnboarded(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/learner-personas/onboard`, {
        userId
      });
      console.log("User marked as onboarded (TOEFL):", userId);
    } catch (err) {
      console.error("Error marking user onboarded:", err);
      alert("Failed to mark you onboarded. Check console/logs.");
    } finally {
      setIsMarkingOnboarded(false);
    }
  }

  // Render
  if (!open) return null;

  // Step 0 => Carousel
  if (currentStep === 0) {
    return (
      <div style={styles.carouselOverlay}>
        <button style={styles.carouselCloseButton} onClick={onClose}>
          X
        </button>
        <TOEFLOnboardingCarousel
          onFinish={() => setCurrentStep(1)}
        />
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>
          X
        </button>

        <p style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          Step {currentStep} of {steps.length}: {steps[currentStep]}
        </p>

        {renderStepContent()}
        {renderButtons()}
      </div>
    </div>
  );

  function renderStepContent() {
    if (currentStep === 1) {
      return renderPlanInfoForm();
    }
    if (currentStep === 2) {
      return renderProcessing();
    }
    if (currentStep === 3) {
      // 3) Show the new PlanPreview component
      return (
        <PlanPreview
          plans={planCreationResults}
          onFinish={async () => {
            // Called when user clicks "Finish Onboarding" inside PlanPreview
            await markUserOnboarded();
            if (onClose) onClose();
          }}
        />
      );
    }
    return null;
  }

  // Step 1 UI
  function renderPlanInfoForm() {
    return (
      <div style={styles.innerContent}>
        <h2 style={{ marginBottom: "1rem", color: "#fff" }}>
          Configure Your TOEFL Plan
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          <div>
            <p style={{ color: "#fff", margin: "0 0 4px" }}>
              How soon do you plan to take your TOEFL exam?
            </p>
            <RadioGroup
              name="exam-timeframe"
              value={examTimeframe}
              onChange={(e) => setExamTimeframe(e.target.value)}
            >
              <FormControlLabel
                value="1_week"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 1 Week"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="2_weeks"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 2 Weeks"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="1_month"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 1 Month"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="2_months"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 2 Months"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="6_months"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 6 Months"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="not_sure"
                control={<Radio sx={{ color: "#fff" }} />}
                label="Not sure yet"
                sx={{ color: "#fff" }}
              />
            </RadioGroup>
          </div>

          <Divider style={{ backgroundColor: "#bbb" }} />

          <div>
            <p style={{ color: "#fff", margin: "0 0 4px" }}>
              How many minutes do you plan to study each day?
            </p>
            <Slider
              value={dailyReadingTime}
              onChange={(e, val) => setDailyReadingTime(val)}
              step={5}
              min={5}
              max={120}
              valueLabelDisplay="auto"
              sx={{ color: "#fff" }}
            />
            <p style={{ color: "#ccc" }}>{dailyReadingTime} minutes/day</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 UI
  function renderProcessing() {
    if (serverError) {
      return (
        <div style={styles.innerContent}>
          <h2 style={{ color: "#fff" }}>Oops!</h2>
          <p style={{ color: "red" }}>{serverError}</p>
          <p style={{ color: "#ccc" }}>Please try again later.</p>
        </div>
      );
    }

    if (!isDone) {
      return (
        <div style={styles.innerContent}>
          {!isTakingLong && (
            <>
              <h2 style={{ color: "#fff", marginBottom: "1rem" }}>
                Preparing Your TOEFL Plan
              </h2>
              <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
                Please hold on while we build your personalized plan.
              </p>

              <Box sx={{ width: "100%", marginBottom: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
                {progress}% Complete
              </p>
              <p style={{ color: "#ccc" }}>{LOADING_MESSAGES[messageIndex]}</p>
            </>
          )}
          {isTakingLong && (
            <>
              <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Still Working...</h2>
              <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
                It’s taking a bit longer than usual. We’re still preparing your plan.
              </p>
              <Box sx={{ width: "100%", marginBottom: 2 }}>
                <LinearProgress variant="indeterminate" />
              </Box>
              <p style={{ color: "#ccc" }}>Please don’t close this page yet.</p>
            </>
          )}
        </div>
      );
    }

    // If done => brief success message
    return (
      <div style={styles.innerContent}>
        <h2 style={{ color: "#fff" }}>Your Plan is Ready!</h2>
        <p style={{ color: "#ccc", marginBottom: "1rem" }}>
          We’ve finished creating your TOEFL study plan. Click “Next” to preview it.
        </p>
      </div>
    );
  }

  // Buttons
  function renderButtons() {
    return (
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            style={styles.secondaryButton}
            disabled={isCreatingPlans || isMarkingOnboarded}
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          style={styles.primaryButton}
          disabled={isCreatingPlans || isMarkingOnboarded}
        >
          {renderNextButtonLabel()}
        </button>
      </div>
    );
  }

  function renderNextButtonLabel() {
    if (currentStep === 2) {
      if (!isDone) return "Preparing...";
      return "Next";
    }
    if (currentStep === 3) {
      return isMarkingOnboarded ? "Marking Onboarded..." : "Finish";
    }
    return "Next";
  }
}

// Styles
const styles = {
  carouselOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: "20px",
    borderRadius: "8px",
    width: "80vw",
    maxWidth: "600px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  innerContent: {
    marginTop: "1rem",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#9b59b6",
    border: "none",
    color: "#fff",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    border: "2px solid #9b59b6",
    color: "#fff",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
};