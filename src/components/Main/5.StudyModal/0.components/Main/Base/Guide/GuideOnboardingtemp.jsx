/* ────────────────────────────────────────────────────────────────
   File:  src/components/GuideOnboarding.jsx
          2-step dummy wizard  •  multi-subject topic picker
───────────────────────────────────────────────────────────────── */
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Slider,
  Chip,
  Paper,
  Grid,
  Stack,
} from "@mui/material";

/* =================================================================================
   1.  STATIC DATA
================================================================================= */
const ACCENT   = "#BB86FC";               // single accent colour
const OFF_BG   = "rgba(255,255,255,.08)";
const SUBJECTS = ["physics", "chemistry", "biology"];

const TOPICS = {
  physics:   ["Mechanics", "Optics", "Electrostatics", "Modern Phy"],
  chemistry: ["Organic", "Inorganic", "Physical"],
  biology:   ["Botany", "Zoology", "Genetics", "Ecology"],
};

const EMOJI = {
  physics:   "🔭",
  chemistry: "⚗️",
  biology:   "🧬",
};

/* =================================================================================
   2.  COMPONENT
================================================================================= */
export default function GuideOnboarding() {
  /* wizard state -------------------------------------------------------------- */
  const [step,     setStep]     = useState(0);       // 0 | 1
  const [topics,   setTopics]   = useState({});      // { physics:[...], chemistry:[...], … }
  const [goal,     setGoal]     = useState("fresh"); // fresh | brush | diagnose
  const [minutes,  setMinutes]  = useState(30);



  function toggleTopic(subject, topic) {
    setTopics((prev) => {
      const set   = new Set(prev[subject] || []);
      set.has(topic) ? set.delete(topic) : set.add(topic);
      return { ...prev, [subject]: [...set] };
    });
  }

  /* helper –  “Goal card”  ---------------------------------------------------- */
  function GoalCard({ id, emoji, title, desc }) {
    const active = goal === id;
    return (
      <Paper
        onClick={() => setGoal(id)}
        elevation={0}
        sx={{
          p: 2,
          flex: 1,
          cursor: "pointer",
          bgcolor: active ? ACCENT : OFF_BG,
          color: active ? "#000" : "#fff",
          border: `1px solid ${active ? ACCENT : "#666"}`,
          transition: ".2s",
          "&:hover": { borderColor: ACCENT },
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "1.8rem" }}>{emoji}</Typography>
        <Typography sx={{ fontWeight: "bold" }}>{title}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {desc}
        </Typography>
      </Paper>
    );
  }

  /* STEP-0  ▸  TOPIC PICKER =================================================== */
  const StepTopics = (
    <>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        1&nbsp;&nbsp;Pick the topics you’d like to cover
      </Typography>

      {SUBJECTS.map((sub) => (
        <Box key={sub} sx={{ mb: 3 }}>
          {/* subject title ----------------------------------------------------- */}
          <Typography
            sx={{
              fontWeight: "bold",
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{EMOJI[sub]}</span>
            {sub.charAt(0).toUpperCase() + sub.slice(1)}
          </Typography>

          {/* chips ------------------------------------------------------------- */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {TOPICS[sub].map((t) => {
              const selected = (topics[sub] || []).includes(t);
              return (
                <Chip
                  key={t}
                  label={t}
                  onClick={() => toggleTopic(sub, t)}
                  variant={selected ? "filled" : "outlined"}
                  sx={{
                    cursor: "pointer",
                    bgcolor: selected ? ACCENT : "transparent",
                    borderColor: ACCENT,
                    "& .MuiChip-label": {
                      color: selected ? "#000" : "#fff",
                    },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      ))}

      {/* nav button ----------------------------------------------------------- */}
      <Box sx={{ textAlign: "right", mt: 4 }}>
        <Button
          variant="contained"
          sx={{ bgcolor: ACCENT, fontWeight: "bold" }}
          onClick={() => setStep(1)}
        >
          Next
        </Button>
      </Box>
    </>
  );

  /* STEP-1  ▸  GOAL + MINUTES ================================================= */
  const StepGoal = (
    <>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        2&nbsp;&nbsp;Set your goal & daily budget
      </Typography>

      {/* goal cards ----------------------------------------------------------- */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <GoalCard
            id="fresh"
            emoji="📚"
            title="Start fresh"
            desc="Cover everything from scratch in order."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GoalCard
            id="brush"
            emoji="📝"
            title="Quick brush-up"
            desc="Revise and identify weak areas to dive deeper."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GoalCard
            id="diagnose"
            emoji="❓"
            title="Not sure – diagnose me"
            desc="Let the system figure out what you need first."
          />
        </Grid>
      </Grid>

      {/* daily minutes slider ------------------------------------------------- */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Daily study budget
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Slider
          min={5}
          max={120}
          step={5}
          value={minutes}
          onChange={(_, v) => setMinutes(v)}
          sx={{ flex: 1, color: ACCENT }}
        />
        <Typography sx={{ width: 60, textAlign: "right" }}>{minutes} m</Typography>
      </Box>

      {/* navigation buttons --------------------------------------------------- */}
      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setStep(0)}
          sx={{ borderColor: ACCENT, color: "#fff" }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          sx={{ bgcolor: ACCENT, fontWeight: "bold" }}
          onClick={() =>
            alert(
              JSON.stringify(
                { topics, minutes, goal },
                null,
                2
              )
            )
          }
        >
          Generate Dummy Plan
        </Button>
      </Stack>
    </>
  );

  /* =================================================================================
     3.  RENDER WRAPPER
  ================================================================================= */
  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: "auto",
        my: 4,
        px: 3,
        py: 4,
        bgcolor: "#000",
        color: "#fff",
        border: `1px solid ${OFF_BG}`,
        borderRadius: 2,
      }}
    >
      {step === 0 ? StepTopics : StepGoal}
    </Box>
  );
}