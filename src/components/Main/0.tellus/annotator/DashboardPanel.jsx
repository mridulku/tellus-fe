// src/components/Main/0.tellus/annotator/DashboardPanel.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, LinearProgress,
  Chip, TextField, Stack, Button, Divider, ToggleButton, ToggleButtonGroup
} from "@mui/material";
import OnboardingWidget from "./OnboardingWidget";

// Small hook to keep a ticking "now" for countdowns (updates every minute)
function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function fmtDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d >= 2) return `${d}d`;
  if (d === 1) return `1d ${h}h`;
  if (h >= 1) return `${h}h ${m}m`;
  return `${m}m`;
}

function dueInfo(p, nowTs) {
  const dueRaw = p.dueAt || p.dueDate;
  if (!dueRaw) return null;
  const due = new Date(dueRaw).getTime();
  if (Number.isNaN(due)) return null;
  const delta = due - nowTs;
  if (delta < 0) {
    return { text: `Overdue ${fmtDuration(-delta)}`, color: "error" };
  }
  if (delta <= 24 * 3600 * 1000) {
    return { text: `Due in ${fmtDuration(delta)}`, color: "warning" };
  }
  return { text: `Due in ${fmtDuration(delta)}`, color: "default" };
}

export default function DashboardPanel({
  perProject, today, onOpenProject, onStartToday,
  onboarding, updateOnboarding, onStartWarmup
}) {
  const now = useNow();

  // --- local filters ---
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");      // all | SFT | RM
  const [priorityFilter, setPriorityFilter] = useState("all"); // all | High | Med | Low
  const [quotaFilter, setQuotaFilter] = useState("all");    // all | hasTarget | remaining | noTarget

  // last session (for Quick Resume)
  const [lastSession, setLastSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem("annotator.lastSession.v1") || "null"); } catch { return null; }
  });

  const saveLastSession = (payload) => {
    try {
      localStorage.setItem("annotator.lastSession.v1", JSON.stringify(payload));
      setLastSession(payload);
    } catch {}
  };

  const handleStartToday = () => {
    saveLastSession({ mode: "today" });
    onStartToday();
  };

  const handleOpenProject = (projectId) => {
    saveLastSession({ mode: "project", projectId });
    onOpenProject(projectId);
  };

  const filtered = useMemo(() => {
    return perProject
      .filter(p => !p.isWarmup) // keep warm-up out of normal list
      .filter(p => (typeFilter === "all" ? true : p.type === typeFilter))
      .filter(p => (priorityFilter === "all" ? true : (p.priority || "Low") === priorityFilter))
      .filter(p => {
        if (quotaFilter === "hasTarget") return (p.target ?? 0) > 0;
        if (quotaFilter === "remaining") return (p.remainingToday ?? 0) > 0;
        if (quotaFilter === "noTarget")  return !p.target || p.target === 0;
        return true; // "all"
      })
      .filter(p => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      });
  }, [perProject, typeFilter, priorityFilter, quotaFilter, query]);

  const todayPlan = useMemo(() => {
    const priRank = { High: 0, Med: 1, Low: 2 };
    return [...perProject]
      .filter(p => !p.isWarmup && (p.remainingToday ?? 0) > 0)
      .sort((a,b) => {
        const pa = priRank[a.priority || "Low"], pb = priRank[b.priority || "Low"];
        if (pa !== pb) return pa - pb;
        if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
        return (b.remainingToday ?? 0) - (a.remainingToday ?? 0);
      });
  }, [perProject]);

  const currency = (cents) => `₹${(cents/100).toFixed(2)}`;
  const mins = (m) => `${m} min${m===1?"":"s"}`;

  const lifetimeCompleted = useMemo(
    () => perProject.reduce((acc, p) => acc + (p.doneTotal || 0), 0),
    [perProject]
  );

  // resolve last session label (optional)
  const lastSessionLabel = useMemo(() => {
    if (!lastSession) return null;
    if (lastSession.mode === "today") return "Resume Today’s Tasks";
    if (lastSession.mode === "project" && lastSession.projectId) {
      const p = perProject.find(x => x.id === lastSession.projectId);
      return p ? `Resume: ${p.name}` : "Resume last project";
    }
    return null;
  }, [lastSession, perProject]);

  return (
    <Box>
      {/* Onboarding — small, collapsible widget (your component) */}
      <OnboardingWidget
        onboarding={onboarding}
        updateOnboarding={updateOnboarding}
        onStartWarmup={onStartWarmup}
      />

      {/* Quick resume (session state) */}
      {lastSessionLabel && (
        <Card variant="outlined" sx={{ mb: 2, bgcolor: "grey.50" }}>
          <CardContent sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography sx={{ flex: 1 }} variant="body2" color="text.secondary">
              You have an unfinished session.
            </Typography>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                if (lastSession.mode === "today") handleStartToday();
                else if (lastSession.mode === "project" && lastSession.projectId) handleOpenProject(lastSession.projectId);
              }}
            >
              {lastSessionLabel}
            </Button>
            <Button
              size="small"
              onClick={() => { localStorage.removeItem("annotator.lastSession.v1"); setLastSession(null); }}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <Typography variant="h5" gutterBottom>Today</Typography>

      {/* Rollup stats */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">Remaining tasks: {today.remainingTasks}</Typography>
        <Typography variant="body2">Planned minutes: {today.plannedMinutes}</Typography>
        <Typography variant="body2">Planned earnings: {currency(today.plannedCents)}</Typography>
        <Typography variant="body2">Earned today: {currency(today.earnedCentsToday)}</Typography>

        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={handleStartToday}>
            Start Today’s Tasks
          </Button>
        </Stack>
      </Box>

      {/* KPI row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Tasks remaining today</Typography>
            <Typography variant="h5">{today.remainingTasks}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Time estimate (today)</Typography>
            <Typography variant="h5">{mins(today.plannedMinutes)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Projected earnings (today)</Typography>
            <Typography variant="h5">{currency(today.plannedCents)}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="body2" color="text.secondary">Completed (lifetime)</Typography>
            <Typography variant="h5">{lifetimeCompleted}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              label="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ToggleButtonGroup
              value={typeFilter}
              exclusive
              onChange={(_, v) => v && setTypeFilter(v)}
              size="small"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="SFT">SFT</ToggleButton>
              <ToggleButton value="RM">RM</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={priorityFilter}
              exclusive
              onChange={(_, v) => v && setPriorityFilter(v)}
              size="small"
            >
              <ToggleButton value="all">All prio</ToggleButton>
              <ToggleButton value="High">High</ToggleButton>
              <ToggleButton value="Med">Med</ToggleButton>
              <ToggleButton value="Low">Low</ToggleButton>
            </ToggleButtonGroup>
            {/* NEW: Quota filter */}
            <ToggleButtonGroup
              value={quotaFilter}
              exclusive
              onChange={(_, v) => v && setQuotaFilter(v)}
              size="small"
            >
              <ToggleButton value="all">All quota</ToggleButton>
              <ToggleButton value="hasTarget">Has target</ToggleButton>
              <ToggleButton value="remaining">Remaining &gt; 0</ToggleButton>
              <ToggleButton value="noTarget">No target</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {/* Today’s Plan */}
      <Typography variant="h6" sx={{ mb: 1 }}>Today’s Plan</Typography>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          {todayPlan.length === 0 ? (
            <Typography variant="body2" color="text.secondary">All caught up! 🎉</Typography>
          ) : (
            <Stack spacing={1}>
              {todayPlan.map((p) => {
                const di = dueInfo(p, now);
                return (
                  <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">
                      {p.name} • Remaining today: <b>{p.remainingToday}</b> • {mins(p.plannedMinutes)} • {currency(p.plannedCents)}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {di && <Chip size="small" color={di.color} label={di.text} />}
                      <Button size="small" onClick={() => handleOpenProject(p.id)}>Start</Button>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Typography variant="h6" sx={{ mb: 1 }}>Active Projects</Typography>
      <Stack spacing={2}>
        {filtered.map((p) => {
          const overallPct = p.total ? Math.round((p.doneTotal / p.total) * 100) : 0;
          const dailyPct = p.target ? Math.round(((p.target - (p.remainingToday || 0)) / p.target) * 100) : 0;
          const di = dueInfo(p, now);
          return (
            <Card key={p.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {p.type}{p.subtype ? ` • ${p.subtype}` : ""}
                    </Typography>
                    <Typography variant="h6">{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {p.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                      {p.priority && <Chip size="small" label={p.priority} />}
                      {di ? (
                        <Chip size="small" color={di.color} label={di.text} />
                      ) : (
                        (p.dueAt || p.dueDate) && <Chip size="small" label={`Due ${p.dueAt || p.dueDate}`} />
                      )}
                      {(p.tags || []).slice(0,3).map((t, i) => <Chip key={i} size="small" label={t} />)}
                    </Stack>
                  </Box>

                  <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />

                  <Box sx={{ minWidth: 280 }}>
                    <Typography variant="caption" color="text.secondary">Today</Typography>
                    <LinearProgress variant="determinate" value={isNaN(dailyPct) ? 0 : dailyPct} sx={{ my: 0.5 }} />
                    <Typography variant="body2">
                      {(p.target || 0) - (p.remainingToday || 0)}/{p.target || 0} today • {mins(p.plannedMinutes || 0)} • {currency(p.plannedCents || 0)}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Overall</Typography>
                    <LinearProgress variant="determinate" value={overallPct} sx={{ my: 0.5 }} />
                    <Typography variant="body2">
                      {p.doneTotal}/{p.total} total
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button variant="outlined" onClick={() => handleOpenProject(p.id)}>
                        Start Project
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}