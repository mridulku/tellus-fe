// src/components/Main/0.tellus/annotator/DashboardPanel.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box, Typography, Grid, Card, CardContent, LinearProgress,
  Chip, TextField, Stack, Button
} from "@mui/material";

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

// NEW: robust warm-up detector (works even if data wasn’t labeled)
function isWarmupProject(p = {}) {
  const rx = /warm.?up/i;
  const byFlag = !!p.isWarmup;
  const byName = rx.test(p.name || "");
  const bySubtype = rx.test(p.subtype || "");
  const byTags = Array.isArray(p.tags) && p.tags.some(t => rx.test(String(t)));
  return byFlag || byName || bySubtype || byTags;
}

export default function DashboardPanel({
  perProject = [],      // [{ id, name, description, remainingToday, plannedMinutes, plannedCents, doneTotal, total, dueAt/dueDate, priority, tags, ... }]
  today = { remainingTasks: 0, plannedMinutes: 0, plannedCents: 0, earnedCentsToday: 0 },
  onOpenProject,
  onStartToday,
}) {
  const now = useNow();
  const [query, setQuery] = useState("");

  // NEW: single filtered source used everywhere
  const visibleProjects = useMemo(
    () => perProject.filter(p => !isWarmupProject(p)),
    [perProject]
  );

  // Search across visible projects
  const filtered = useMemo(() => {
    if (!query.trim()) return visibleProjects;
    const q = query.toLowerCase();
    return visibleProjects.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.tags || []).some(t => String(t).toLowerCase().includes(q))
    );
  }, [visibleProjects, query]);

  // Today’s plan (remaining > 0), sorted by priority then due date then remaining
  const todayPlan = useMemo(() => {
    const priRank = { High: 0, Med: 1, Low: 2 };
    return visibleProjects
      .filter(p => (p.remainingToday ?? 0) > 0)
      .sort((a, b) => {
        const pa = priRank[a.priority || "Low"], pb = priRank[b.priority || "Low"];
        if (pa !== pb) return pa - pb;
        if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
        return (b.remainingToday ?? 0) - (a.remainingToday ?? 0);
      });
  }, [visibleProjects]);

  const currency = (cents) => `₹${(cents/100).toFixed(2)}`;
  const mins = (m) => `${m} min${m===1?"":"s"}`;

  return (
    <Box>
      {/* Today at a glance */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", rowGap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Tasks today: <b>{today.remainingTasks}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Est. time: <b>{mins(today.plannedMinutes)}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Est. payout: <b>{currency(today.plannedCents)}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Earned: <b>{currency(today.earnedCentsToday)}</b>
              </Typography>
            </Stack>
            <Button variant="contained" onClick={onStartToday}>Start today’s tasks</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Search */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Today’s Plan */}
      <Typography variant="h6" sx={{ mb: 1 }}>Today’s plan</Typography>
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
                      {p.name} • Remaining today: <b>{p.remainingToday}</b>
                      {" "}• {mins(p.plannedMinutes)} • {currency(p.plannedCents)}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {di && <Chip size="small" color={di.color} label={di.text} />}
                      <Button size="small" onClick={() => onOpenProject(p.id)}>Start</Button>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Active Projects */}
      <Typography variant="h6" sx={{ mb: 1 }}>Active projects</Typography>
      <Stack spacing={2}>
        {filtered.map((p) => {
          const overallPct = p.total ? Math.round((p.doneTotal / p.total) * 100) : 0;
          const di = dueInfo(p, now);
          return (
            <Card key={p.id} variant="outlined">
              <CardContent>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {p.type}{p.subtype ? ` • ${p.subtype}` : ""}
                    </Typography>
                    <Typography variant="h6">{p.name}</Typography>
                    {p.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {p.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                      {p.priority && <Chip size="small" label={p.priority} />}
                      {di ? (
                        <Chip size="small" color={di.color} label={di.text} />
                      ) : (
                        (p.dueAt || p.dueDate) && <Chip size="small" label={`Due ${p.dueAt || p.dueDate}`} />
                      )}
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">Overall</Typography>
                    <LinearProgress variant="determinate" value={overallPct || 0} sx={{ my: 0.5 }} />
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {p.doneTotal || 0}/{p.total || 0} total
                    </Typography>

                    <Typography variant="caption" color="text.secondary">Today</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {(p.target || 0) - (p.remainingToday || 0)}/{p.target || 0} • {p.plannedMinutes || 0} min • {currency(p.plannedCents || 0)}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" onClick={() => onOpenProject(p.id)}>
                        Start project
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}