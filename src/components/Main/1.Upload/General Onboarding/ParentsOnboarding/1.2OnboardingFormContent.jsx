// src/components/DetailedBookViewer/OnboardingFormContent.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Typography
} from "@mui/material";
import axios from "axios";
import { auth } from "../../../../../firebase";

// Steps
import OnboardingCarousel from "../OnboardingCarousel/1.2.1OnboardingCarousel";
import UploadBook from "../GeneralOnboardingFormComponents/1.2.2UploadBook";
import ProcessAnimation from "../GeneralOnboardingFormComponents/1.2.3ProcessAnimation";

/**
 * OnboardingFormContent
 *
 * Steps:
 *   0 => OnboardingCarousel (optionally skipped if user is already onboarded)
 *   1 => UploadBook
 *   2 => ProcessAnimation (Analyze)
 *
 * After Analyze finishes, we call `onOnboardingComplete(bookId)`
 * so the parent can close onboarding and open the plan editor with that book.
 *
 * Props:
 *   - onOnboardingComplete(bookId) : function
 */
export default function OnboardingFormContent({ onOnboardingComplete }) {
  const [parentStep, setParentStep] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Only two steps visible in stepper: Upload, Analyze
  const stepsData = [
    { label: "Upload", summary: "Choose your PDF & specify title" },
    { label: "Analyze", summary: "AI processes your content" }
  ];

  // 1) Check if user is authenticated
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 2) If user is onboarded => skip carousel
  useEffect(() => {
    if (!currentUserId) return;

    const fetchOnboardingStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/learner-personas`,
          { params: { userId: currentUserId } }
        );
        const isOnboarded = !!(
          response.data.success && response.data.data?.isOnboarded === true
        );
        // Skip to step 1 if already onboarded
        setParentStep(isOnboarded ? 1 : 0);
      } catch (error) {
        console.error("Error fetching learnerPersona:", error);
        setParentStep(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [currentUserId]);

  // Step transitions
  const handleCarouselFinish = () => setParentStep(1);
  const handleUploadComplete = () => setParentStep(2);

  // 3) Once analyzing is done => call parent with bookId
  const handleAnalyzeComplete = (bookId) => {
    console.log("Analyze complete => calling onOnboardingComplete()", bookId);
    if (onOnboardingComplete) {
      onOnboardingComplete(bookId);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // We only show the stepper for steps 1 & 2 (Upload & Analyze)
  const showStepper = parentStep > 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "80vh",
        maxHeight: "80vh",
        overflow: "hidden",
        backgroundColor: "transparent",
        color: "#fff",
      }}
    >
      {/* Optional Stepper UI */}
      {showStepper && (
        <Box sx={{ mb: 2, p: 1 }}>
          <Stepper
            alternativeLabel
            activeStep={parentStep - 1} 
            sx={{
              "& .MuiStepLabel-label": { color: "#fff", fontWeight: 500 },
              "& .MuiStepIcon-text": { fill: "#fff" },
              "& .MuiStepIcon-root": { color: "#666" },
              "& .Mui-active .MuiStepIcon-root": { color: "#9b59b6" },
              "& .Mui-completed .MuiStepIcon-root": { color: "#9b59b6" },
              "& .MuiStepConnector-line": { borderColor: "#999" },
            }}
          >
            {stepsData.map((step) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#bbb" }}>
                    {step.summary}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      {/* Scrollable content area */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {/* Step 0 => Carousel */}
        {parentStep === 0 && (
          <OnboardingCarousel onFinish={handleCarouselFinish} />
        )}

        {/* Step 1 => Upload */}
        {parentStep === 1 && (
          <UploadBook userId={currentUserId} onComplete={handleUploadComplete} />
        )}

        {/* Step 2 => Analyze */}
        {parentStep === 2 && (
          <ProcessAnimation
            userId={currentUserId}
            onShowPlanModal={(bId) => handleAnalyzeComplete(bId)}
          />
        )}
      </Box>
    </Box>
  );
}