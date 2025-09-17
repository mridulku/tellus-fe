// src/components/TOEFLOnboardingTest.jsx
import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Button,
  Box,
  Divider
} from "@mui/material";

// Map each timeframe option to a numerical offset (in days).
// Feel free to adjust these values to your preference.
const TIMEFRAME_OFFSETS = {
  "1_week": 7,
  "2_weeks": 14,
  "1_month": 30,
  "2_months": 60,
  "6_months": 180,
  "not_sure": 30, // e.g., default to 30 days if user is not sure
};

export default function TOEFLOnboardingTest() {
  // State for the relative timeframe (default: "1_month")
  const [examTimeframe, setExamTimeframe] = useState("1_month");

  // State for daily study time
  const [dailyStudyTime, setDailyStudyTime] = useState(30);

  // Converts the selected timeframe into an approximate date
  const getExamDateFromTimeframe = () => {
    const offsetDays = TIMEFRAME_OFFSETS[examTimeframe] || 30;
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date;
  };

  // Handle finishing the form
  const handleFinish = () => {
    const approximateExamDate = getExamDateFromTimeframe();

    console.log("Exam Timeframe (relative):", examTimeframe);
    console.log("Calculated Exam Date:", approximateExamDate.toISOString());
    console.log("Daily Study Time:", dailyStudyTime);

    alert(
      `Timeframe chosen: ${examTimeframe}\nApprox Exam Date: ${approximateExamDate.toDateString()}\nDaily Study Time: ${dailyStudyTime} min/day`
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper
        elevation={4}
        sx={{
          borderRadius: 3,
          p: { xs: 3, sm: 5 },
          backgroundColor: "#fafafa"
        }}
      >
        {/* Page Title */}
        <Typography variant="h4" textAlign="center" fontWeight="bold" gutterBottom>
          Welcome to Your TOEFL Onboarding
        </Typography>

        <Typography variant="body1" textAlign="center" sx={{ mb: 4 }}>
          Please answer these two quick questions to help us tailor your study plan.
        </Typography>

        {/* Question 1: How soon do you plan to take the exam? */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 1, color: "text.primary" }}
          >
            Question 1
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            How soon do you plan to take your TOEFL exam?
          </Typography>

          <RadioGroup
            name="exam-timeframe"
            value={examTimeframe}
            onChange={(e) => setExamTimeframe(e.target.value)}
          >
            <FormControlLabel
              value="1_week"
              control={<Radio />}
              label="In 1 Week"
            />
            <FormControlLabel
              value="2_weeks"
              control={<Radio />}
              label="In 2 Weeks"
            />
            <FormControlLabel
              value="1_month"
              control={<Radio />}
              label="In 1 Month"
            />
            <FormControlLabel
              value="2_months"
              control={<Radio />}
              label="In 2 Months"
            />
            <FormControlLabel
              value="6_months"
              control={<Radio />}
              label="In 6 Months"
            />
            <FormControlLabel
              value="not_sure"
              control={<Radio />}
              label="Not sure yet"
            />
          </RadioGroup>
        </Box>

        <Divider sx={{ mb: 5 }} />

        {/* Question 2: Daily Study Time */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ mb: 1, color: "text.primary" }}
          >
            Question 2
          </Typography>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            How many minutes do you plan to study each day?
          </Typography>

          <Slider
            value={dailyStudyTime}
            onChange={(e, newValue) => setDailyStudyTime(newValue)}
            step={5}
            min={5}
            max={120}
            valueLabelDisplay="auto"
            aria-label="daily-study-time"
          />
          <Typography variant="body2" color="text.secondary">
            Selected: {dailyStudyTime} minutes/day
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Finish Button */}
        <Box textAlign="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleFinish}
            sx={{ borderRadius: 2 }}
          >
            Finish
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}