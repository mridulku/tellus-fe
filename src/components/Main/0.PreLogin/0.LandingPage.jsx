/********************************************************************
 *  LandingRouter.jsx  (static, no backend) – updated “Select Exam” flow
 ********************************************************************/
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ThemeProvider, createTheme, CssBaseline,
  AppBar, Toolbar, Typography, Container, Box, Button,
  Grid, Card, CardActionArea, Dialog, DialogContent,
  Stack, IconButton, Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import TimelineIcon from "@mui/icons-material/Timeline";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import PsychologyIcon from "@mui/icons-material/Psychology";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import TableViewIcon from "@mui/icons-material/TableView";

////////////////////////////////////////////////////////////////////////////////
// 1. THEME
////////////////////////////////////////////////////////////////////////////////
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#B39DDB" },    // purple
    secondary: { main: "#FFD700" },  // gold
    background: { default: "#0F0F0F", paper: "#1F1F1F" },
    text: { primary: "#ffffff", secondary: "#b3b3b3" }
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "sans-serif"].join(","),
    h2: { fontWeight: 700, lineHeight: 1.15 },
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 }
  }
});

////////////////////////////////////////////////////////////////////////////////
// 2. STATIC DATA
////////////////////////////////////////////////////////////////////////////////
const EXAMS = [
  { slug: "cbse",         name: "CBSE" },
  { slug: "jeeadvanced",  name: "JEE Adv" },
  { slug: "neet",         name: "NEET" },
  { slug: "sat",          name: "SAT" },
  { slug: "gate",         name: "GATE" },
  { slug: "cat",          name: "CAT" },
  { slug: "gre",          name: "GRE" },
  { slug: "toefl",        name: "TOEFL" },
  { slug: "upsc",         name: "UPSC" },
  { slug: "frm",          name: "FRM" }
];

