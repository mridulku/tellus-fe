/* ────────────────────────────────────────────────────────────────
   File:  src/components/3.AdaptivePlanView/1.StatsPanel/StatsPanel.jsx
   v7 – auto-resume code removed (manual Resume button only)
───────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";

/* helper – de-dupe an array */
const unique = (arr = []) => Array.from(new Set(arr));

export default function StatsPanel({
  db,
  userId,          // reserved for future use
  bookId,          // reserved for future use
  planId,
  onResume = () => {},
  colorScheme = {},
}) {
  /* ---------------- plan meta ---------------- */
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!db || !planId) return;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "adaptive_demo", planId));
        if (!snap.exists()) return;
        const plan = snap.data() || {};

        /* topics: use groupings if present, otherwise subjects */
        let topics = [];
        if (Array.isArray(plan.subjects) && plan.subjects.length) {
          const groupings = plan.subjects.flatMap((s) => s.groupings || []);
          topics = unique(
            groupings.length ? groupings : plan.subjects.map((s) => s.subject)
          );
        }

        setMeta({
          planName: plan.planName || "Untitled Plan",
          topics,
          accent: colorScheme.heading || "#BB86FC",
        });
      } catch (e) {
        console.error("StatsPanel: failed to fetch planDoc", e);
      }
    })();
  }, [db, planId, colorScheme.heading]);

  /* placeholder progress (wire up later if you track it) */
  const progress = 0;

  /* ---------------- render ------------------- */
  if (!meta) {
    return (
      <Box sx={{ color: "#888", mb: 2, mt: 1 }}>
        No plan selected.
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* header strip */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          py: 0.5,
          px: 0,
          bgcolor: "transparent",
          border: "none",
        }}
      >
        {/* plan name (ellipsis + tooltip) */}
        <Tooltip title={meta.planName}>
          <Typography
            sx={{
              fontWeight: 700,
              color: meta.accent,
              maxWidth: 260,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            noWrap
          >
            {meta.planName}
          </Typography>
        </Tooltip>

        {/* progress badge */}
        <Chip
          label={`${progress}%`}
          size="small"
          sx={{
            bgcolor: meta.accent,
            color: "#000",
            fontWeight: 700,
            height: 22,
          }}
        />

        {/* topic chips – first two */}
        {meta.topics.slice(0, 2).map((t) => (
          <Chip
            key={t}
            label={t}
            size="small"
            sx={{ bgcolor: "#333", color: "#fff", height: 22 }}
          />
        ))}
        {/* “+N more” overflow chip */}
        {meta.topics.length > 2 && (
          <Tooltip title={meta.topics.slice(2).join(", ")}>
            <Chip
              label={`+${meta.topics.length - 2} more`}
              size="small"
              sx={{
                bgcolor: "#444",
                color: "#ccc",
                height: 22,
                cursor: "default",
              }}
            />
          </Tooltip>
        )}

        {/* manual Resume button */}
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: meta.accent,
            color: "#000",
            fontWeight: 700,
            ml: "auto",
            "&:hover": { bgcolor: meta.accent },
          }}
          onClick={() => onResume(planId)}
        >
          Resume
        </Button>
      </Box>
    </Box>
  );
}