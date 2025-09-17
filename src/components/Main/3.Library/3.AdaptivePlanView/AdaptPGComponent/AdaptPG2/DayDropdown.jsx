// File: DayDropdown.jsx
import React from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";

export default function DayDropdown({ safeDayIdx, sessions, dayLabels, onDaySelect }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
      <Typography variant="body2">Select Day:</Typography>
      <Select
        value={safeDayIdx}
        onChange={(e) => onDaySelect(Number(e.target.value))}
        sx={{
          minWidth: 200,
          backgroundColor: "#2F2F2F",
          color: "#FFD700",
          fontSize: "0.85rem",
          height: 32,
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
    </Box>
  );
}