// shared/DayProgressCircle.jsx   ⟵ place next to TaskCard / useTaskModel
import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

/** 28-px circular dial that shows an integer percentage */
export default function DayProgressCircle({ pct = 0 }) {
  return (
    <Box sx={{ position: "relative", width: 28, height: 28 }}>
      <CircularProgress
        variant="determinate"
        value={pct}
        size={28}
        thickness={4}
        sx={{ color: "#66BB6A", bgcolor: "#333", borderRadius: "50%" }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: "0.55rem", color: "#fff", fontWeight: 600 }}
        >
          {pct}%
        </Typography>
      </Box>
    </Box>
  );
}