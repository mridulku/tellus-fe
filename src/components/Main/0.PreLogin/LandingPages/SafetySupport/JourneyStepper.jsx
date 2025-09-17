import * as React from "react";
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Typography,
} from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import ReplayIcon from "@mui/icons-material/Replay";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlashOnIcon from "@mui/icons-material/FlashOn";

const steps = [
  { label: "Capture",  icon: <PhotoCameraFrontIcon /> },
  { label: "Generate", icon: <MovieCreationIcon /> },
  { label: "Localise", icon: <TranslateIcon /> },
  { label: "Deploy",   icon: <CloudUploadIcon /> },
  { label: "Verify",   icon: <ChecklistIcon /> }
];


export default function JourneyStepper() {
  return (
    <Box sx={{ py: 8, bgcolor: "#120022" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 6, fontWeight: 700 }}
        >
          One Engine – All Steps of the Journey
        </Typography>

        <Stepper
          alternativeLabel
          activeStep={steps.length - 1}
          sx={{
            ".MuiStepConnector-line": { borderColor: "#4b0082" },
            ".MuiStepLabel-iconContainer": {
              "& .MuiSvgIcon-root": { color: "#FFD700" },
            },
          }}
        >
          {steps.map((s) => (
            <Step key={s.label}>
              <StepLabel icon={s.icon}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  {s.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Container>
    </Box>
  );
}