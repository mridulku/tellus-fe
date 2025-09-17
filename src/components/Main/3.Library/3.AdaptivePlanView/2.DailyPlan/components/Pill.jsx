// File: Pill.jsx
import React from "react";
import { Box } from "@mui/material";

export default function Pill({
  text,
  bgColor = "#424242",
  textColor = "#fff",
  sx = {},
  onClick,
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-block",
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        bgcolor: bgColor,
        color: textColor,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        pointerEvents: "auto",
        ...sx,
      }}
    >
      {text}
    </Box>
  );
}