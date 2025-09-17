import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import { Link } from "react-router-dom";   // ⬅️ new

const stageColors = {
  Plan:   "#f87171",
  Learn:  "#3b82f6",
  Review: "#818cf8",
  Test:   "#6366f1",
  Sprint: "#ec4899",
};

/* ----------------------------------------------------------------- */
/*  Tool data  (slugs now match ToolPage registry)                   */
/* ----------------------------------------------------------------- */
const tools = [
  {
    id: "clip-gen	",
    emoji: "🎬",
    title: "Clip Generator",
    bg: "linear-gradient(135deg,#fca5a5 0%,#f87171 100%)",
    categories: ["Generate"],
  },
  {
    id: "voice-lab",
    emoji: "🔊",
    title: "Multilingual Voice-over",
    bg: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
    categories: ["Localise"],
  },
  {
    id: "vault",
    emoji: "🔐",
    title: "Compliance Vault",
    bg: "linear-gradient(135deg,#fcd34d 0%,#f97316 100%)",
    categories: ["Deploy"],
  },
  {
    id: "analytics",
    emoji: "📊",
    title: "Safety Analytics",
    bg: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
    categories: ["Verify"],
  },
  {
    id: "lms-bridge",
    emoji: "🔗",
    title: "LMS Bridge (SCORM/xAPI)",
    bg: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
    categories: ["Deploy"],
  },
  
];

/* ----------------------------------------------------------------- */
const ToolCard = ({ t }) => (
  <Card
    sx={{
      borderRadius: 4,
      boxShadow: 3,
      "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
    }}
  >
    {/* Link turns the whole card into a router navigation */}
    <CardActionArea
      component={Link}
      to={`/tools/${t.id}`}
      sx={{ textDecoration: "none" }}
    >
      <Box
        sx={{
          height: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          background: t.bg,
        }}
      >
        {t.emoji}
      </Box>
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t.title}
        </Typography>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
          {t.categories.map((c) => (
            <Chip
              key={c}
              label={c}
              size="small"
              sx={{
                bgcolor: stageColors[c],
                color: "#fff",
                fontWeight: 600,
                height: 20,
              }}
            />
          ))}
        </Stack>
      </CardContent>
    </CardActionArea>
  </Card>
);

/* ----------------------------------------------------------------- */
export default function ToolsGallery() {
  return (
    <Box sx={{ py: 10, bgcolor: "#0f001f" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 2, fontWeight: 700 }}
        >
          Where Each Tool Fits in Your Journey
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{ textAlign: "center", mb: 6, color: "text.secondary" }}
        >
          Here’s how our tools attack each hurdle:
        </Typography>

        <Grid container spacing={4}>
          {tools.map((t) => (
            <Grid key={t.id} item xs={12} sm={6} md={4}>
              <ToolCard t={t} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}