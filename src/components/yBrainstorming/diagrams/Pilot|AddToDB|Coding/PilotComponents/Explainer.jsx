/**
 * File: BloomIntroMultiStep.jsx
 *
 * Description:
 *   A multi-step page (using Material UI Stepper) that covers:
 *     Step 1) Structure & Data
 *     Step 2) Bloom’s Stages (all 5 shown in a grid with icons)
 *     Step 3) Common Revision Loop
 *     Step 4) Scheduling & Time
 *     Step 5) Conclusion
 *
 *   Each step is shown in one "screen" with Next/Back/Skip navigation.
 *   The user can read each section then press Next. 
 *   This is different from having 9 steps or 1 big page.
 *
 * Usage:
 *   <BloomIntroMultiStep onFinish={() => ...navigate or mark 'hasSeenIntro'...} />
 *
 */

import React, { useState } from "react";
import {
  Container,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Box,
  Grid,
  Divider,
} from "@mui/material";

// Example icons:
import MenuBookIcon from "@mui/icons-material/MenuBook"; // for Reading
import QuizIcon from "@mui/icons-material/Quiz";         // for Remember
import WbIncandescentIcon from "@mui/icons-material/WbIncandescent"; // for Understand
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // for Apply
import PsychologyIcon from "@mui/icons-material/Psychology"; // for Analyze
import LoopIcon from "@mui/icons-material/Loop";        // for the common loop

// Step labels for the Stepper
const stepLabels = [
  "Structure & Data",
  "Bloom’s Stages",
  "Revision Loop",
  "Scheduling",
  "Conclusion",
];

