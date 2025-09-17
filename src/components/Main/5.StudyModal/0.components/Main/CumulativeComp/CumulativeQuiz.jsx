/***********************************************************************
 * CumulativeQuiz.jsx
 * --------------------------------------------------------------------
 *  • Displays a quick dashboard for “cumulative quiz” day:
 *      – how many sub-chapters have reached each completion tier
 *        (Not Read ▸ Read ✓ ▸ Remember ✓ ▸ Understand ✓ ▸ Apply ✓ ▸ Analyse ✓)
 *  • Uses ONLY planSummarySlice (bulk loader) – zero per-row network hits
 **********************************************************************/
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAllSubSummaries,
} from "../../../../../../store/planSummarySlice";   // ← path may differ

import {
  Box,
  Typography,
  CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
  Paper
} from "@mui/material";

/* ─────────── helpers ─────────── */

/**
 * Decide the *highest* fully-completed tier for a summary doc.
 * Returns one of:
 *   'analyse' | 'apply' | 'understand' | 'remember' | 'read' | 'notRead'
 */
function highestCompletedTier(s = {}) {
  if ((s.analyzePct     ?? 0) >= 100) return "analyse";
  if ((s.applyPct       ?? 0) >= 100) return "apply";
  if ((s.understandPct  ?? 0) >= 100) return "understand";
  if ((s.rememberPct    ?? 0) >= 100) return "remember";
  if ((s.readingPct     ?? 0) >= 100) return "read";
  return "notRead";
}

/* Bucket display meta */
const BUCKETS = [
  { key: "analyse"  , label: "Analyse ✓"   , color: "#F48FB1" },
  { key: "apply"    , label: "Apply ✓"     , color: "#AED581" },
  { key: "understand",label: "Understand ✓", color: "#FFD54F" },
  { key: "remember" , label: "Remember ✓"  , color: "#80DEEA" },
  { key: "read"     , label: "Read ✓"      , color: "#BB86FC" },
  { key: "notRead"  , label: "Not read"    , color: "#E53935" },
];

/* ─────────── component ─────────── */
export default function CumulativeQuiz() {
  const dispatch   = useDispatch();
  const planId     = useSelector((s) => s.plan.planDoc?.id);
  const {
    entities,
    allLoaded,
    allLoading,
    allError,
  } = useSelector((s) => s.planSummary);

  /* kick off bulk load once per mount */
  useEffect(() => {
    if (!planId) return;
    if (!allLoaded && !allLoading && !allError) {
      dispatch(fetchAllSubSummaries({ planId }));
    }
  }, [planId, allLoaded, allLoading, allError, dispatch]);

  /* build counts once data is ready */
  const counts = useMemo(() => {
    if (!allLoaded) return {};           // empty during loading
    const c = {
      analyse: 0, apply: 0, understand: 0,
      remember: 0, read: 0, notRead: 0,
    };
    Object.values(entities).forEach((sum) => {
      const tier = highestCompletedTier(sum);
      c[tier] = (c[tier] || 0) + 1;
    });
    return c;
  }, [allLoaded, entities]);

  /* ---------- render ---------- */
  if (allLoading || !allLoaded) {
    return (
      <Box sx={sx.outer}>
        <Box sx={sx.center}>
          <CircularProgress size={32} sx={{ mr: 1 }} />
          <Typography>Gathering progress data…</Typography>
        </Box>
      </Box>
    );
  }

  if (allError) {
    return (
      <Box sx={sx.outer}>
        <Typography color="error">
          Error loading summaries: {allError}
        </Typography>
      </Box>
    );
  }

  /* success */
  return (
    <Box sx={sx.outer}>
      <Typography variant="h5" gutterBottom>
        Cumulative Quiz – Overview
      </Typography>

      <Paper elevation={3} sx={sx.tableWrapper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {BUCKETS.map((b) => (
                <TableCell
                  key={b.key}
                  align="center"
                  sx={{ fontWeight: 700, color: b.color }}
                >
                  {b.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {BUCKETS.map((b) => (
                <TableCell
                  key={b.key}
                  align="center"
                  sx={{ fontSize: 18, fontWeight: 700, color: b.color }}
                >
                  {counts[b.key] ?? 0}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Paper>

      <Typography sx={{ mt: 2, fontSize: 13, color: "#bbb" }}>
        Total sub-chapters counted:{" "}
        {Object.values(counts).reduce((a, v) => a + v, 0)}
      </Typography>
    </Box>
  );
}

/* ─────────── styles ─────────── */
const sx = {
  outer: {
    p: 3,
    color: "#fff",
    minHeight: "100%",
    boxSizing: "border-box",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    color: "#fff",
  },
  tableWrapper: {
    bgcolor: "#111",
    "& thead th": { bgcolor: "#222" },
  },
};