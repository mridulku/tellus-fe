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
import { auth } from "../../firebase";

// Import your steps
import OnboardingCarousel from "../Main/1.Upload/General Onboarding/GeneralOnboardingFormComponents/1.2.1OnboardingCarousel";

import UploadBook from "../Upload/UploadBook";
import ProcessAnimation from "./UploadProcessing";
import EditAdaptivePlanModal from "../Main/3.Library/LibraryChild/EditAdaptivePlanModal";



/**
 * OnboardingFormContent controls:
 *   - Step 0 => OnboardingCarousel
 *   - Step 1 => UploadBook
 *   - Step 2 => ProcessAnimation
 *   - Step 3 => EditAdaptivePlanModal
 * 
 * We also check Firestore "learnerPersonas" => skip carousel if user is already onboarded.
 */
export default function OnboardingFormContent() {
  const [parentStep, setParentStep] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const stepsData = [
    { label: "Upload", summary: "Choose your PDF & specify title" },
    { label: "Analyze", summary: "AI processes your content" },
    { label: "Plan", summary: "Review & finalize your study plan" },
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    } else {
      setIsLoading(false);
    }
  }, []);

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

  const handleCarouselFinish = () => setParentStep(1);
  const handleUploadComplete = () => setParentStep(2);
  const handleAnalyzeComplete = () => setParentStep(3);
  const handlePlanModalClose = () => {
    console.log("Plan creation complete or modal closed");
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

  const showStepper = parentStep !== 0;

  return (
    // Outer container: fixed height => scrollable main content
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "80vh",  // or 70vh, as you prefer
        maxHeight: "80vh",
        overflow: "hidden",   // no scroll on this outer container
        backgroundColor: "transparent",
        color: "#fff",
      }}
    >
      {/* Stepper pinned at the top (optional) */}
      {showStepper && (
        <Box
          sx={{
            // if you want it pinned while scrolling:
            // position: "sticky",
            // top: 0,
            // zIndex: 10,
            // backgroundColor: "rgba(0,0,0,0.8)",
            mb: 2,
            p: 1,
          }}
        >
          <Stepper
            alternativeLabel
            activeStep={parentStep - 1}
            sx={{
              "& .MuiStepLabel-label": { color: "#fff", fontWeight: 500 },
              "& .MuiStepIcon-text": { fill: "#fff" },
              "& .MuiStepIcon-root": { color: "#666" },           // default
              "& .Mui-active .MuiStepIcon-root": { color: "#9b59b6" }, // active step
              "& .Mui-completed .MuiStepIcon-root": { color: "#9b59b6" }, // completed steps
              "& .MuiStepConnector-line": { borderColor: "#999" },
            }}
          >
            {stepsData.map((step, i) => (
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
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
        }}
      >
        {/* Step 0 => Onboarding Carousel */}
        {parentStep === 0 && <OnboardingCarousel onFinish={handleCarouselFinish} />}

        {/* Step 1 => UploadBook */}
        {parentStep === 1 && (
          <UploadBook userId={currentUserId} onComplete={handleUploadComplete} />
        )}

        {/* Step 2 => ProcessAnimation */}
        {parentStep === 2 && (
          <ProcessAnimation
            userId={currentUserId}
            onShowPlanModal={handleAnalyzeComplete}
          />
        )}

        {/* Step 3 => EditAdaptivePlanModal */}
        {parentStep === 3 && (
          <EditAdaptivePlanModal
            userId={currentUserId}
            open={true}
            onClose={handlePlanModalClose}
          />
        )}
      </Box>
    </Box>
  );
}