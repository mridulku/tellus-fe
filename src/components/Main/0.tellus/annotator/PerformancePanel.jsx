// src/components/Annotator/PerformancePanel.jsx
import React, { useMemo } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  LinearProgress, Divider, Button
} from "@mui/material";

/**
 * Minimal, vertical performance panel for annotators
 * Inputs:
 *  - projects: [{ id, name, payPerTaskCents, todayTarget, tasks: [{ id, isGold?: boolean }] }]
 *  - annotations: { [taskId]: { status: "done"|"flagged"|"skipped"|"returned", timestamp: number, payload?: { goldCorrect?: boolean } } }
 *
 * Shows (top-to-bottom):
 *  1) Today: Earned, Potential if you finish today’s target, Progress bar
 *  2) Quality snapshot: simple status + tiny details (no jargon)
 *  3) Streaks & badges (compact)
 *  4) Tips / training actions (only when needed)
 */

function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function isToday(ts) { return dayKey(ts) === dayKey(Date.now()); }

export default function PerformancePanel({ projects = [], annotations = {} }) {
  /** Map: taskId -> project */
  const taskToProject = useMemo(() => {
    const m = new Map();
    projects.forEach(p => (p.tasks||[]).forEach(t => m.set(t.id, p)));
    return m;
  }, [projects]);

  /** Precompute per-project completed today */
  const doneTodayByProjectId = useMemo(() => {
    const counts = new Map();
    for (const [taskId, a] of Object.entries(annotations)) {
      if (a?.status === "done" && a?.timestamp && isToday(a.timestamp)) {
        const proj = taskToProject.get(taskId);
        if (proj) counts.set(proj.id, (counts.get(proj.id) || 0) + 1);
      }
    }
    return counts;
  }, [annotations, taskToProject]);

  /** Earnings & today progress */
  const {
    completedToday,
    completedTotal,
    earningsTodayCents,
    earningsTotalCents,
    totalTodayTarget,
    todayProgressPct
  } = useMemo(() => {
    let completedToday = 0;
    let completedTotal = 0;
    let earningsTodayCents = 0;
    let earningsTotalCents = 0;

    for (const [taskId, a] of Object.entries(annotations)) {
      if (a?.status !== "done") continue;
      const proj = taskToProject.get(taskId);
      const pay = proj?.payPerTaskCents || 0;

      completedTotal += 1;
      earningsTotalCents += pay;

      if (a.timestamp && isToday(a.timestamp)) {
        completedToday += 1;
        earningsTodayCents += pay;
      }
    }

    const totalTodayTarget = projects.reduce((acc, p) => acc + (p.todayTarget || 0), 0);
    const todayProgressPct = totalTodayTarget
      ? Math.min(100, Math.round((completedToday / totalTodayTarget) * 100))
      : 0;

    return { completedToday, completedTotal, earningsTodayCents, earningsTotalCents, totalTodayTarget, todayProgressPct };
  }, [annotations, taskToProject, projects]);

  /** “Potential today” in INR if user finishes today’s targets across projects */
  const potentialTodayCents = useMemo(() => {
    let remaining = 0;
    projects.forEach(p => {
      const done = doneTodayByProjectId.get(p.id) || 0;
      const left = Math.max(0, (p.todayTarget || 0) - done);
      remaining += left * (p.payPerTaskCents || 0);
    });
    return (earningsTodayCents + remaining);
  }, [projects, doneTodayByProjectId, earningsTodayCents]);

  /** Streaks (consecutive days with ≥1 completion) */
  const { currentStreak, bestStreak } = useMemo(() => {
    const days = new Set();
    for (const a of Object.values(annotations)) {
      if (a?.status === "done" && a?.timestamp) days.add(dayKey(a.timestamp));
    }
    if (days.size === 0) return { currentStreak: 0, bestStreak: 0 };
    const toNum = k => Math.floor(new Date(`${k}T00:00:00`).getTime() / 86400000);
    const sorted = [...days].map(toNum).sort((a,b)=>a-b);

    // best
    let best = 1, cur = 1;
    for (let i=1;i<sorted.length;i++){
      if (sorted[i] === sorted[i-1] + 1){ cur++; best=Math.max(best,cur); } else { cur=1; }
    }
    // current (count back from today)
    const have = new Set(sorted);
    let current = 0, probe = toNum(dayKey(Date.now()));
    while (have.has(probe)) { current++; probe--; }
    return { currentStreak: current, bestStreak: best };
  }, [annotations]);

  /** Quality snapshot (plain language) */
  const { goldChecked, goldPassRate, corrections } = useMemo(() => {
    // Gold check coverage
    const goldTasks = projects.flatMap(p => (p.tasks||[]).filter(t => t.isGold));
    let checked = 0, pass = 0;

    goldTasks.forEach(t => {
      const a = annotations[t.id];
      if (a?.status === "done" && typeof a?.payload?.goldCorrect === "boolean") {
        checked += 1;
        if (a.payload.goldCorrect) pass += 1;
      }
    });

    const goldPassRate = checked > 0 ? Math.round((pass / checked) * 100) : null;

    // Corrections requested (count “returned” if your system marks it; fall back to 0)
    let corrections = 0;
    for (const a of Object.values(annotations)) {
      if (a?.status === "returned") corrections += 1;
    }

    return { goldChecked: checked, goldPassRate, corrections };
  }, [projects, annotations]);

  /** Simple health state for badge color */
  const qualityState = useMemo(() => {
    if (goldPassRate === null && corrections === 0) return { label: "No checks yet", color: "default" };
    if ((goldPassRate ?? 100) >= 85 && corrections <= 1) return { label: "On track", color: "success" };
    if ((goldPassRate ?? 0) >= 70 && corrections <= 3) return { label: "Watch list", color: "warning" };
    return { label: "Needs attention", color: "error" };
  }, [goldPassRate, corrections]);

  /** Nudges */
  const tips = useMemo(() => {
    const out = [];
    if (goldPassRate !== null && goldPassRate < 85) out.push("Review quick quality guide");
    if (corrections > 0) out.push("Check examples of accepted answers");
    if (currentStreak < 3) out.push("Complete at least 1 task daily to build streak");
    return out;
  }, [goldPassRate, corrections, currentStreak]);

  const inr = (cents) => `₹${(cents / 100).toFixed(2)}`;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>My Day</Typography>

      {/* 1) Earnings + Goal */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Earned today</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{inr(earningsTodayCents)}</Typography>
              <Typography variant="caption" color="text.secondary">Lifetime: {inr(earningsTotalCents)}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Potential if you finish today</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{inr(potentialTodayCents)}</Typography>
              <Typography variant="caption" color="text.secondary">Based on today’s targets</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Today’s goal</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{completedToday}/{totalTodayTarget || 0}</Typography>
              <LinearProgress sx={{ mt: 1 }} value={todayProgressPct} variant="determinate" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 2) Quality snapshot */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>Quality snapshot</Typography>
            <Chip size="small" color={qualityState.color} label={qualityState.label} />
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Quality check score</Typography>
              <Typography variant="h6" sx={{ mt: .5 }}>
                {goldPassRate === null ? "—" : `${goldPassRate}%`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {goldPassRate === null ? "No checks yet" : `Based on ${goldChecked} checks`}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">Corrections requested</Typography>
              <Typography variant="h6" sx={{ mt: .5 }}>{corrections}</Typography>
              <Typography variant="caption" color="text.secondary">Items sent back to fix</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 3) Streaks & badges */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Streaks & badges</Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Chip label={`${currentStreak} day streak`} color="primary" />
            <Chip label={`Best: ${bestStreak}`} />
            {/* Example simple badge logic */}
            {completedTotal >= 50 && <Chip color="success" label="50+ Completed" />}
            {completedTotal >= 200 && <Chip color="success" label="200+ Completed" />}
          </Stack>
        </CardContent>
      </Card>

      {/* 4) Tips / actions */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Tips for me</Typography>
          {tips.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
              You’re on track. No actions needed right now.
            </Typography>
          ) : (
            <>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {tips.map((t, i) => <Chip key={i} size="small" color="warning" label={t} />)}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => window.alert("Opening quick guide (demo)…")}>
                  Open quick guide
                </Button>
                <Button size="small" onClick={() => window.alert("Acknowledged (demo).")}>
                  Dismiss
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}