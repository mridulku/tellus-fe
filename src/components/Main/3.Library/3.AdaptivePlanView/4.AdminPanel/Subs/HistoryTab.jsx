// src/components/DetailedBookViewer/HistoryTab.jsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Stack,
} from "@mui/material";

// Sample historical data (in a real scenario, you'd fetch from API)
const sampleHistoryData = [
  {
    chapter: "Chapter 1: Introduction",
    subchapter: "1.1 Overview",
    activityType: "READ",
    completedAt: "2023-10-09T09:30:00Z",
  },
  {
    chapter: "Chapter 1: Introduction",
    subchapter: "1.2 Key Concepts",
    activityType: "QUIZ",
    completedAt: "2023-10-09T10:15:00Z",
  },
  {
    chapter: "Chapter 2: Advanced Topics",
    subchapter: "2.1 Deep Dive",
    activityType: "READ",
    completedAt: "2023-10-10T08:20:00Z",
  },
  {
    chapter: "Chapter 2: Advanced Topics",
    subchapter: "2.1 Deep Dive",
    activityType: "REVISE",
    completedAt: "2023-10-10T09:00:00Z",
  },
  {
    chapter: "Chapter 1: Introduction",
    subchapter: "1.2 Key Concepts",
    activityType: "REVISE",
    completedAt: "2023-10-10T09:45:00Z",
  },
  {
    chapter: "Chapter 3: Summary",
    subchapter: "3.1 Wrap-Up",
    activityType: "QUIZ",
    completedAt: "2023-10-10T10:00:00Z",
  },
];

// Utility to format dates/times
function formatDateTime(isoString) {
  const dateObj = new Date(isoString);
  const dateStr = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${dateStr} • ${timeStr}`;
}

export default function HistoryTab() {
  // Switch between "timeline" or "chapter"
  const [viewMode, setViewMode] = useState("timeline");

  const handleViewChange = (event, newMode) => {
    if (newMode) setViewMode(newMode);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#222", // dark background
        color: "#EEE",           // lighter text
        p: 2,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        Historical Log
      </Typography>

      {/* Toggle between Timeline or Chapter */}
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewChange}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="timeline" sx={toggleBtnStyle}>
          Timeline
        </ToggleButton>
        <ToggleButton value="chapter" sx={toggleBtnStyle}>
          By Chapter
        </ToggleButton>
      </ToggleButtonGroup>

      {viewMode === "timeline"
        ? <TimelineView data={sampleHistoryData} />
        : <ChapterView data={sampleHistoryData} />}
    </Box>
  );
}

// Minimal style for toggle buttons
const toggleBtnStyle = {
  color: "#EEE",
  borderColor: "#BB86FC",
  textTransform: "none",
  "&.Mui-selected": {
    backgroundColor: "#BB86FC",
    color: "#000",
  },
};

// ----------------------------
// TIMELINE VIEW
// ----------------------------
function TimelineView({ data }) {
  // Sort descending by completedAt
  const sorted = [...data].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  );

  return (
    <Stack spacing={2}>
      {sorted.map((item, i) => {
        const isLast = i === sorted.length - 1;
        return (
          <TimelineItem
            key={i}
            item={item}
            showLine={!isLast}
          />
        );
      })}
    </Stack>
  );
}

function TimelineItem({ item, showLine }) {
  const { chapter, subchapter, activityType, completedAt } = item;

  // Decide an emoji for activity
  let emoji = "📖"; // reading
  if (activityType === "QUIZ") emoji = "📝";
  if (activityType === "REVISE") emoji = "🔄";

  // Format the date/time
  const dateString = formatDateTime(completedAt);

  return (
    <Box sx={{ position: "relative", pl: 4 }}>
      {/* The timeline vertical line */}
      {showLine && (
        <Box
          sx={{
            position: "absolute",
            top: "24px",
            left: "15px",
            bottom: 0,
            width: "2px",
            backgroundColor: "#BB86FC",
            opacity: 0.4,
          }}
        />
      )}

      {/* The bullet or marker */}
      <Box
        sx={{
          position: "absolute",
          top: "8px",
          left: "8px",
          backgroundColor: "#BB86FC",
          color: "#000",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* We can display a small dot or the first letter of the type. Let's do a small dot. */}
        <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#000" }} />
      </Box>

      {/* Content */}
      <Box sx={{ ml: 2 }}>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {dateString}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          {emoji} {activityType === "READ" ? "Read" : activityType === "QUIZ" ? "Quiz" : "Revise"}
        </Typography>
        <Typography variant="body2">
          <strong>{chapter}</strong> → {subchapter}
        </Typography>
      </Box>
    </Box>
  );
}

// ----------------------------
// CHAPTER VIEW
// ----------------------------
function ChapterView({ data }) {
  // Group by chapter -> subchapter
  const chapterMap = new Map();
  data.forEach((item) => {
    if (!chapterMap.has(item.chapter)) {
      chapterMap.set(item.chapter, new Map());
    }
    const subMap = chapterMap.get(item.chapter);
    if (!subMap.has(item.subchapter)) {
      subMap.set(item.subchapter, []);
    }
    subMap.get(item.subchapter).push(item);
  });

  return (
    <Box>
      {[...chapterMap.entries()].map(([chapter, subMap]) => (
        <Box key={chapter} sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {chapter}
          </Typography>

          {[...subMap.entries()].map(([subchapter, items]) => (
            <Box key={subchapter} sx={{ ml: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 0.5 }}>
                {subchapter}
              </Typography>
              <Divider sx={{ mb: 1, borderColor: "#444" }} />

              {items.map((activity, idx) => (
                <ChapterActivityRow key={idx} activity={activity} />
              ))}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function ChapterActivityRow({ activity }) {
  let emoji = "📖";
  if (activity.activityType === "QUIZ") emoji = "📝";
  if (activity.activityType === "REVISE") emoji = "🔄";

  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
      <Typography variant="body2">
        <span style={{ marginRight: 4 }}>{emoji}</span>
        {activity.activityType === "READ"
          ? "Read"
          : activity.activityType === "QUIZ"
          ? "Quiz"
          : "Revise"}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        · {formatDateTime(activity.completedAt)}
      </Typography>
    </Box>
  );
}