////////////////////////////////////////////////////////////////////////////////
// 3. EXAM‑PICKER MODAL
////////////////////////////////////////////////////////////////////////////////
function ExamDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent
        sx={{
          bgcolor: "background.paper",
          p: 4,
          position: "relative"
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 8, right: 8, color: "primary.main" }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" sx={{ color: "primary.main", mb: 3 }}>
          Select an Exam
        </Typography>

        <Grid container spacing={2}>
          {EXAMS.map((ex) => (
            <Grid item xs={6} sm={4} key={ex.slug}>
              <Button
                fullWidth
                variant="outlined"
                component={Link}
                to={`/${ex.slug}`}
                onClick={onClose}
                sx={{
                  height: 60,
                  fontWeight: 600,
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": { borderColor: "secondary.main", color: "secondary.main" }
                }}
              >
                {ex.name}
              </Button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 4. HERO (shared)
////////////////////////////////////////////////////////////////////////////////
function Hero({ title, subtitle, onOpenDialog }) {
  return (
    <Box
      sx={{
        minHeight: "85vh",
        display: "flex",
        alignItems: "center",
        py: 10,
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(160deg,#000 40%,#1A1A1A 100%)"
      }}
    >
      {/* decorative icon grid */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.05,
          display: "grid",
          gridTemplateColumns: "repeat(6,1fr)",
          gap: 8,
          px: 4,
          py: 8
        }}
      >
        {[
          EmojiObjectsIcon,
          RocketLaunchIcon,
          PsychologyIcon,
          TimelineIcon,
          AutoAwesomeMotionIcon,
          DoneAllIcon
        ].map((Ic, i) => (
          <Ic key={i} style={{ fontSize: 160, color: "#ffffff" }} />
        ))}
      </Box>

      <Container sx={{ position: "relative" }}>
        <Typography variant="h2" sx={{ color: "primary.main", mb: 3 }}>
          {title}
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: "text.secondary", maxWidth: 720, mb: 5, lineHeight: 1.6 }}
        >
          {subtitle}
        </Typography>
        <Button
          variant="outlined"
          size="large"
          sx={{ px: 4, fontWeight: 600 }}
          onClick={onOpenDialog}
        >
          Select Exam
        </Button>
      </Container>
    </Box>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 5. FEATURES + JOURNEY + STATS (re‑used by both landings)
////////////////////////////////////////////////////////////////////////////////
function Features() {
  const items = [
    {
      icon: <EmojiObjectsIcon />,
      title: "AI‑Curated Content",
      desc: "Instantly turns any syllabus into practice questions & flashcards."
    },
    {
      icon: <RocketLaunchIcon />,
      title: "Adaptive Scheduling",
      desc: "Daily plan flexes to your pace, accuracy & availability."
    },
    {
      icon: <TableViewIcon />,
      title: "Deep Analytics",
      desc: "Track mastery by chapter, Bloom’s level & question type."
    },
    {
      icon: <PsychologyIcon />,
      title: "Smart Revision Loops",
      desc: "Spaced‑repetition + teach‑back prompts for bullet‑proof recall."
    }
  ];

  return (
    <Box sx={{ py: 10 }}>
      <Container>
        <Typography variant="h4" sx={{ textAlign: "center", color: "primary.main", mb: 6 }}>
          Why Learners Love Us
        </Typography>
        <Grid container spacing={4}>
          {items.map((f) => (
            <Grid item xs={12} sm={6} md={3} key={f.title}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  height: "100%",
                  bgcolor: "background.paper",
                  textAlign: "center"
                }}
              >
                {React.cloneElement(f.icon, { sx: { fontSize: 40, color: "primary.main", mb: 1 } })}
                <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
                  {f.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {f.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function Journey() {
  const steps = [
    { icon: <PsychologyIcon />, title: "Assess" },
    { icon: <AutoAwesomeMotionIcon />, title: "Focus" },
    { icon: <EmojiObjectsIcon />, title: "Practice" },
    { icon: <TimelineIcon />, title: "Track" },
    { icon: <DoneAllIcon />, title: "Succeed" }
  ];

  return (
    <Box sx={{ py: 10, bgcolor: "background.paper" }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ textAlign: "center", color: "primary.main", mb: 6 }}>
          Your Adaptive Journey
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {steps.map((s) => (
            <Grid item xs={6} sm={4} md={2.4} key={s.title}>
              <Stack spacing={2} alignItems="center">
                {React.cloneElement(s.icon, { sx: { fontSize: 36, color: "primary.main" } })}
                <Typography variant="h6" sx={{ color: "primary.main", textAlign: "center" }}>
                  {s.title}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function Stats() {
  const stats = [
    { label: "Learners Served", value: "8 500+" },
    { label: "Avg. Score Boost", value: "14 %" },
    { label: "Time Saved", value: "60 %" },
    { label: "Satisfaction", value: "97 %" }
  ];

  return (
    <Box sx={{ py: 10, bgcolor: "background.default" }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ textAlign: "center", color: "primary.main", mb: 6 }}>
          Real Results, Real Learners
        </Typography>
        <Grid container spacing={4}>
          {stats.map((s) => (
            <Grid item xs={12} sm={6} key={s.label}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  textAlign: "center",
                  bgcolor: "background.paper"
                }}
              >
                <Typography variant="h4" sx={{ color: "primary.main", mb: 1 }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {s.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 6. EXAM GRID (only on generic page)
////////////////////////////////////////////////////////////////////////////////
function ExamsGrid() {
  return (
    <Box sx={{ py: 10 }}>
      <Container>
        <Typography variant="h4" sx={{ textAlign: "center", color: "primary.main", mb: 4 }}>
          Explore our supported exams
        </Typography>
        <Grid container spacing={3}>
          {EXAMS.map((ex) => (
            <Grid item xs={6} sm={4} md={3} key={ex.slug}>
              <CardActionArea component={Link} to={`/${ex.slug}`}>
                <Card
                  variant="outlined"
                  sx={{
                    height: 130,
                    bgcolor: "background.paper",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: ".2s",
                    "&:hover": { transform: "scale(1.05)" }
                  }}
                >
                  <Typography variant="h6" sx={{ color: "primary.main" }}>
                    {ex.name}
                  </Typography>
                </Card>
              </CardActionArea>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 7. FOOTER
////////////////////////////////////////////////////////////////////////////////
function Footer() {
  return (
    <Box sx={{ py: 4, textAlign: "center", bgcolor: "#000" }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        © {new Date().getFullYear()} talk‑ai.co · All rights reserved
      </Typography>
    </Box>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 8. LANDING VARIANTS
////////////////////////////////////////////////////////////////////////////////
function GenericLanding({ onOpenDialog }) {
  return (
    <>
      <Hero
        title="Adaptive Learning for Every Major Exam"
        subtitle="Pinpoint your knowledge gaps and boost your scores with AI‑driven, adaptive study paths."
        onOpenDialog={onOpenDialog}
      />
      <ExamsGrid />
      <Features />
      <Journey />
      <Stats />
      <Footer />
    </>
  );
}

function ExamLanding({ examName, onOpenDialog }) {
  return (
    <>
      <Hero
        title={`Master ${examName} with Adaptive AI`}
        subtitle={`Stop wasting hours on what you already know—our engine pin‑points exactly what matters for ${examName}.`}
        onOpenDialog={onOpenDialog}
      />
      <Features />
      <Journey />
      <Stats />
      <Footer />
    </>
  );
}

////////////////////////////////////////////////////////////////////////////////
// 9. MAIN ROUTER COMPONENT
////////////////////////////////////////////////////////////////////////////////
export default function LandingRouter() {
  const { examSlug } = useParams(); // undefined on "/"
  const examMeta = EXAMS.find((e) => e.slug === examSlug);

  const [openDialog, setOpenDialog] = useState(false);
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Shared AppBar */}
      <AppBar position="sticky" sx={{ bgcolor: "transparent", boxShadow: "none" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: "primary.main", fontWeight: "bold", textDecoration: "none" }}
          >
            talk‑ai.co
          </Typography>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" color="primary" onClick={handleOpenDialog}>
              Select Exam
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Landing variant */}
      {examMeta ? (
        <ExamLanding examName={examMeta.name} onOpenDialog={handleOpenDialog} />
      ) : (
        <GenericLanding onOpenDialog={handleOpenDialog} />
      )}

      <ExamDialog open={openDialog} onClose={handleCloseDialog} />
    </ThemeProvider>
  );
}