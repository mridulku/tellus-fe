import React, { useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Grid,
  Avatar
} from "@mui/material";

// Icons
import LockIcon from "@mui/icons-material/Lock";
import MenuBookIcon from "@mui/icons-material/MenuBook";   // Reading
import HearingIcon from "@mui/icons-material/Hearing";     // Listening
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver"; // Speaking
import EditIcon from "@mui/icons-material/Edit";           // Writing

// "Adaptive cycle" icons
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import InsightsIcon from "@mui/icons-material/Insights";
import ReplayIcon from "@mui/icons-material/Replay";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

export default function TOEFLOnboardingView() {
  // Example data
  const examDate = "2025-06-15";
  const dailyTime = 45; // minutes/day

  // Tab state: 0 => Reading, 1 => Listening, 2 => Speaking, 3 => Writing
  const [activeTab, setActiveTab] = useState(0);

  // Dummy reading plan
  const readingPlan = [
    {
      day: "Day 1",
      tasks: ["Chapter 1 - Basics", "Reading Exercise", "Short Quiz"],
    },
    {
      day: "Day 2",
      tasks: ["Chapter 2 - Intermediate Passages", "Timed Reading Practice"],
    },
    {
      day: "Day 3",
      tasks: ["Chapter 3 - Advanced Passage", "Discussion Questions"],
    },
  ];

  // If the user is on the Reading tab => show day-by-day plan
  // Otherwise => show a lock message.
  function renderPlanContent() {
    if (activeTab === 0) {
      return (
        <List sx={{ mt: 2 }}>
          {readingPlan.map((dayItem, idx) => (
            <Paper
              key={idx}
              sx={{
                mb: 2,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: 2,
              }}
            >
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="h6" sx={{ color: "#fff" }}>
                      {dayItem.day}
                    </Typography>
                  }
                  secondary={
                    <div style={{ marginTop: "0.5rem" }}>
                      {dayItem.tasks.map((task, i) => (
                        <Typography key={i} variant="body2" sx={{ color: "#ddd" }}>
                          - {task}
                        </Typography>
                      ))}
                    </div>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      );
    } else {
      // Tab 1=Listening, 2=Speaking, 3=Writing => show "Locked / Coming Soon"
      return (
        <Box
          sx={{
            textAlign: "center",
            p: 3,
            border: "2px dashed #555",
            borderRadius: 2,
            mt: 2,
          }}
        >
          <LockIcon sx={{ fontSize: 40, color: "#9b59b6" }} />
          <Typography variant="h6" sx={{ color: "#fff", mt: 1 }}>
            Coming Soon!
          </Typography>
          <Typography variant="body2" sx={{ color: "#ccc", mt: 1 }}>
            This section is not yet unlocked. Stay tuned!
          </Typography>
        </Box>
      );
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: 3,
          p: { xs: 3, sm: 5 },
          backgroundColor: "#1c1c1c",
          color: "#fff",
        }}
      >
        {/* HEADER: Title + Subtext */}
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Your TOEFL Study Plan
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          A quick overview of how our adaptive process will guide your study.
        </Typography>

        {/* Exam Date & Daily Time Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Exam Date <span role="img" aria-label="calendar">📅</span>
                </Typography>
                <Typography variant="body2" sx={{ color: "#ddd" }}>
                  {examDate}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Study Time <span role="img" aria-label="time">⏱</span>
                </Typography>
                <Typography variant="body2" sx={{ color: "#ddd" }}>
                  {dailyTime} minutes/day
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Clear Explanation of Adaptive Process */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
            How Our Adaptive Process Works
          </Typography>
          <Typography variant="body2" sx={{ color: "#ccc", lineHeight: 1.7 }}>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              <li>
                You’ll start by <strong>learning</strong> the core concepts in each section.
              </li>
              <li>
                We’ll prompt you with <strong>quizzes</strong> to gauge your progress.
              </li>
              <li>
                Our system identifies where you’re <strong>doing well</strong> and where you might be <strong>struggling</strong>.
              </li>
              <li>
                Unlike linear platforms, we’ll <strong>revisit your weaker areas</strong> repeatedly, ensuring mastery.
              </li>
              <li>
                This <strong>adaptive cycle</strong> continues until you’re fully prepared for the exam.
              </li>
            </ul>
          </Typography>
        </Box>

        {/* Diagrammatic Flow (single-line horizontal scroll if needed) */}
        <Box
          sx={{
            mb: 4,
            p: 2,
            backgroundColor: "#2c2c2c",
            borderRadius: 2,
            textAlign: "center"
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Our Adaptive Cycle
          </Typography>
          {/* 
            Force single line:
             - flex-wrap: "nowrap"
             - overflowX: "auto"
          */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "nowrap",
              gap: 3,
              overflowX: "auto",
              pb: 2, // small bottom padding to avoid hidden content if there's a scrollbar
            }}
          >
            {/* Step 1: Study & Learn */}
            <Box sx={{ minWidth: "80px", textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "#9b59b6", mx: "auto" }}>
                <SchoolIcon />
              </Avatar>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "nowrap" }}>
                Study & Learn
              </Typography>
            </Box>
            <ArrowForwardIcon sx={{ color: "#fff", fontSize: 24 }} />

            {/* Step 2: Take Quizzes */}
            <Box sx={{ minWidth: "80px", textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "#9b59b6", mx: "auto" }}>
                <QuizIcon />
              </Avatar>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "nowrap" }}>
                Take Quizzes
              </Typography>
            </Box>
            <ArrowForwardIcon sx={{ color: "#fff", fontSize: 24 }} />

            {/* Step 3: Identify Weak Spots */}
            <Box sx={{ minWidth: "80px", textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "#9b59b6", mx: "auto" }}>
                <InsightsIcon />
              </Avatar>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "nowrap" }}>
                Identify Weak Spots
              </Typography>
            </Box>
            <ArrowForwardIcon sx={{ color: "#fff", fontSize: 24 }} />

            {/* Step 4: Review & Revisit */}
            <Box sx={{ minWidth: "80px", textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "#9b59b6", mx: "auto" }}>
                <ReplayIcon />
              </Avatar>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "nowrap" }}>
                Review & Revisit
              </Typography>
            </Box>
            <ArrowForwardIcon sx={{ color: "#fff", fontSize: 24 }} />

            {/* Step 5: Boost Score */}
            <Box sx={{ minWidth: "80px", textAlign: "center" }}>
              <Avatar sx={{ bgcolor: "#9b59b6", mx: "auto" }}>
                <EmojiEventsIcon />
              </Avatar>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: "nowrap" }}>
                Boost Your Score
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2, borderColor: "#555" }} />

        {/* Tabs: Reading + (Listening/Speaking/Writing clickable, but show lock content) */}
        <Tabs
          value={activeTab}
          onChange={(e, newVal) => setActiveTab(newVal)}
          textColor="inherit"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab
            label="Reading"
            icon={<MenuBookIcon />}
            iconPosition="start"
            sx={{ color: "#fff" }}
          />
          <Tab
            label="Listening"
            icon={<HearingIcon />}
            iconPosition="start"
            sx={{ color: "#fff" }}
          />
          <Tab
            label="Speaking"
            icon={<RecordVoiceOverIcon />}
            iconPosition="start"
            sx={{ color: "#fff" }}
          />
          <Tab
            label="Writing"
            icon={<EditIcon />}
            iconPosition="start"
            sx={{ color: "#fff" }}
          />
        </Tabs>

        {/* Render content: Reading or locked? */}
        {renderPlanContent()}
      </Paper>
    </Container>
  );
}