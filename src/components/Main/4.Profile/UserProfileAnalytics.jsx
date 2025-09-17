/********************************************************************
 *  UserProfileAnalytics.jsx  ▸  V‑0.1.1 “fix dark‑mode text + overflow”
 ********************************************************************/

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase";
import { signOut } from "firebase/auth";
import ConceptMappingView from "../7.NewHome/Support/ConceptMappingView";
import ExamPaperBrowser from "../7.NewHome/Support/ExamPaperBrowser";
import ExamGuidelinesViewer from "../7.NewHome/Support/ExamGuidelinesViewer";


import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import UserHistory from "./REDUNDANT/UserHistory";
import BookExplorer from "../6.AdminPanel/Support/BookExplorer";
import SliceUploader from "../6.AdminPanel/Support/SliceUploader";

import SliceViewer from "../6.AdminPanel/Support/SliceViewer";

/* -------------------------------------------------- auth stuff (unchanged) */
export default function UserProfileAnalytics({ colorScheme = {} }) {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUserId(u ? u.uid : null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authLoading && !userId) navigate("/");
  }, [authLoading, userId, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  /* ------------------------------------------------ demo placeholder data */
  const purposeDemo = { exam: "IIT‑JEE Advanced", target: "Rank ≤ 5 000" };

  const constraintDemo = {
    deadline: "2026‑05‑20 (320 days left)",
    dailyMinutes: 120,
    timeWindow: "19 : 00 – 22 : 30",
  };

  const capacityTiles = [
    {
      cat: "Intake Speed & Fidelity",
      metric: "Reading WPM",
      value: 180,
      expl:
        "Average words‑per‑minute for factual science text. " +
        "Drives how large each study brick can be without overflowing the daily budget.",
    },
    {
      cat: "Short‑Term Manipulation",
      metric: "Working‑Memory Span",
      value: 5,
      expl:
        "Forward digit‑span score (0‑9). Lower span → system shows multi‑step problems with scaffolds.",
    },
    {
      cat: "Retrieval Fluency",
      metric: "1st‑Try Fact Recall",
      value: "62 %",
      expl:
        "Rolling 20‑card window: percent of flash cards answered correctly on the first attempt. " +
        "Paces the spaced‑recall interval.",
    },
    {
      cat: "Reasoning / Transformation",
      metric: "Logic Score",
      value: 3,
      expl:
        "0‑to‑5 score from pattern puzzles + accuracy on mixed‑concept items. " +
        "Higher → earlier exposure to composite JEE questions.",
    },
    {
      cat: "Affective / Self‑Regulation",
      metric: "Motivation Index",
      value: 14,
      expl:
        "0‑20 scale from grit + mood + streaks. Low index triggers lighter sessions and extra nudges.",
    },
  ];

  /* ---------------------------------------------------- helper component */
  const SectionPaper = ({ title, children }) => (
    <Paper
      variant="outlined"
      sx={{
        bgcolor: colorScheme.cardBg || "#262626",
        borderColor: colorScheme.borderColor || "#3A3A3A",
        color: colorScheme.textColor || "#FFFFFF",   // ← NEW: sets default text colour
        p: 2.5,
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: colorScheme.heading || "#BB86FC", mb: 1 }}
      >
        {title}
      </Typography>
      {children}
    </Paper>
  );

  /* --------------------------------------------------------- render */
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: colorScheme.mainBg || "#141414",
        color: colorScheme.textColor || "#FFFFFF",
        p: 3,
        position: "relative",
        overflowY: "auto",
      }}
    >
      {/* logout */}
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Typography
        variant="h4"
        sx={{ color: colorScheme.heading || "#BB86FC", mb: 3 }}
      >
        User Analytics
      </Typography>

      {authLoading && <p>Checking auth …</p>}
      {!authLoading && !userId && <p>No user logged in.</p>}

      {!authLoading && userId && (
        <>
          {/* account */}
          <SectionPaper title="Account">
            <Typography variant="body2">
              <strong>User‑ID:</strong>&nbsp;{userId}
            </Typography>
          </SectionPaper>

          {/* purpose */}
          <SectionPaper title="Purpose (Goal)">
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Exam:</strong>&nbsp;{purposeDemo.exam}
            </Typography>
            <Typography variant="body2">
              <strong>Target:</strong>&nbsp;{purposeDemo.target}
            </Typography>
          </SectionPaper>

          {/* constraints */}
          <SectionPaper title="Constraints">
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Deadline:</strong>&nbsp;{constraintDemo.deadline}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Daily Time Budget:</strong>&nbsp;
              {constraintDemo.dailyMinutes}&nbsp;min
            </Typography>
            <Typography variant="body2">
              <strong>Preferred Window:</strong>&nbsp;{constraintDemo.timeWindow}
            </Typography>
          </SectionPaper>

          {/* capacity */}
          <SectionPaper title="Capacity Snapshot">
            <Grid
              container
              spacing={2}
              sx={{ /* ensures paper grows to fit */ pb: 1 }}
            >
              {capacityTiles.map((t) => (
                <Grid item xs={12} sm={6} md={4} key={t.metric}>
                  <Paper
                    variant="outlined"
                    sx={{
                      bgcolor: "#1E1E1E",
                      borderColor: "#333",
                      p: 2,
                      height: "100%",
                    }}
                  >
                    {/* heading row */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, color: "#FFFFFF" }}
                      >
                        {t.metric}
                      </Typography>
                      <Tooltip title={t.expl} arrow>
                        <IconButton size="small" sx={{ color: "#BBBBBB" }}>
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Divider sx={{ my: 1, borderColor: "#444" }} />

                    <Typography
                      variant="h5"
                      sx={{ color: "#FFFFFF", fontWeight: 700 }}
                    >
                      {t.value}
                    </Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "#CCCCCC",
                        mt: 0.5,
                        display: "block",
                        lineHeight: 1.3,
                      }}
                    >
                      {t.cat}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </SectionPaper>
        </>
      )}
       
        


    </Box>
  );

}