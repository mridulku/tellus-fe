// src/components/HIDDIT/PlanSelection.jsx

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Tooltip,
  IconButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";

import InfoIcon from "@mui/icons-material/Info";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

export default function PlanSelection({
  targetDate,
  setTargetDate,
  dailyReadingTime,
  setDailyReadingTime,
  masteryLevel,
  setMasteryLevel,
}) {
  return (
    <Grid container spacing={3}>
      {/* Target Date */}
      <Grid item xs={12} sm={6}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#fff" }}
          >
            <CalendarMonthIcon
              sx={{ fontSize: "1rem", verticalAlign: "middle", color: "#B39DDB" }}
            />{" "}
            Target Date
          </Typography>
          <Tooltip title="We use this to see if you can finish in time.">
            <IconButton size="small" sx={{ color: "#B39DDB" }}>
              <InfoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          type="date"
          fullWidth
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              backgroundColor: "#333",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#B39DDB",
            },
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#D1C4E9",
            },
          }}
          InputLabelProps={{
            style: { color: "#fff" },
          }}
        />
      </Grid>

      {/* Daily Reading */}
      <Grid item xs={12} sm={6}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#fff" }}
          >
            <AccessTimeIcon
              sx={{ fontSize: "1rem", verticalAlign: "middle", color: "#B39DDB" }}
            />{" "}
            Daily Reading (min)
          </Typography>
          <Tooltip title="Minutes per day you can dedicate">
            <IconButton size="small" sx={{ color: "#B39DDB" }}>
              <InfoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          type="number"
          fullWidth
          value={dailyReadingTime}
          onChange={(e) => setDailyReadingTime(Number(e.target.value))}
          variant="outlined"
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "#fff",
              backgroundColor: "#333",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#B39DDB",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#D1C4E9",
            },
          }}
        />
      </Grid>

      {/* Mastery Level */}
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", color: "#fff" }}
          >
            <AssignmentTurnedInIcon
              sx={{ fontSize: "1rem", verticalAlign: "middle", color: "#B39DDB" }}
            />{" "}
            Mastery Level
          </Typography>
          <Tooltip
            title={
              <Box sx={{ color: "#fff" }}>
                <strong>Mastery:</strong> Deep understanding <br />
                <strong>Revision:</strong> Quick review <br />
                <strong>Glance:</strong> Minimal detail
              </Box>
            }
          >
            <IconButton size="small" sx={{ color: "#B39DDB" }}>
              <InfoIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
        <FormControl sx={{ mt: 1 }}>
          <FormLabel sx={{ color: "#fff" }}>Choose Level</FormLabel>
          <RadioGroup
            row
            value={masteryLevel}
            onChange={(e) => setMasteryLevel(e.target.value)}
          >
            {["mastery", "revision", "glance"].map((val) => (
              <FormControlLabel
                key={val}
                value={val}
                control={
                  <Radio
                    sx={{
                      color: "#B39DDB",
                      "&.Mui-checked": { color: "#B39DDB" },
                    }}
                  />
                }
                label={val.charAt(0).toUpperCase() + val.slice(1)}
                sx={{ color: "#fff" }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Grid>
    </Grid>
  );
}