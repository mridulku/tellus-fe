// File: TimeBreakdownPanel.jsx
import React, { useState } from "react";
import axios from "axios";
import { Box, Button, Typography } from "@mui/material";

export default function TimeBreakdownPanel({ activity }) {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState("");

  if (!activity || !activity.activityId) {
    return null; // no activity => show nothing
  }

  // We'll guess type => "read" if activity.type includes "read", else "quiz"
  const rawType = (activity.type || "").toLowerCase();
  const typeParam = rawType.includes("read") ? "read" : "quiz";

  // Handler => call /api/getActivityTime
  async function handleFetchBreakdown() {
    setLoading(true);
    setError("");
    setBreakdown(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
        params: {
          activityId: activity.activityId,
          type: typeParam,
        },
      });
      setBreakdown(res.data); // e.g. { totalTime, details: [ ... ] }
    } catch (err) {
      console.error("Error fetching time breakdown =>", err);
      setError(err.message || "Error fetching time breakdown.");
    } finally {
      setLoading(false);
    }
  }

  // Helper => group docs by dateStr
  function groupByDate(docs) {
    const map = {};
    docs.forEach((doc) => {
      const dayStr = doc.dateStr || "(no dateStr)";
      if (!map[dayStr]) {
        map[dayStr] = [];
      }
      map[dayStr].push(doc);
    });
    return map;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Button variant="contained" onClick={handleFetchBreakdown}>
        Show Time Breakdown by Day
      </Button>

      {loading && <Typography sx={{ mt: 1 }}>Loading time breakdown...</Typography>}
      {error && <Typography sx={{ mt: 1, color: "red" }}>Error: {error}</Typography>}

      {breakdown && (
        <Box sx={{ mt: 2, p: 1, border: "1px solid #666" }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Total Time: {breakdown.totalTime} seconds
          </Typography>

          {/* breakdown.details => array of doc-level items */}
          <DetailsTable docs={breakdown.details} />
        </Box>
      )}
    </Box>
  );
}

function DetailsTable({ docs }) {
  if (!docs || !docs.length) {
    return <Typography>No doc-level details found.</Typography>;
  }

  // group them by dateStr
  const grouped = groupByDate(docs);

  return (
    <Box>
      {Object.keys(grouped).map((day) => {
        const arr = grouped[day];
        let dayTotal = 0;
        arr.forEach((doc) => (dayTotal += doc.totalSeconds || 0));

        return (
          <Box key={day} sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {`${day} => ${dayTotal} seconds total`}
            </Typography>
            {arr.map((doc, idx) => (
              <Box
                key={idx}
                sx={{ ml: 2, mb: 1, p: 1, backgroundColor: "#333", borderRadius: "4px" }}
              >
                <Typography variant="body2">
                  <strong>collection:</strong> {doc.collection}
                </Typography>
                <Typography variant="body2">
                  <strong>docId:</strong> {doc.docId}
                </Typography>
                <Typography variant="body2">
                  <strong>totalSeconds:</strong> {doc.totalSeconds}
                </Typography>
                {/* If your doc includes attemptNumber or revisionNumber, you can show them here */}
                {/* lumps array if you want to list partial intervals */}
                <pre style={{ color: "#0f0", fontSize: "0.8rem" }}>
                  {JSON.stringify(doc.lumps || [], null, 2)}
                </pre>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

// We'll move groupByDate outside the component
function groupByDate(docs) {
  const map = {};
  docs.forEach((doc) => {
    // doc might have docData.dateStr or docData.createdAt
    // For example, the doc has "dateStr: '2025-04-06'"
    const dayStr = doc.dateStr || "(no dateStr)";
    if (!map[dayStr]) {
      map[dayStr] = [];
    }
    map[dayStr].push(doc);
  });
  return map;
}