// File: DayDropdownBar.jsx
import React from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import DayProgressBar from "./DayProgressBar";

/**
 * DayDropdownBar
 * --------------
 * Renders a row with a "Day" label, a day <Select>, and a progress bar that shows the day's completion%.
 */
export default function DayDropdownBar({
  safeIdx,
  dayLabels,
  sessions,
  activities,
  onDaySelect,
  colorScheme,
}) {
  return (
    <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        variant="body2"
        sx={{ fontSize: "0.85rem", color: colorScheme.textColor || "#FFD700" }}
      >
        Day:
      </Typography>

      <Select
        value={safeIdx}
        onChange={(e) => onDaySelect(Number(e.target.value))}
        sx={{
          minWidth: 180,
          fontSize: "0.8rem",
          height: 32,
          backgroundColor: "#2F2F2F",
          color: colorScheme.textColor || "#FFD700",
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: "#2F2F2F",
              color: "#fff",
            },
          },
        }}
      >
        {sessions.map((sess, idx) => (
          <MenuItem key={sess.sessionLabel} value={idx}>
            {dayLabels[idx]}
          </MenuItem>
        ))}
      </Select>

      {/* The progress bar that fills the remaining space */}
      <DayProgressBar activities={activities} />
    </Box>
  );
}