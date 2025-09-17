// src/components/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ---- Material UI Imports ----
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  IconButton,
  Drawer,
  Stack,
  Dialog
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

// Icons for feature/step sections
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import PsychologyIcon from "@mui/icons-material/Psychology";
import TimelineIcon from "@mui/icons-material/Timeline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import TableViewIcon from "@mui/icons-material/TableView";       // For 'WhyWe'reDifferent'
import DescriptionIcon from "@mui/icons-material/Description"; // For 'SeeItInAction'

// Import your PanelAdaptiveProcess (the bottom section)
import PanelAdaptiveProcess from "../2.PanelAdaptiveProcess";
// Import the sign-in component
import AuthSignIn from "../1.AuthSignIn";

/** ------------------------------------------------------------------
 * 1) CREATE THE DARK + PURPLE THEME
 * ------------------------------------------------------------------ */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#B39DDB", // Purple accent
    },
    secondary: {
      main: "#FFD700", // Gold accent
    },
    background: {
      default: "#0F0F0F",
      paper: "#1F1F1F"
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#b3b3b3"
    }
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(",")
  }
});

/** ------------------------------------------------------------------
 * 2) NAVBAR (AppBar)
 * ------------------------------------------------------------------ */
function LandingAppBar({ onOpenSignIn }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <AppBar position="sticky" sx={{ bgcolor: "transparent", boxShadow: "none" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* LOGO or Brand */}
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "primary.main", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          talk-ai.co
        </Typography>

        {/* Large screens: sign in button */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            sx={{ borderColor: "primary.main" }}
            onClick={onOpenSignIn} // open modal
          >
            Sign In
          </Button>
        </Box>

        {/* Small screen menu icon */}
        <IconButton
          onClick={toggleDrawer}
          sx={{ display: { xs: "block", md: "none" }, color: "primary.main" }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="top" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ p: 2, bgcolor: "background.default" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={toggleDrawer} sx={{ color: "primary.main" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                toggleDrawer();
                onOpenSignIn(); // open modal
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}

/** ------------------------------------------------------------------
 * 3) HERO SECTION: Big Title + CTA => open the modal
 * ------------------------------------------------------------------ */
function HeroSection({ onOpenSignIn }) {
  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(160deg, #000000 40%, #1A1A1A 100%)",
        py: 8
      }}
    >
      <Container>
        {/* Title */}
        <Typography variant="h2" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
          Adaptive Learning for Everyone
        </Typography>

        {/* Subtext */}
        <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 700, mb: 4, lineHeight: 1.6 }}>
          Whether you're a high-school student, competitive exam aspirant, or a professional upskilling—
          our AI-powered platform personalizes each lesson to your unique pace and goals. Simply upload 
          your PDFs or study materials, and let us transform them into a tailor-made learning plan so you 
          study exactly what you need, when you need it.
        </Typography>

        {/* CTA => open sign-in modal */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mr: 2, fontWeight: "bold" }}
          onClick={onOpenSignIn}
        >
          Get Started
        </Button>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 4) PAIN + SOLUTION SECTION
 * ------------------------------------------------------------------ */
function PainGainSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          Say Goodbye to Aimless Studying
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 700, mx: "auto", mb: 4 }}>
          Tired of generic textbooks or endless question banks? Our AI-driven approach focuses exactly on what you
          need, when you need it—so you can learn faster, score higher, and stay motivated.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
                Common Frustrations
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Wasting hours on chapters you already know
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Feeling overwhelmed with no clear direction
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Boredom from repetitive drills that aren’t adaptive
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • Guessing which topics matter most
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
                Our Solution
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Personalized study paths skipping mastered areas
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • AI-curated quizzes from your own PDFs
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Intelligent scheduling for your comfortable pace
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • Real-time analytics ensuring each minute is productive
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 5) LEARNING JOURNEY: 5 STAGES
 * ------------------------------------------------------------------ */
