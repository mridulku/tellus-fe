import * as React from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardContent,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import ReplayIcon from "@mui/icons-material/Replay";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";

/* ----------------------------------------------------------------- */
/*  small tool card                                                  */
/* ----------------------------------------------------------------- */
const ToolCard = ({ tool }) => (
  <Card
    sx={{
      borderRadius: 4,
      width: 240,
      mb: 2,
      boxShadow: 3,
      "&:hover": { boxShadow: 6 },
    }}
  >
    <CardActionArea sx={{ height: "100%" }}>
      <Box
        sx={{
          height: 90,
          background: tool.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
        }}
      >
        {tool.emoji}
      </Box>
      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {tool.title}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

/* ----------------------------------------------------------------- */
/*  data                                                             */
/* ----------------------------------------------------------------- */
const stages = [
  {
    name: "Plan",
    icon: <SchoolIcon />,
    tools: [
      {
        id: "planner",
        emoji: "📅",
        title: "Auto-Gantt Planner",
        bg: "linear-gradient(135deg,#fca5a5 0%,#f87171 100%)",
      },
    ],
  },
  {
    name: "Learn",
    icon: <QuizIcon />,
    tools: [
      {
        id: "chat",
        emoji: "💬",
        title: "Smart Chat",
        bg: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
      },
      {
        id: "rapid",
        emoji: "⚡",
        title: "Rapid-Fire Drill",
        bg: "linear-gradient(135deg,#fcd34d 0%,#f97316 100%)",
      },
    ],
  },
  {
    name: "Review",
    icon: <ReplayIcon />,
    tools: [
      {
        id: "revise",
        emoji: "🔄",
        title: "Quick Revise",
        bg: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
      },
    ],
  },
  {
    name: "Test",
    icon: <EmojiEventsIcon />,
    tools: [
      {
        id: "mock",
        emoji: "🧪",
        title: "Mock-to-Drill",
        bg: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
      },
    ],
  },
  {
    name: "Sprint",
    icon: <FlashOnIcon />,
    tools: [
      {
        id: "sprint",
        emoji: "🚩",
        title: "Red-Zone Sprint",
        bg: "linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)",
      },
    ],
  },
];

/* ----------------------------------------------------------------- */
export default function JourneyTools() {
  return (
    <Box sx={{ py: 10, bgcolor: "#0f001f" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 6, fontWeight: 700 }}
        >
          Where Each Tool Fits in Your Journey
        </Typography>

        {stages.map((stage) => (
          <Grid
            container
            spacing={3}
            alignItems="center"
            sx={{ mb: 6 }}
            key={stage.name}
          >
            {/* left column – step label */}
            <Grid item xs={12} md={3}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {stage.icon}
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {stage.name}
                </Typography>
              </Box>
            </Grid>

            {/* right column – tool cards */}
            <Grid
              item
              xs={12}
              md={9}
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {stage.tools.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </Grid>
          </Grid>
        ))}
      </Container>
    </Box>
  );
}