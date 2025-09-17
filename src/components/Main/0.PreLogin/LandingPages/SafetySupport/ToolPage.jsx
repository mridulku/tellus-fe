import * as React from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Chip,
  Stack,
  Button,
} from "@mui/material";

/* ------------------------------------------------------------------ */
/*  Tool registry — add real data later                               */
/* ------------------------------------------------------------------ */
const tools = {
  chat: {
    title: "Smart Chat",
    emoji: "💬",
    gradient: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
    teaser: "Ask any concept question and get instant answers.",
    categories: ["Learn", "Review"],
  },
  "rapid-fire": {
    title: "Rapid-Fire Drill",
    emoji: "⚡",
    gradient: "linear-gradient(135deg,#fcd34d 0%,#f97316 100%)",
    teaser: "30-second recall loops to test your memory.",
    categories: ["Learn"],
  },
  "quick-revise": {
    title: "Quick Revise",
    emoji: "🔄",
    gradient: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
    teaser: "Spaced flash review that sticks.",
    categories: ["Review"],
  },
  "mock-to-drill": {
    title: "Mock-to-Drill",
    emoji: "🧪",
    gradient: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
    teaser: "Turn missed mock questions into targeted drills.",
    categories: ["Test"],
  },
  sprint: {
    title: "Red-Zone Sprint",
    emoji: "🚩",
    gradient: "linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)",
    teaser: "High-weight blitz for the last 30 days.",
    categories: ["Sprint"],
  },
};

/* category colour map (matches landing badges) */
const stageColors = {
  Plan: "#f87171",
  Learn: "#3b82f6",
  Review: "#818cf8",
  Test: "#6366f1",
  Sprint: "#ec4899",
};

/* ------------------------------------------------------------------ */
/*  Generic tool page component                                       */
/* ------------------------------------------------------------------ */
export default function ToolPage() {
  const { slug } = useParams();
  const tool = tools[slug];

  /* invalid slug → go home */
  if (!tool) return <Navigate to="/" replace />;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#0f001f",
        color: "#fff",
        py: 8,
      }}
    >
      {/* hero strip */}
      <Box
        sx={{
          height: 200,
          background: tool.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 96,
        }}
      >
        {tool.emoji}
      </Box>

      <Container sx={{ mt: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          {tool.title}
        </Typography>

        <Typography variant="h6" sx={{ color: "text.secondary", mb: 3 }}>
          {tool.teaser}
        </Typography>

        {/* category chips */}
        <Stack direction="row" spacing={1} mb={5}>
          {tool.categories.map((c) => (
            <Chip
              key={c}
              label={c}
              sx={{ bgcolor: stageColors[c], color: "#fff", fontWeight: 600 }}
            />
          ))}
        </Stack>

        {/* filler / placeholder content */}
        <Typography variant="body1" sx={{ mb: 4 }}>
          <em>
            This is a placeholder demo area. Replace it with the actual tool
            UI, soft-wall limits, and sign-up prompts.
          </em>
        </Typography>

        <Button variant="contained" color="secondary" size="large">
          Try the full version → Sign in
        </Button>
      </Container>
    </Box>
  );
}