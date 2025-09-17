import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Utility: check if val is a Firestore-like timestamp => {seconds, nanoseconds} or {_seconds}
 * If so, return a readable string. Otherwise return null.
 */
function tryFormatTimestamp(val) {
  if (!val) return null;
  if (typeof val === "object") {
    const maybeSec = val.seconds ?? val._seconds;
    if (typeof maybeSec === "number") {
      return new Date(maybeSec * 1000).toLocaleString();
    }
  }
  return null;
}

/**
 * A recursive component that renders a single field in a <details> block if it's an
 * array/object, or a <p> if it's primitive. We skip "sessions" if `excludeSessions` is true.
 */
function CollapsibleField({ fieldKey, value, excludeSessions, depth = 0 }) {
  // 1) If the key is "sessions" and excludeSessions is true, skip it
  if (excludeSessions && fieldKey === "sessions") {
    return null;
  }

  // 2) Check if Firestore timestamp
  const asTimestamp = tryFormatTimestamp(value);
  if (asTimestamp) {
    // It's just a date => show a simple line
    return (
      <div style={{ marginLeft: depth * 16 }}>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          <strong>{fieldKey}:</strong> {asTimestamp}
        </Typography>
      </div>
    );
  }

  // 3) If array => render each item in a nested <CollapsibleField> (wrapped in <details>)
  if (Array.isArray(value)) {
    return (
      <details style={{ marginLeft: depth * 16 }}>
        <summary>
          <Typography variant="body2" sx={{ display: "inline-block" }}>
            <strong>{fieldKey}:</strong> [Array of length {value.length}]
          </Typography>
        </summary>
        <Box sx={{ ml: 2, mt: 1 }}>
          {value.map((item, idx) => (
            <CollapsibleField
              key={idx}
              fieldKey={String(idx)}
              value={item}
              excludeSessions={excludeSessions}
              depth={depth + 1}
            />
          ))}
        </Box>
      </details>
    );
  }

  // 4) If object => recursively show each sub-field in a <details>.
  //    (But if it's empty, just show "{}".)
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      // an empty object
      return (
        <div style={{ marginLeft: depth * 16 }}>
          <Typography variant="body2">
            <strong>{fieldKey}:</strong> {`{ } (empty object)`}
          </Typography>
        </div>
      );
    }

    return (
      <details style={{ marginLeft: depth * 16 }}>
        <summary>
          <Typography variant="body2" sx={{ display: "inline-block" }}>
            <strong>{fieldKey}:</strong> {"{ } (object)"}
          </Typography>
        </summary>
        <Box sx={{ ml: 2, mt: 1 }}>
          {keys.map((k) => (
            <CollapsibleField
              key={k}
              fieldKey={k}
              value={value[k]}
              excludeSessions={excludeSessions}
              depth={depth + 1}
            />
          ))}
        </Box>
      </details>
    );
  }

  // 5) Otherwise, it's a primitive => show a single line
  return (
    <div style={{ marginLeft: depth * 16 }}>
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        <strong>{fieldKey}:</strong> {String(value)}
      </Typography>
    </div>
  );
}

/**
 * PlanOverview
 * ------------
 * Shows the entire plan doc in a collapsible manner. By default, we skip "sessions."
 * Also shows planId explicitly at the top.
 */
export default function PlanOverview({ planId, plan }) {
  if (!plan) {
    return <div>No plan doc provided.</div>;
  }

  // We gather all top-level fields from plan
  const topKeys = Object.keys(plan);

  return (
    <Box
      sx={{
        border: "1px solid #666",
        borderRadius: 1,
        p: 2,
        mb: 2,
        backgroundColor: "#333",
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, color: "#fff" }}>
        Plan Overview
      </Typography>

      {/* Show planId at top, as requested */}
      <Typography variant="body2" sx={{ mb: 2, color: "#fff" }}>
        <strong>planId:</strong> {String(planId)}
      </Typography>

      {topKeys.map((key) => (
        <CollapsibleField
          key={key}
          fieldKey={key}
          value={plan[key]}
          excludeSessions={true}   // <--- set to false if you want to see sessions here
          depth={0}
        />
      ))}
    </Box>
  );
}