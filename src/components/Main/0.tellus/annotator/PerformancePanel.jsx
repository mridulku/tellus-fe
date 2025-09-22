import React, { useMemo } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, LinearProgress, Divider, Button,
} from "@mui/material";

/**
 * Unified performance dashboard
 * - Inputs:
 *    projects: SAMPLE_PROJECTS-style array (each has {id, name, payPerTaskCents, todayTarget, tasks: [{id, ...}]})
 *    annotations: { [taskId]: { status: "done" | "flagged" | "skipped", timestamp: number, payload?: any } }
 *
 * - What it shows:
 *    1) Today snapshot: completed today, time/earnings estimate, quota progress
 *    2) Lifetime: total completed, total flags, milestones (10/50/100/250…)
 *    3) Streaks: current & best streak (consecutive days with ≥1 completion)
 *    4) Quality & QA: flags raised, gold pass rate (if available), audit results (optional)
 *    5) Training nudges: suggestions if quality signals are low (no navigation side effects)
 *
 * - Safe fallbacks:
 *    • If no gold info or audits exist, we show “—”/“N/A” gracefully.
 */

function dayKey(ts) {
  const d = new Date(ts);
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function isToday(ts) {
  const dk = dayKey(ts);
  const today = dayKey(Date.now());
  return dk === today;
}

function consecutiveStreaks(dayKeysSet) {
  // Compute current and best streaks from a Set of "YYYY-MM-DD"
  if (dayKeysSet.size === 0) return { current: 0, best: 0 };

  const toNum = (k) => Math.floor(new Date(`${k}T00:00:00`).getTime() / 86400000);
  const days = Array.from(dayKeysSet).map(toNum).sort((a,b) => a - b);

  // Best streak
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i-1] + 1) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }

  // Current streak: walk backward from today
  const todayNum = toNum(dayKey(Date.now()));
  let current = 0;
  let probe = todayNum;
  const daySetNum = new Set(days);
  while (daySetNum.has(probe)) {
    current += 1;
    probe -= 1;
  }

  return { current, best };
}

