// File: TimeBreakdownModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";

// Helper: group docs by dateStr
function groupByDate(docs) {
  const map = {};
  (docs || []).forEach((doc) => {
    const day = doc.dateStr || "(no dateStr)";
    if (!map[day]) map[day] = [];
    map[day].push(doc);
  });
  return map;
}

export default function TimeBreakdownModal({ open, onClose, activity }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null); // e.g. { totalTime, details: [...] }

  // figure out type => "read" or "quiz"
  if (!activity) return null;
  const rawType = (activity.type || "").toLowerCase();
  const typeParam = rawType.includes("read") ? "read" : "quiz";

  useEffect(() => {
    if (!open) return;
    if (!activity?.activityId) return;

    let cancel = false;
    async function doFetch() {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
          params: { activityId: activity.activityId, type: typeParam },
        });
        if (!cancel) {
          setData(res.data);
        }
      } catch (err) {
        console.error("TimeBreakdownModal => error:", err);
        if (!cancel) {
          setError(err.message || "Error fetching time breakdown");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    doFetch();

    return () => {
      cancel = true;
    };
  }, [open, activity?.activityId, typeParam]);

  function handleClose() {
    setData(null);
    setError("");
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Day-by-Day Time Breakdown</DialogTitle>
      <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
        {loading && <Typography>Loading breakdown...</Typography>}
        {error && <Typography sx={{ color: "red" }}>{error}</Typography>}
        {data && !loading && !error && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Total Time: {data.totalTime} seconds
            </Typography>
            <DayDetails docs={data.details} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "#222" }}>
        <Button onClick={handleClose} variant="contained" color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DayDetails({ docs }) {
  if (!docs?.length) {
    return <Typography variant="body2">No details found.</Typography>;
  }

  // group by day => "2025-04-08", etc.
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
              {day} {'=>'} {dayTotal} seconds
            </Typography>

            {/* For each doc => show details including attemptNumber, quizStage, lumps, etc. */}
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

                {/* If it's reading => no attemptNumber/revisionNumber, etc. */}
                {doc.attemptNumber !== null && (
                  <Typography variant="body2">
                    <strong>attemptNumber:</strong> {doc.attemptNumber}
                  </Typography>
                )}
                {doc.revisionNumber !== null && (
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
                  <pre style={{ color: "#0f0", fontSize: "0.8rem", marginTop: 4 }}>
                    {JSON.stringify(doc.lumps, null, 2)}
                  </pre>
                )}
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}