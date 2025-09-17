

// File: src/components/DetailedBookViewer/OnboardingCarousel.jsx
// -----------------------------------------------------------------------------
// A ONE-STEP onboarding guide.
// • Shows the “Welcome” card only
// • Finish button marks the guide-activity complete and advances currentIndex
// -----------------------------------------------------------------------------

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import axios from "axios";

import {
  fetchPlan,
  setCurrentIndex,
} from "../../../../../../../store/planSlice";  // ← adjust path if needed

export default function OnboardingCarousel({ onFinish }) {
  /* ——— hooks / redux ——— */
  const theme          = useTheme();
  const isMobile       = useMediaQuery(theme.breakpoints.down("sm"));
  const dispatch       = useDispatch();

  const userId         = useSelector((s) => s.auth?.userId);
  const planId         = useSelector((s) => s.plan?.planDoc?.id);
  const currentIndex   = useSelector((s) => s.plan?.currentIndex);
  const examType       = (useSelector((s) => s.exam?.examType) || "").toUpperCase();

  /* ——— derived copy ——— */
  const isNEET = examType === "NEET";

  const heading = isNEET
    ? "Hey! Welcome to Your NEET Journey"
    : `Hey! Welcome to Your ${examType || "Exam"} Journey`;

  const bullets = isNEET
    ? [
        "• We’ll prep Physics, Chemistry, & Biology 🔬",
        "• No big test first. Just quick questions 🤗",
        "• Let’s set up your exam details in a jiffy ⏱️",
      ]
    : [
        "• This exam’s onboarding is still being prepared 🛠️",
        "• Stay tuned for customised guidance 🤗",
        "• We’ll add the details soon ⏱️",
      ];

  /* ——— styles ——— */
  const accentPurple      = "#9b59b6";
  const accentPurpleHover = "#8e44ad";

  const wrapperStyle = {
    width: "100%",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    mt: isMobile ? 4 : 6,           // push down a bit from the top bar
  };

  const cardStyle = {
    backgroundColor: "transparent", // blend with dark background
    borderRadius:  "12px",
    padding:       isMobile ? "1.5rem" : "2rem",
    maxWidth:      isMobile ? "90%"   : "600px",
    textAlign:     "center",
  };

  const iconCircle = {
    width: 80,
    height: 80,
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1.5rem",
  };

  const finishBtnStyle = {
    mt: 2,
    backgroundColor: accentPurple,
    textTransform: "none",
    fontWeight: "bold",
    "&:hover": { backgroundColor: accentPurpleHover },
  };

  /* ——— handler ——— */
  async function handleFinishGuide() {
    const oldIndex = currentIndex;

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, {
        userId,
        planId,
        activityId: "GUIDE_ACTIVITY_ID",
        completionStatus: "complete",
      });

      await dispatch(
        fetchPlan({
          planId,
          backendURL: import.meta.env.VITE_BACKEND_URL,
          fetchUrl: "/api/adaptive-plan",
        })
      );

      dispatch(setCurrentIndex(oldIndex + 1)); // move to next activity
    } catch (err) {
      console.error("Error finishing guide activity:", err);
      dispatch(setCurrentIndex(oldIndex + 1));
    }

    typeof onFinish === "function" && onFinish();
  }

  /* ——— render ——— */
  return (
    <Box sx={wrapperStyle}>
      <Box sx={cardStyle}>
        <Box sx={iconCircle}>
          <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: "bold", color: accentPurple, mb: 2, whiteSpace: "nowrap"  }}>
          {heading}
        </Typography>

        <Typography variant="body1" sx={{ color: "#ccc", mb: 3 }}>
          {bullets.map((txt) => (
            <div key={txt}>{txt}</div>
          ))}
        </Typography>

        <Button variant="contained" sx={finishBtnStyle} onClick={handleFinishGuide}>
          Start
        </Button>
      </Box>
    </Box>
  );
}