export default function PerformancePanel({ projects = [], annotations = {} }) {
  // Build helpers
  const taskToProject = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => (p.tasks || []).forEach((t) => map.set(t.id, p)));
    return map;
  }, [projects]);

  const allTasks = useMemo(
    () => projects.flatMap((p) => (p.tasks || []).map((t) => ({ ...t, __project: p }))),
    [projects]
  );

  // Aggregate core metrics from annotations
  const {
    completedTotal,
    completedToday,
    flaggedTotal,
    dayKeysDone,
    earningsTodayCents,
    earningsTotalCents,
  } = useMemo(() => {
    let completedTotal = 0;
    let completedToday = 0;
    let flaggedTotal = 0;
    let earningsTodayCents = 0;
    let earningsTotalCents = 0;
    const dayKeysDone = new Set();

    for (const [taskId, a] of Object.entries(annotations)) {
      const proj = taskToProject.get(taskId);
      const pay = proj?.payPerTaskCents || 0;

      if (a.status === "done") {
        completedTotal += 1;
        earningsTotalCents += pay;
        if (a.timestamp) {
          dayKeysDone.add(dayKey(a.timestamp));
          if (isToday(a.timestamp)) {
            completedToday += 1;
            earningsTodayCents += pay;
          }
        }
      } else if (a.status === "flagged") {
        flaggedTotal += 1;
      }
    }

    return {
      completedTotal,
      completedToday,
      flaggedTotal,
      dayKeysDone,
      earningsTodayCents,
      earningsTotalCents,
    };
  }, [annotations, taskToProject]);

  // Quota: sum project todayTarget; progress is completedToday / totalTarget
  const { totalTodayTarget, todayProgressPct } = useMemo(() => {
    const totalTodayTarget = projects.reduce(
      (acc, p) => acc + (p.todayTarget || 0),
      0
    );
    const pct = totalTodayTarget
      ? Math.min(100, Math.round((completedToday / totalTodayTarget) * 100))
      : 0;
    return { totalTodayTarget, todayProgressPct: pct };
  }, [projects, completedToday]);

  // Streaks
  const { current: currentStreak, best: bestStreak } = useMemo(
    () => consecutiveStreaks(dayKeysDone),
    [dayKeysDone]
  );

  // Milestones
  const milestones = [10, 50, 100, 250, 500, 1000];
  const nextMilestone = milestones.find((m) => completedTotal < m) || null;
  const milestonePct = nextMilestone
    ? Math.round((completedTotal / nextMilestone) * 100)
    : 100;
  const achieved = milestones.filter((m) => completedTotal >= m);

  // Quality: Gold pass rate (if tasks mark isGold=true and annotation.payload.goldCorrect boolean)
  const { goldDone, goldChecked, goldPassRate } = useMemo(() => {
    const goldTasks = allTasks.filter((t) => t.isGold);
    let goldDone = 0;
    let goldChecked = 0;
    let goldPass = 0;

    goldTasks.forEach((t) => {
      const a = annotations[t.id];
      if (a?.status === "done") {
        goldDone += 1;
        if (a.payload && typeof a.payload.goldCorrect === "boolean") {
          goldChecked += 1;
          if (a.payload.goldCorrect) goldPass += 1;
        }
      }
    });

    const goldPassRate =
      goldChecked > 0 ? Math.round((goldPass / goldChecked) * 100) : null;
    return { goldDone, goldChecked, goldPassRate };
  }, [allTasks, annotations]);

  // Audit results (optional: read from localStorage "annotator.audits.v1")
  const { auditsTotal, auditsFail } = useMemo(() => {
    try {
      const audits = JSON.parse(localStorage.getItem("annotator.audits.v1") || "[]");
      const auditsTotal = audits.length;
      const auditsFail = audits.filter((x) => x?.verdict === "fail").length;
      return { auditsTotal, auditsFail };
    } catch {
      return { auditsTotal: 0, auditsFail: 0 };
    }
  }, []);

  // Training nudges (heuristic)
  const trainingHints = useMemo(() => {
    const hints = [];
    if (goldPassRate !== null && goldPassRate < 80) {
      hints.push("Policy refresher (gold pass rate < 80%)");
    }
    if (flaggedTotal >= 3) {
      hints.push("Flag hygiene review (3+ flags)");
    }
    if (auditsFail > 0) {
      hints.push("Quality remediation (audit fails)");
    }
    return hints;
  }, [goldPassRate, flaggedTotal, auditsFail]);

  const inr = (cents) => `₹${(cents / 100).toFixed(2)}`;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>My Performance</Typography>

      {/* Row: Today snapshot */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Today’s completions</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{completedToday}</Typography>
              <Typography variant="caption" color="text.secondary">
                Target: {completedToday}/{totalTodayTarget || 0}
              </Typography>
              <LinearProgress sx={{ mt: 1 }} value={todayProgressPct} variant="determinate" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Earnings today</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{inr(earningsTodayCents)}</Typography>
              <Typography variant="caption" color="text.secondary">Lifetime: {inr(earningsTotalCents)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Streaks</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{currentStreak} day streak</Typography>
              <Typography variant="caption" color="text.secondary">Best: {bestStreak} days</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row: Lifetime + Milestones */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Completed (lifetime)</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{completedTotal}</Typography>
              <Typography variant="caption" color="text.secondary">Flags raised: {flaggedTotal}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Milestones</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {achieved.map((m) => (
                  <Chip key={m} size="small" color="success" label={`${m}`} />
                ))}
                {nextMilestone && (
                  <Chip size="small" color="default" label={`Next: ${nextMilestone}`} />
                )}
              </Stack>
              {nextMilestone && (
                <>
                  <LinearProgress sx={{ mt: 1.5 }} value={milestonePct} variant="determinate" />
                  <Typography variant="caption" color="text.secondary">
                    {completedTotal}/{nextMilestone}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row: Quality & QA */}
      <Typography variant="h6" sx={{ mt: 1 }}>Quality & QA</Typography>
      <Grid container spacing={2} sx={{ mt: .5, mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Flags</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>{flaggedTotal}</Typography>
              <Typography variant="caption" color="text.secondary">
                Raised by you to request review; not punitive.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Gold calibration</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>
                {goldPassRate === null ? "—" : `${goldPassRate}%`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {goldChecked > 0
                  ? `Checked: ${goldChecked} (done: ${goldDone})`
                  : "No gold checks recorded"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary">Audit outcomes</Typography>
              <Typography variant="h5" sx={{ mt: .5 }}>
                {auditsTotal === 0 ? "N/A" : `${auditsTotal - auditsFail}✓ / ${auditsFail}✗`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {auditsTotal === 0 ? "No audits yet" : `Total audits: ${auditsTotal}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Training nudges */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1">Training & Recommendations</Typography>
          {trainingHints.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>
              You’re on track. No training actions recommended right now.
            </Typography>
          ) : (
            <>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {trainingHints.map((h, i) => <Chip key={i} size="small" color="warning" label={h} />)}
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => window.alert("Opening training (demo)…")}>
                  Start recommended training
                </Button>
                <Button size="small" onClick={() => window.alert("Acknowledged (demo).")}>
                  Dismiss for now
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}