// File: dailyPlanUtils.js

/** Returns a Date object with hours/minutes/seconds zeroed out for "date-only" comparison */
export function dateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  
  /** Offsets a date by N days, returning a date-only result. */
  export function addDays(baseDate, daysOffset) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + daysOffset);
    return dateOnly(d);
  }
  
  /** Formats the date as e.g. "Apr 8, 2025" (no time). */
  export function formatDate(d) {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  
  /** Utility: Format N seconds => "Xm Ys" */
  export function formatSeconds(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${s}s`;
  }
  
  /** parseCreatedAt */
  export function parseCreatedAt(plan) {
    // If your plan doc has plan.createdAt as a Firestore Timestamp or ISO string:
    if (!plan?.createdAt) {
      return dateOnly(new Date()); // fallback to today's date
    }
  
    // If Firestore timestamp => { _seconds, ... } or { seconds, ... }
    if (plan.createdAt._seconds) {
      return dateOnly(new Date(plan.createdAt._seconds * 1000));
    } else if (plan.createdAt.seconds) {
      return dateOnly(new Date(plan.createdAt.seconds * 1000));
    } else {
      // else assume it's a date-string
      return dateOnly(new Date(plan.createdAt));
    }
  }
  
  /** aggregatorLockedOverlay => a simple overlay used to show 'LOCKED' state */
  import { Box, Typography } from "@mui/material";
  export function aggregatorLockedOverlay() {
    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Typography sx={{ color: "#fff", opacity: 0.8 }}>LOCKED</Typography>
      </Box>
    );
  }
  
  /** Helper: convert Firestore timestamps => milliseconds. */
  export function toMillis(ts) {
    if (!ts) return 0;
    if (ts.seconds) return ts.seconds * 1000;
    if (ts._seconds) return ts._seconds * 1000;
    return 0;
  }