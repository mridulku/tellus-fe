// src/components/Main/0.tellus/annotator/DashboardPanel.jsx
import React, { useMemo, useState } from "react";
import {
  Box, Typography, Grid, Card, CardContent, LinearProgress,
  Chip, TextField, Stack, Button, Divider, ToggleButton, ToggleButtonGroup
} from "@mui/material";

export default function DashboardPanel({ perProject, today, onOpenProject, onStartToday }) {
  // --- Filters (local state) ---
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");      // all | SFT | RM
  const [priorityFilter, setPriorityFilter] = useState("all"); // all | High | Med | Low

  const filtered = useMemo(() => {
    return perProject
      .filter(p => (typeFilter === "all" ? true : p.type === typeFilter))
      .filter(p => (priorityFilter === "all" ? true : (p.priority || "Low") === priorityFilter))
      .filter(p => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      });
  }, [perProject, typeFilter, priorityFilter, query]);

  const todayPlan = useMemo(() => {
    // sort by priority then due date, then remainingToday desc
    const priRank = { High: 0, Med: 1, Low: 2 };
    return [...perProject]
      .filter(p => p.remainingToday > 0)
      .sort((a,b) => {
        const pa = priRank[a.priority || "Low"], pb = priRank[b.priority || "Low"];
        if (pa !== pb) return pa - pb;
        if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
        return b.remainingToday - a.remainingToday;
      });
  }, [perProject]);

  const currency = (cents) => `₹${(cents/100).toFixed(2)}`;
  const mins = (m) => `${m} min${m===1?"":"s"}`;

  // --- KPIs ---
  const lifetimeCompleted = useMemo(
    () => perProject.reduce((acc, p) => acc + p.doneTotal, 0),
    [perProject]
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Today</Typography>

      {/* Rollup stats at the top */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">Remaining tasks: {today.remainingTasks}</Typography>
        <Typography variant="body2">Planned minutes: {today.plannedMinutes}</Typography>
        <Typography variant="body2">Planned earnings: {currency(today.plannedCents)}</Typography>
        <Typography variant="body2">Earned today: {currency(today.earnedCentsToday)}</Typography>

        <Button sx={{ mt: 1 }} variant="contained" onClick={onStartToday}>
          Start Today’s Tasks
        </Button>
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
          </Stack>
        </CardContent>
      </Card>

      {/* Today’s Plan (moved up, right under filters) */}
      <Typography variant="h6" sx={{ mb: 1 }}>Today’s Plan</Typography>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          {todayPlan.length === 0 ? (
            <Typography variant="body2" color="text.secondary">All caught up! 🎉</Typography>
          ) : (
            <Stack spacing={1}>
              {todayPlan.map((p) => (
                <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">
                    {p.name} • Remaining today: <b>{p.remainingToday}</b> • {mins(p.plannedMinutes)} • {currency(p.plannedCents)}
                  </Typography>
                  <Button size="small" onClick={() => onOpenProject(p.id)}>Start</Button>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Typography variant="h6" sx={{ mb: 1 }}>Active Projects</Typography>
      <Stack spacing={2}>
        {filtered.map((p) => {
          const overallPct = p.total ? Math.round((p.doneTotal / p.total) * 100) : 0;
          const dailyPct = p.target ? Math.round(((p.target - p.remainingToday) / p.target) * 100) : 0;
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
                      {p.dueAt && <Chip size="small" label={`Due ${p.dueAt}`} />}
                      {(p.tags || []).slice(0,3).map((t, i) => <Chip key={i} size="small" label={t} />)}
                    </Stack>
                  </Box>

                  <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />

                  <Box sx={{ minWidth: 280 }}>
                    <Typography variant="caption" color="text.secondary">Today</Typography>
                    <LinearProgress variant="determinate" value={isNaN(dailyPct) ? 0 : dailyPct} sx={{ my: 0.5 }} />
                    <Typography variant="body2">
                      {p.target - p.remainingToday}/{p.target} today • {mins(p.plannedMinutes)} • {currency(p.plannedCents)}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>Overall</Typography>
                    <LinearProgress variant="determinate" value={overallPct} sx={{ my: 0.5 }} />
                    <Typography variant="body2">
                      {p.doneTotal}/{p.total} total
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {/* Per-project start (only this project's tasks) */}
                      <Button variant="outlined" onClick={() => onOpenProject(p.id)}>
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