export default function BloomIntroMultiStep({ onFinish }) {
  const [activeStep, setActiveStep] = useState(0);

  const isLastStep = activeStep === stepLabels.length - 1;

  function handleNext() {
    if (isLastStep) {
      if (onFinish) onFinish();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  }

  function handleSkip() {
    // user wants to skip entire intro
    if (onFinish) onFinish();
  }

  /** 
   * Renders the content for each step. 
   * We'll keep background dark (#222 / #333) 
   * and text light (#fff / #ddd) 
   */
  function renderStepContent(index) {
    switch (index) {
      case 0:
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: "#fff" }}>
              Structure & Data
            </Typography>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              We organize content into <strong>Chapters</strong> and 
              <strong> Subchapters</strong>. Each subchapter covers multiple 
              <em> concepts</em>.
            </Typography>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              We also gather data on your reading speed, daily time commitments, 
              and quiz performance—tracking which <em>concepts</em> you find easy 
              or difficult. This ensures an <strong>adaptive</strong> experience 
              personalized to you.
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              Once we have your constraints and goals, we can schedule the rest 
              of the journey automatically.
            </Typography>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: "#fff" }}>
              Bloom’s Stages (All at a Glance)
            </Typography>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              Each subchapter’s concepts pass through five stages: 
              Reading, Remember, Understand, Apply, Analyze. 
              Each targets a deeper level of mastery.
            </Typography>
            {/* Grid of the 5 stages with icons */}
            <Grid container spacing={3}>
              {/* Reading */}
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <MenuBookIcon sx={{ fontSize: 50, color: "#FFD700" }} />
                  <Typography variant="h6" sx={{ color: "#fff", mt: 1 }}>
                    Reading
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ddd", mt: 1 }}>
                    Quickly or thoroughly read each subchapter, 
                    measuring reading time for scheduling.
                  </Typography>
                </Box>
              </Grid>
              {/* Remember */}
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <QuizIcon sx={{ fontSize: 50, color: "#FFD700" }} />
                  <Typography variant="h6" sx={{ color: "#fff", mt: 1 }}>
                    Remember
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ddd", mt: 1 }}>
                    Immediate recall questions (MCQ, etc.) 
                    to solidify short‐term memory.
                  </Typography>
                </Box>
              </Grid>
              {/* Understand */}
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <WbIncandescentIcon sx={{ fontSize: 50, color: "#FFD700" }} />
                  <Typography variant="h6" sx={{ color: "#fff", mt: 1 }}>
                    Understand
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ddd", mt: 1 }}>
                    Deeper comprehension checks to ensure 
                    true grasp of the concepts.
                  </Typography>
                </Box>
              </Grid>
              {/* Apply */}
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <BuildCircleIcon sx={{ fontSize: 50, color: "#FFD700" }} />
                  <Typography variant="h6" sx={{ color: "#fff", mt: 1 }}>
                    Apply
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ddd", mt: 1 }}>
                    Real or hypothetical scenarios to test 
                    functional usage of each concept.
                  </Typography>
                </Box>
              </Grid>
              {/* Analyze */}
              <Grid item xs={12} sm={6} md={4}>
                <Box sx={{ textAlign: "center" }}>
                  <PsychologyIcon sx={{ fontSize: 50, color: "#FFD700" }} />
                  <Typography variant="h6" sx={{ color: "#fff", mt: 1 }}>
                    Analyze
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#ddd", mt: 1 }}>
                    Complex tasks requiring deeper, critical 
                    thinking with integrated concepts.
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="body2" sx={{ color: "#999", mt: 2 }}>
              Each stage addresses a different cognitive skill, 
              from basic memory to advanced problem‐solving.
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <LoopIcon sx={{ fontSize: 40, color: "#FFD700", mr: 2 }} />
              <Typography variant="h4" sx={{ color: "#fff" }}>
                The Common Revision Loop
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              Regardless of stage (Remember, Understand, etc.), 
              we always use the same <em>test‐revise‐retest</em> loop:
            </Typography>
            <Typography variant="body2" sx={{ color: "#999", mb: 2 }}>
              1. You face a quiz or tasks on the subchapter’s concepts. <br/>
              2. Any concept you get wrong is immediately flagged for revision. <br/>
              3. Later, we re‐test those “failed” concepts until you pass them. <br/>
              4. Periodically, even passed concepts are re‐examined to ensure 
                 long‐term retention.
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              This loop keeps you from forgetting old or difficult concepts, 
              ensuring continuous mastery.
            </Typography>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: "#fff" }}>
              Scheduling & Time Constraints
            </Typography>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              We gather your <strong>daily reading time</strong>, 
              <em> reading speed</em>, and quiz performance 
              to build a day‐by‐day plan. 
              If you struggle on certain subchapters or concepts, 
              the plan adapts, adding revision sessions.
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              This ensures you progress at a comfortable pace—neither 
              overworked nor underprepared. 
              We aim to hit your target completion date with minimal stress.
            </Typography>
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: "#fff" }}>
              Conclusion
            </Typography>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              You now understand how 
              <strong> chapters → subchapters → concepts</strong> 
              feed into a 5‐stage Bloom’s flow, with a 
              <strong> repeated revision loop</strong> for any missed items, 
              all scheduled within your daily time.
            </Typography>
            <Typography variant="body1" sx={{ color: "#ddd", mb: 2 }}>
              This approach ensures deeper learning, 
              from basic recall to advanced analysis, 
              while adapting to your unique progress.
            </Typography>
            <Typography variant="body2" sx={{ color: "#999" }}>
              Let’s begin your journey! If you ever need a refresher, 
              you can revisit this introduction at any time.
            </Typography>
          </Box>
        );
      default:
        return (
          <Typography sx={{ color: "#fff" }}>
            Oops, something went wrong in the step content!
          </Typography>
        );
    }
  }

  return (
    <Box 
      sx={{
        minHeight: "100vh", 
        backgroundColor: "#222", 
        color: "#fff",
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: 3, backgroundColor: "#333" }}>
          {/* Stepper Header */}
          <Stepper activeStep={activeStep} alternativeLabel>
            {stepLabels.map((label) => (
              <Step key={label}>
                <StepLabel 
                  sx={{
                    ".MuiStepLabel-label": { color: "#ccc" },
                    ".MuiSvgIcon-root": { color: "#FFD700" },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Main Content for each step */}
          <Box sx={{ mt: 3, minHeight: 180 }}>
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Box>
              {activeStep > 0 && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleBack}
                  sx={{ mr: 2 }}
                >
                  Back
                </Button>
              )}
              {!isLastStep && (
                <Button variant="outlined" color="inherit" onClick={handleSkip}>
                  Skip
                </Button>
              )}
            </Box>

            <Box>
              <Button 
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}