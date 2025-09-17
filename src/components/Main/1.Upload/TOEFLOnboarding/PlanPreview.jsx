// src/components/DetailedBookViewer/PlanPreviewDays.jsx

import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * PlanPreviewDays
 *
 * Renders a series of "Day X" sections with tasks (e.g. "Chapter 1", "Reading").
 * No extra buttons, summaries, or top markers. Black/dark-themed styling.
 */
export default function PlanPreviewDays() {
  // In a real scenario, you'd likely pass an array of days+tasks from props,
  // e.g. `daysData` or `planData`. For now, here's some placeholder content.
  const daysData = [
    {
      day: "Day 1",
      tasks: ["Chapter 1: Reading", "Quick Recap", "Practice Quiz"],
    },
    {
      day: "Day 2",
      tasks: ["Chapter 2: Listening", "Audio Exercises", "Summary Notes"],
    },
    {
      day: "Day 3",
      tasks: ["Chapter 3: Speaking", "Record Yourself", "Review Feedback"],
    },
    {
      day: "Day 4",
      tasks: ["Chapter 4: Writing", "Draft Essay", "Check Grammar"],
    },
    {
      day: "Day 5",
      tasks: ["Chapter 5: Reading (Advanced)", "Timed Practice", "Review Mistakes"],
    },
    {
      day: "Day 6",
      tasks: ["Chapter 6: Listening (Advanced)", "Audio + Quiz", "Summary Writing"],
    },
  ];

  return (
    <Box
      sx={{
        // Full width container, dark background
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        borderRadius: 2,
        p: 2,
        maxHeight: "70vh",
        overflowY: "auto", // scroll if content is large
        color: "#fff",
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 2, textAlign: "center", fontWeight: "bold" }}
      >
        Your Day-by-Day Plan
      </Typography>

      {daysData.map((dayObj, index) => (
        <Box
          key={index}
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {dayObj.day}
          </Typography>
          <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
            {dayObj.tasks.map((task, idx) => (
              <li key={idx} style={{ marginBottom: "0.5rem" }}>
                <Typography variant="body1" sx={{ color: "#fff" }}>
                  {task}
                </Typography>
              </li>
            ))}
          </ul>
        </Box>
      ))}
    </Box>
  );
}