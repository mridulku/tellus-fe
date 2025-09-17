// src/components/TOEFLOnboardingProcessing.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  LinearProgress,
  Box,
  Button,
} from "@mui/material";

// Array of messages to rotate through
const LOADING_MESSAGES = [
  "Analyzing your data...",
  "Generating your reading plan...",
  "Creating listening modules...",
  "Finalizing writing tasks...",
  "Reviewing everything..."
];

export default function TOEFLOnboardingProcessing() {
  // Progress from 0 to 100
  const [progress, setProgress] = useState(0);

  // Keep track of which message to show
  const [messageIndex, setMessageIndex] = useState(0);

  // Whether we’re “done” (plans successfully fetched)
  const [isDone, setIsDone] = useState(false);

  // Whether we took longer than expected
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    // Simulate calling the backend to create plans
    // For demonstration, let's pretend it returns in 12 seconds
    const fakeBackendTime = 12 * 1000;
    const backendTimeout = setTimeout(() => {
      // Once the backend is "done," mark isDone = true
      setIsDone(true);
    }, fakeBackendTime);

    // Cleanup if this component unmounts
    return () => clearTimeout(backendTimeout);
  }, []);

  useEffect(() => {
    // Progress bar increment: ~20 seconds total from 0 to 100
    // We'll increment 5% every second -> total 20s
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

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Rotate through messages every 3 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    // If we hit 100% but isDone is still false => we’re taking longer
    if (progress === 100 && !isDone) {
      setIsTakingLong(true);
    }
  }, [progress, isDone]);

  const currentMessage = LOADING_MESSAGES[messageIndex];

  const handleViewPlan = () => {
    // If you want to navigate to a plan page or do something else:
    alert("Plans are ready! (In real code, navigate to your plan UI.)");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: 3,
          p: { xs: 3, sm: 5 },
          backgroundColor: "#fdfdfd",
          textAlign: "center"
        }}
      >
        {!isDone && !isTakingLong && (
          <>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Preparing Your TOEFL Plan
            </Typography>

            <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary" }}>
              Please hold on while we build your personalized plan.
            </Typography>

            {/* Progress Bar */}
            <Box sx={{ width: "100%", mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {Math.round(progress)}% Complete
            </Typography>

            {/* Rotating Message */}
            <Typography variant="body2" color="text.secondary">
              {currentMessage}
            </Typography>
          </>
        )}

        {/* If done early (backend responded) */}
        {isDone && (
          <>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Your Plan is Ready!
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 3 }}>
              We’ve finished creating your TOEFL study plan.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleViewPlan}
            >
              View My Plan
            </Button>
          </>
        )}

        {/* If progress hits 100% but still not done => longer wait */}
        {isTakingLong && !isDone && (
          <>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Still Working...
            </Typography>
            <Typography variant="subtitle1" sx={{ mb: 3, color: "text.secondary" }}>
              It’s taking a bit longer than usual. We’re still preparing your plan.
            </Typography>

            {/* Optionally show a “retry” or keep waiting */}
            <Box sx={{ width: "100%", mb: 2 }}>
              <LinearProgress variant="indeterminate" />
            </Box>
            <Typography variant="body2" sx={{ mb: 3 }} color="text.secondary">
              Please don’t close this page yet.
            </Typography>
          </>
        )}
      </Paper>
    </Container>
  );
}