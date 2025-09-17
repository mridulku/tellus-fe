import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel,
  Slider,
} from "@mui/material";

import InfoIcon from "@mui/icons-material/Info";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SchoolIcon from "@mui/icons-material/School";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";

/**
 * MinimalSlidersUI
 * ----------------
 * A UI that:
 *   1) Lets user pick "time to complete" (in weeks) via a slider.
 *   2) Daily study time (minutes) via another slider.
 *   3) Current knowledge: short radio.
 *   4) Desired depth: short radio.
 *
 * Card-based on a gradient black background.
 */
export default function zDummyAdaptiveForm() {
  // 1) Time to Complete (in weeks)
  const [weeksValue, setWeeksValue] = useState(4); // default 4 weeks
  // slider marks for 1..12 weeks, for example
  const timeMarks = [
    { value: 1, label: "1w" },
    { value: 2, label: "2w" },
    { value: 4, label: "4w" },
    { value: 8, label: "8w" },
    { value: 12, label: "12w" },
  ];

  // 2) Daily Study Time (in minutes)
  const [studyTime, setStudyTime] = useState(60); // default 60 min
  const studyMarks = [
    { value: 15, label: "15m" },
    { value: 30, label: "30m" },
    { value: 60, label: "1h" },
    { value: 90, label: "1.5h" },
    { value: 120, label: "2h" },
  ];

  // 3) Current Knowledge
  const [knowledge, setKnowledge] = useState("none"); // "none" / "some" / "strong"

  // 4) Desired Depth
  const [depth, setDepth] = useState("basic"); // "basic" / "moderate" / "advanced" / "thorough"

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 3,
        background: "linear-gradient(135deg, #121212 0%, #1c1c1c 100%)",
      }}
    >
      <Typography variant="h5" sx={{ color: "#fff", mb: 3, fontWeight: "bold" }}>
        Plan Setup (Sliders + Short Options)
      </Typography>

      <Grid container spacing={3}>
        {/* A) Time to Complete */}
        <Grid item xs={12}>
          <Card
            sx={{
              backgroundColor: "#1e1e1e",
              borderRadius: 2,
              border: "1px solid #333",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  <CalendarMonthIcon
                    sx={{
                      fontSize: "1rem",
                      verticalAlign: "middle",
                      color: "#B39DDB",
                    }}
                  />{" "}
                  Time to Complete
                </Typography>
                <Tooltip title="How many weeks until you want to finish?">
                  <IconButton size="small" sx={{ color: "#B39DDB" }}>
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="caption" sx={{ color: "#fff" }}>
                {weeksValue} week(s)
              </Typography>
              <Slider
                value={weeksValue}
                onChange={(e, val) => setWeeksValue(val)}
                step={1}
                min={1}
                max={12}
                marks={timeMarks}
                sx={{ color: "#B39DDB" }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* B) Daily Study Time */}
        <Grid item xs={12}>
          <Card
            sx={{
              backgroundColor: "#1e1e1e",
              borderRadius: 2,
              border: "1px solid #333",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  <AccessTimeIcon
                    sx={{
                      fontSize: "1rem",
                      verticalAlign: "middle",
                      color: "#B39DDB",
                    }}
                  />{" "}
                  Daily Study Time
                </Typography>
                <Tooltip title="How many minutes per day do you want to invest?">
                  <IconButton size="small" sx={{ color: "#B39DDB" }}>
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Typography variant="caption" sx={{ color: "#fff" }}>
                {studyTime} min/day
              </Typography>
              <Slider
                value={studyTime}
                onChange={(e, val) => setStudyTime(val)}
                step={15}
                min={15}
                max={120}
                marks={studyMarks}
                sx={{ color: "#B39DDB" }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* C) Current Knowledge */}
        <Grid item xs={12}>
          <Card
            sx={{
              backgroundColor: "#1e1e1e",
              borderRadius: 2,
              border: "1px solid #333",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  <SchoolIcon
                    sx={{
                      fontSize: "1rem",
                      verticalAlign: "middle",
                      color: "#B39DDB",
                    }}
                  />{" "}
                  Current Knowledge
                </Typography>
                <Tooltip title="Pick the closest option.">
                  <IconButton size="small" sx={{ color: "#B39DDB" }}>
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>

              <FormControl>
                <FormLabel sx={{ color: "#fff" }}>How familiar are you?</FormLabel>
                <RadioGroup
                  value={knowledge}
                  onChange={(e) => setKnowledge(e.target.value)}
                >
                  <FormControlLabel
                    value="none"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>New to Topic</strong> - never studied or minimal exposure
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                  <FormControlLabel
                    value="some"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>Some Familiarity</strong> - know basics but missing many details
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                  <FormControlLabel
                    value="strong"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>Quite Experienced</strong> - studied most concepts, fairly confident
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* D) Desired Depth */}
        <Grid item xs={12}>
          <Card
            sx={{
              backgroundColor: "#1e1e1e",
              borderRadius: 2,
              border: "1px solid #333",
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#fff" }}
                >
                  <AutoGraphIcon
                    sx={{
                      fontSize: "1rem",
                      verticalAlign: "middle",
                      color: "#B39DDB",
                    }}
                  />{" "}
                  Desired Depth
                </Typography>
                <Tooltip title="Choose how deeply you want to learn.">
                  <IconButton size="small" sx={{ color: "#B39DDB" }}>
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl>
                <FormLabel sx={{ color: "#fff" }}>Pick one:</FormLabel>
                <RadioGroup
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                >
                  <FormControlLabel
                    value="basic"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>Basic Overviews</strong> - minimal detail, just key facts
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                  <FormControlLabel
                    value="moderate"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>Moderate Concepts</strong> - comfortable with typical examples
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                  <FormControlLabel
                    value="advanced"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>Advanced Tasks</strong> - deeper problem-solving, scenario-based
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                  <FormControlLabel
                    value="thorough"
                    control={
                      <Radio
                        sx={{
                          color: "#B39DDB",
                          "&.Mui-checked": { color: "#B39DDB" },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ color: "#fff" }}>
                        <strong>Thorough Mastery</strong> - full coverage, complex analysis
                      </Box>
                    }
                    sx={{ alignItems: "start" }}
                  />
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary (demo) */}
        <Grid item xs={12}>
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "#2c2c2c",
              borderRadius: 2,
              border: "1px solid #444",
            }}
          >
            <Typography variant="body2" sx={{ color: "#fff", mb: 1 }}>
              <strong>Current Selections (demo):</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: "#fff" }} display="block">
              Time to Complete: {weeksValue} week(s)
            </Typography>
            <Typography variant="caption" sx={{ color: "#fff" }} display="block">
              Daily Study Time: {studyTime} min/day
            </Typography>
            <Typography variant="caption" sx={{ color: "#fff" }} display="block">
              Knowledge: {knowledge}
            </Typography>
            <Typography variant="caption" sx={{ color: "#fff" }} display="block">
              Depth: {depth}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}