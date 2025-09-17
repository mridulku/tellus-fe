// ----- File: src/components/LoadingOnboarding.jsx -----------------
import React, { useState, useEffect } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

export default function LoadingOnboarding({ estSeconds = 90 }) {
  /* 1️⃣   Fake % complete: 0 → 100 over estSeconds  */
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = (Date.now() - start) / 1000;           // elapsed seconds
      const p = Math.min(100, Math.floor((t / estSeconds) * 100));
      setPct(p);
      if (p === 100) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [estSeconds]);

  /* 2️⃣   Friendly messages that cycle every 5 s     */
  const messages = [
    "Cloning your personal books…",
    "Generating adaptive plan…",
    "Warming up quizzes…",
    "Almost there — just checking prerequisites…",
  ];
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 5_000);
    return () => clearInterval(id);
  }, []);

  /* 3️⃣   Render centred panel                     */
  return (
    <Box sx={{
      position: "fixed", inset: 0, bgcolor: "#000", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", zIndex: 9999, p: 3
    }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Setting up your onboarding&nbsp;plan…
      </Typography>

      <Box sx={{ width: 320, maxWidth: "90vw" }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 8, borderRadius: 4,
            "& .MuiLinearProgress-bar": { backgroundColor: "#BB86FC" },
            mb: 2
          }}
        />
        <Typography variant="caption" sx={{ color: "#bbb" }}>
          {messages[msgIdx]}
        </Typography>
      </Box>
    </Box>
  );
}