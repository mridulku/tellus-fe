// File: StatusBar.jsx
import React from "react";
import { Box, Typography, Select, MenuItem } from "@mui/material";
import DayProgressBar from "./DayProgressBar";

/**
 * getStageKey(act)
 *  - If act.type="read", return "reading"
 *  - else return (act.quizStage||"").toLowerCase() => "remember","understand","apply","analyze"
 *    If something doesn't match, you can default to "other" or skip
 */
function getStageKey(act) {
  const lowerType = (act.type || "").toLowerCase();
  if (lowerType.includes("read")) {
    return "reading";
  }
  const lowerStage = (act.quizStage || "").toLowerCase();
  if (["remember", "understand", "apply", "analyze"].includes(lowerStage)) {
    return lowerStage;
  }
  return "unknown"; // or skip
}

/**
 * StatusBar
 * ----------
 * A bar (top row) with:
 *   - Day selector (drop-down)
 *   - Progress bar
 *   - TimeSpent vs. TimeExpected (overall)
 *
 * A second row (stage details) showing each stage's timeSpent/timeExpected
 */
export default function StatusBar({
  safeIdx,
  dayLabels,
  sessions,
  activities,
  onDaySelect,
  colorScheme,
  // from parent, overall daily time spent / expected
  totalTimeSpent = 0,
  totalTimeExpected = 30,

  // new prop: we need timeMap to compute actual seconds for each activity
  // e.g. timeMap[activityId] => # of seconds
  timeMap = {},
}) {
  // -------------------------------
  // A) The top row: day selection, progress bar, overall time stats
  // -------------------------------
  const TopRow = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        backgroundColor: "#2F2F2F",
        padding: 1,
        borderRadius: 1,
      }}
    >
      {/* 1) Day selection */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontSize: "0.85rem", color: colorScheme?.textColor || "#FFD700" }}
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
            color: colorScheme?.textColor || "#FFD700",
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

      {/* 2) Progress bar => fill the middle space */}
      <Box sx={{ flex: 1 }}>
        <DayProgressBar activities={activities} />
      </Box>

      {/* 3) Additional stats => total time spent vs. expected */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#fff" }}>
          Time Spent:
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "0.85rem", color: "#FFD700" }}>
          {totalTimeSpent}m / {totalTimeExpected}m
        </Typography>
      </Box>
    </Box>
  );

  // -------------------------------
  // B) The second row: per-stage details
  // -------------------------------
  //  1) Aggregate the times by stage => reading, remember, understand, apply, analyze
  const stageAggregator = {};

  activities.forEach((act) => {
    const stage = getStageKey(act);
    if (stage === "unknown") return; // skip

    // actual time => from timeMap[activityId], in seconds
    const actualSec = timeMap[act.activityId] || 0;
    const actualMin = actualSec / 60;

    // expected time => act.timeNeeded (already in minutes, or 0 if undefined)
    const expectedMin = act.timeNeeded || 0;

    if (!stageAggregator[stage]) {
      stageAggregator[stage] = {
        spentMin: 0,
        expectedMin: 0,
      };
    }
    stageAggregator[stage].spentMin += actualMin;
    stageAggregator[stage].expectedMin += expectedMin;
  });

  //  2) Convert to an array for rendering. Skip stages with no activities.
  // Sort them in a logical order if you like
  const stageOrder = ["reading", "remember", "understand", "apply", "analyze"];

  const stageRows = stageOrder
    .filter((st) => stageAggregator[st])
    .map((st) => {
      // Round the times, or show 1 decimal, etc.
      const spent = Math.round(stageAggregator[st].spentMin);
      const exp = Math.round(stageAggregator[st].expectedMin);
      // e.g. "Reading", "Remember", etc.
      const label = st.charAt(0).toUpperCase() + st.slice(1);
      return (
        <Box
          key={st}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            backgroundColor: "#333",
            borderRadius: 1,
            px: 1,
            py: 0.5,
            marginRight: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: "#FFD700", fontWeight: 600 }}>
            {label}:
          </Typography>
          <Typography variant="body2" sx={{ color: "#fff" }}>
            {spent}m / {exp}m
          </Typography>
        </Box>
      );
    });

  const StageRow = (
    <Box sx={{ display: "flex", mt: 1 }}>
      {stageRows}
    </Box>
  );

  return (
    <Box>
      {/* Top row => day selection, progress bar, overall stats */}
      {TopRow}

      {/* Second row => per-stage details (only if there's at least one stage) */}
      {stageRows.length > 0 && StageRow}
    </Box>
  );
}