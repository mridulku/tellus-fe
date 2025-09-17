// File: TimeBreakdownDisplay.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";

// This helper is the same grouping logic you have in the modal
function groupByDate(docs) {
  const map = {};
  docs.forEach((doc) => {
    const day = doc.dateStr || "(no date)";
    if (!map[day]) map[day] = [];
    map[day].push(doc);
  });
  return map;
}

/**
 * TimeBreakdownDisplay
 *  - Props: activity => { activityId, type, ... }
 *  - Automatically calls /api/getActivityTime
 *  - Renders a day-based breakdown outside the modal.
 */
export default function TimeBreakdownDisplay({ activity }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // e.g. { totalTime, details: [...] }

  if (!activity?.activityId) {
    return null; // No activity => nothing to show
  }
  // figure out read or quiz
  const rawType = (activity.type || "").toLowerCase();
  const typeParam = rawType.includes("read") ? "read" : "quiz";

  useEffect(() => {
    let cancel = false;
    async function doFetch() {
      try {
        setLoading(true);
        setError("");
        setData(null);

        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
          params: { activityId: activity.activityId, type: typeParam },
        });
        if (!cancel) {
          setData(res.data);
        }
      } catch (err) {
        console.error("TimeBreakdownDisplay => error:", err);
        if (!cancel) setError(err.message || "Error fetching time breakdown");
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    doFetch();
    return () => { cancel=true; };
  }, [activity.activityId, typeParam]);

  if (loading) {
    return <Typography>Loading time breakdown...</Typography>;
  }
  if (error) {
    return <Typography sx={{ color: "red" }}>Error: {error}</Typography>;
  }
  if (!data) {
    return null; // no data yet
  }

  // data => { totalTime, details:[...] }
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
        Time Breakdown (Outside Modal)
      </Typography>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Total Time: {data.totalTime} seconds
      </Typography>

      {/* 1) Group by date */}
      <DayBasedBreakdown details={data.details} />
    </Box>
  );
}

/** 
 * Renders day-based grouping, 
 *   if "read" => we only see readingSubActivity docs 
 *   if "quiz", we see quizTimeSubActivity, reviseTimeSubActivity 
 * We'll show the doc-based attempts too.
 */
function DayBasedBreakdown({ details }) {
  if (!details || !details.length) {
    return <Typography>No doc-level details found.</Typography>;
  }
  const grouped = groupByDate(details);

  return (
    <Box>
      {Object.keys(grouped).sort().map((day) => {
        const arr = grouped[day];
        let dayTotal = 0;
        arr.forEach((doc) => (dayTotal += doc.totalSeconds || 0));

        return (
          <Box key={day} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              {day} {'>'} {dayTotal} seconds
            </Typography>

            {arr.map((doc, idx) => (
              <SingleDocRow key={idx} doc={doc} />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * A small row that prints each doc's relevant fields 
 * (collection, attemptNumber, revisionNumber, lumps, etc.)
 */
function SingleDocRow({ doc }) {
  return (
    <Box sx={{ ml: 2, mb: 1, p: 1, backgroundColor: "#333", borderRadius: 1 }}>
      <Typography variant="body2">
        <strong>collection:</strong> {doc.collection}
      </Typography>
      <Typography variant="body2">
        <strong>docId:</strong> {doc.docId}
      </Typography>
      <Typography variant="body2">
        <strong>totalSeconds:</strong> {doc.totalSeconds}
      </Typography>

      {/* If quiz => attemptNumber or revisionNumber */}
      {doc.attemptNumber && (
        <Typography variant="body2">
          <strong>attemptNumber:</strong> {doc.attemptNumber}
        </Typography>
      )}
      {doc.revisionNumber && (
        <Typography variant="body2">
          <strong>revisionNumber:</strong> {doc.revisionNumber}
        </Typography>
      )}
      {doc.quizStage && (
        <Typography variant="body2">
          <strong>quizStage:</strong> {doc.quizStage}
        </Typography>
      )}

      {/* lumps if partial intervals */}
      {doc.lumps?.length > 0 && (
        <pre style={{ color: "#0f0", fontSize: "0.8rem", marginTop: "4px" }}>
          {JSON.stringify(doc.lumps, null, 2)}
        </pre>
      )}
    </Box>
  );
}