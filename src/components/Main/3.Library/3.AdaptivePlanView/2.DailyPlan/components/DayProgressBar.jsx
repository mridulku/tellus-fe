// File: DayProgressBar.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

/** Renders a horizontal progress bar for the day's completion. */
export default function DayProgressBar({ activities }) {
  const total = activities.length;
  let doneCount = 0;
  activities.forEach((act) => {
    const cs = (act.completionStatus || "").toLowerCase();
    if (cs === "complete" || cs === "deferred") {
      doneCount++;
    }
  });

  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Box sx={{ display: "flex", alignItems: "center", ml: "auto", flex: 1 }}>
      {/* The progress bar container */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          height: 8,
          bgcolor: "#444",
          borderRadius: "4px",
          overflow: "hidden",
          mr: 1,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${progressPct}%`,
            bgcolor: "#66BB6A",
            borderRadius: "4px",
          }}
        />
      </Box>
      {/* The label => "42%" etc. */}
      <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "#fff" }}>
        {progressPct}%
      </Typography>
    </Box>
  );
}