function LearningJourneySection() {
  const stages = [
    {
      icon: <PsychologyIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Assess",
      bullets: [
        "Quick baseline on your PDFs/course files",
        "No re-learning what you already mastered"
      ],
    },
    {
      icon: <AutoAwesomeMotionIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Focus",
      bullets: [
        "AI identifies your exact weak spots",
        "Concentrate on what truly boosts scores"
      ],
    },
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Practice",
      bullets: [
        "Adaptive quizzes & Bloom’s-based loops",
        "Deeper understanding beyond memorization"
      ],
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Track & Adapt",
      bullets: [
        "Real-time progress dashboards",
        "Study plan evolves as you improve"
      ],
    },
    {
      icon: <DoneAllIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Succeed",
      bullets: [
        "Hit your exam or skill goals faster",
        "Walk in confident & stress-free"
      ],
    },
  ];

  // first 3 in row1, last 2 in row2
  const row1 = stages.slice(0, 3);
  const row2 = stages.slice(3);

  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Your Learning Journey
        </Typography>

        {/* FIRST ROW => 3 cards */}
        <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
          {row1.map((stage, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                {stage.icon}
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}>
                  {stage.title}
                </Typography>
                {stage.bullets.map((b, i) => (
                  <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    {b}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* SECOND ROW => 2 cards, centered */}
        <Grid container spacing={4} justifyContent="center">
          {row2.map((stage, idx) => (
            <Grid item xs={12} sm={6} md={6} key={idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                {stage.icon}
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}>
                  {stage.title}
                </Typography>
                {stage.bullets.map((b, i) => (
                  <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    {b}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 6) STATS + PROOF => random data showcasing improvements
 * ------------------------------------------------------------------ */
function StatsAndProofSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.paper" }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Real Results from Real Learners
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                5,000+ Learners
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Have uploaded over 10,000 PDFs and counting!
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                88% Score Improvement
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Among those who studied consistently for 4+ weeks, with an average +14% jump in exam marks.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                60% Time Saved
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Learners skip re-reading known chapters and focus only on critical gaps.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                97% Satisfaction
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Students rave about reduced stress and clearer focus, calling it “the ultimate AI study partner.”
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 7) WHY WE'RE DIFFERENT => bullet comparison table
 * ------------------------------------------------------------------ */
function WhyWeAreDifferentSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Why We're Different
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper", height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TableViewIcon sx={{ color: "primary.main", fontSize: 30, mr: 1 }} />
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                  Typical E-Learning Tools
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - Often come with static question banks
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - Manual quiz creation or limited pre-made content
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - One-size-fits-all approach with minimal personalization
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - Lacks deeper conceptual checks beyond rote memory
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper", height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TableViewIcon sx={{ color: "primary.main", fontSize: 30, mr: 1 }} />
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                  Our AI-Driven Platform
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Upload any PDF or study material—GPT instantly parses and transforms it into quizzes & revision loops
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Deep adaptivity: questions evolve based on Bloom’s levels and your performance
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Saves hours by skipping known topics and focusing on true weak spots
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Comprehensive conceptual coverage for deeper mastery, not just surface memory
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 8) SEE IT IN ACTION => mock snippet of PDF -> quiz transformation
 * ------------------------------------------------------------------ */
function SeeItInActionSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.paper" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          See It in Action
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", textAlign: "center", maxWidth: 700, mx: "auto", mb: 4 }}
        >
          Upload your PDF, let AI parse the content, and instantly generate a tailored quiz and revision schedule. 
          Here's a quick demo video showing exactly how it works:
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" // placeholder link
            title="MyAdaptiveApp Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "center", maxWidth: 600, mx: "auto" }}
        >
          In just a few clicks, our AI scans your document, identifies your knowledge gaps, and builds a 
          targeted learning path—no manual question creation needed.
        </Typography>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 9) FEATURES SECTION (The Power of AI)
 * ------------------------------------------------------------------ */
function FeaturesSection() {
  const features = [
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "AI-Powered Insights",
      desc: "Algorithms analyze reading speed, quiz performance, and complexity to dynamically refine your plan."
    },
    {
      icon: <ThumbUpIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "Personalized Feedback",
      desc: "Pinpoint your strengths and weaknesses quickly. Get strategies for continuous improvement."
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "Rapid Mastery",
      desc: "No guesswork—focus on precisely what matters for maximum progress, exam readiness, or skill mastery."
    }
  ];

  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          The Power of AI
        </Typography>
        <Grid container spacing={4}>
          {features.map((feat, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                variant="outlined"
                sx={{ bgcolor: "background.paper", height: "100%", textAlign: "center", p: 2 }}
              >
                <CardContent>
                  {feat.icon}
                  <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {feat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 10) TESTIMONIAL
 * ------------------------------------------------------------------ */
function TestimonialSection() {
  return (
    <Box sx={{ py: 6, backgroundColor: "background.paper" }}>
      <Container maxWidth="md">
        <Typography
          variant="h5"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          Hear From Our Learners
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", textAlign: "center", mb: 4 }}
        >
          Thousands of students and professionals use MyAdaptiveApp. Here’s what one user says:
        </Typography>

        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#2A2A2A" }}>
          <Typography variant="body1" sx={{ fontStyle: "italic", color: "#ffffff", mb: 2 }}>
            “I improved my exam scores by <strong>20%</strong> in just four weeks!
            The adaptive plan saved me hours by focusing on exactly what I needed.”
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
            — Alex, Engineering Student
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 11) ADAPTIVE LEARNING WORKS (bottom)
 * ------------------------------------------------------------------ */
function AdaptiveProcessSection() {
  return (
    <Box sx={{ py: 6, backgroundColor: "background.default", textAlign: "center" }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ color: "primary.main", fontWeight: "bold", mb: 4 }}>
          How Our Adaptive Learning Works
        </Typography>
        <PanelAdaptiveProcess />
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 12) FOOTER
 * ------------------------------------------------------------------ */
function Footer() {
  return (
    <Box sx={{ py: 4, textAlign: "center", bgcolor: "#000000" }}>
      <Container>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          © {new Date().getFullYear()} MyAdaptiveApp. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Terms &nbsp; | &nbsp; Privacy &nbsp; | &nbsp; Contact
        </Typography>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 13) MAIN LANDING PAGE
 * ------------------------------------------------------------------ */
export default function GenericLandingPage() {
  const navigate = useNavigate();
  const [openSignIn, setOpenSignIn] = useState(false);

  // If user is already logged in => skip landing
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Handlers for open/close the sign-in modal
  const handleOpenSignIn = () => {
    setOpenSignIn(true);
  };
  const handleCloseSignIn = () => {
    setOpenSignIn(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* 1) Navbar */}
      <LandingAppBar onOpenSignIn={handleOpenSignIn} />

      {/* 2) Hero */}
      <HeroSection onOpenSignIn={handleOpenSignIn} />

      {/* 3) Pain+Solution */}
      <PainGainSection />

      {/* 4) 5-Stage Learning Journey */}
      <LearningJourneySection />

      {/* 5) Stats + Proof */}
      <StatsAndProofSection />

      {/* 6) Why We Are Different */}
      <WhyWeAreDifferentSection />

      {/* 7) See It in Action */}
      <SeeItInActionSection />

      {/* 8) Features */}
      <FeaturesSection />

      {/* 9) Testimonial */}
      <TestimonialSection />

      {/* 10) Adaptive Learning (Panel) */}
      <AdaptiveProcessSection />

      {/* 11) Footer */}
      <Footer />

      {/* Sign-In Modal */}
      <Dialog
        open={openSignIn}
        onClose={handleCloseSignIn}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "background.paper" }
        }}
      >
        <AuthSignIn />
      </Dialog>
    </ThemeProvider>
  );
}