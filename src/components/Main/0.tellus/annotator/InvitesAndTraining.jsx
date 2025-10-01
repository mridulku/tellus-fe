// src/components/Main/0.tellus/annotator/InvitesAndTraining.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Card, CardContent, Stack, Button,
  Grid, Divider, LinearProgress, Checkbox, FormControlLabel,
  Snackbar, Alert
} from "@mui/material";

const LS_INVITES = "annotator.invites.v2";
const LS_TRAINING = "annotator.mandatoryTraining.v1";

function fmtINR(centsOrRupees, isCents = true) {
  const rupees = isCents ? (Number(centsOrRupees || 0) / 100) : Number(centsOrRupees || 0);
  return `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function fmtDurationFromMinutes(totalMins = 0) {
  const m = Math.max(0, Math.round(totalMins));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm} min`;
  if (mm === 0) return `${h} hr`;
  return `${h} hr ${mm} min`;
}

// Build a very small, clean invite list from projects (demo-friendly)
const seedInvites = (projects = []) => {
  const byId = Object.fromEntries(projects.map(p => [p.id, p]));
  const pick = (id, fallbackName, fallbackPayCents, fallbackMins) => {
    const p = byId[id];
    const tasksCount = p?.tasks?.length ?? 20; // fallback demo count
    return {
      id: `inv_${id || Math.random().toString(36).slice(2)}`,
      projectId: id || `demo_${Math.random().toString(36).slice(2)}`,
      name: p?.name || fallbackName,
      payPerTaskCents: p?.payPerTaskCents ?? fallbackPayCents,
      avgMinutesPerTask: p?.avgMinutesPerTask ?? fallbackMins,
      tasksCount,              // <- key number users care about
      status: "pending",       // pending | accepted | declined
    };
  };

  return [
    pick("p1", "Write responses to prompts", 50, 3),
    pick("p3", "Choose better of two answers", 50, 3),
    pick("p4", "Rate one response (1–7)", 45, 2),
  ];
};

// ---- Mandatory training (global, simple) -------------------------------
const DEFAULT_TRAINING = {
  steps: [
    { id: "s1", label: "Read the 1-page quickstart", done: false },
    { id: "s2", label: "Watch the 2-min intro", done: false },
    { id: "s3", label: "Do 2 sample tasks", done: false },
  ],
  completed: false,
};
function loadTraining() {
  try { return { ...DEFAULT_TRAINING, ...(JSON.parse(localStorage.getItem(LS_TRAINING) || "{}")) }; }
  catch { return DEFAULT_TRAINING; }
}
function saveTraining(t) {
  try { localStorage.setItem(LS_TRAINING, JSON.stringify(t)); } catch {}
}

// ---- Component ----------------------------------------------------------
export default function InvitesAndTraining({ projects = [], onOpenProject }) {
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  // Global mandatory training
  const [training, setTraining] = useState(loadTraining());
  const stepsDone = training.steps.filter(s => s.done).length;
  const trainingPct = Math.round(100 * stepsDone / training.steps.length);
  const trainingComplete = training.completed || (training.steps.length > 0 && stepsDone === training.steps.length);

  const toggleStep = (id) => {
    setTraining(curr => {
      const steps = curr.steps.map(s => s.id === id ? { ...s, done: !s.done } : s);
      const completed = steps.every(s => s.done);
      const next = { ...curr, steps, completed };
      saveTraining(next);
      return next;
    });
  };
  const markTrainingComplete = () => {
    setTraining(curr => {
      const next = { ...curr, completed: true, steps: curr.steps.map(s => ({ ...s, done: true })) };
      saveTraining(next);
      setToast({ open: true, msg: "Training completed. You can now view & accept projects.", severity: "success" });
      return next;
    });
  };

  // Invites
  const [invites, setInvites] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_INVITES);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seedInvites(projects);
  });
  useEffect(() => {
    localStorage.setItem(LS_INVITES, JSON.stringify(invites));
  }, [invites]);

  const accept = (id) => {
    setInvites(list => list.map(i => i.id === id ? { ...i, status: "accepted" } : i));
    setToast({ open: true, msg: "Project accepted.", severity: "success" });
  };
  const decline = (id) => {
    setInvites(list => list.map(i => i.id === id ? { ...i, status: "declined" } : i));
    setToast({ open: true, msg: "Invitation declined.", severity: "info" });
  };

  const pending = useMemo(() => invites.filter(i => i.status === "pending"), [invites]);
  const accepted = useMemo(() => invites.filter(i => i.status === "accepted"), [invites]);

  // Compute user-facing numbers
  const inviteStats = (i) => {
    const count = Math.max(0, Number(i.tasksCount || 0));
    const perTaskCents = Number(i.payPerTaskCents || 0);
    const minsPerTask = Number(i.avgMinutesPerTask || 0);

    const totalPayoutINR = perTaskCents * count / 100;
    const totalMinutes = minsPerTask * count;

    return {
      tasks: count,
      perTask: fmtINR(perTaskCents),                 // e.g., ₹0.50
      totalPayout: fmtINR(totalPayoutINR, false),    // e.g., ₹500
      totalTime: fmtDurationFromMinutes(totalMinutes)
    };
  };

  const InviteCard = ({ inv }) => {
    const s = inviteStats(inv);
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Invitation</Typography>
              <Typography variant="h6">{inv.name}</Typography>

              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2"><b>{s.tasks}</b> tasks</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2">≈ <b>{s.totalPayout}</b> total</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2">{s.perTask}/task</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2">~ {s.totalTime}</Typography>
                </Grid>
              </Grid>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" onClick={() => accept(inv.id)} disabled={!trainingComplete}>
                Accept
              </Button>
              <Button size="small" color="inherit" onClick={() => decline(inv.id)} disabled={!trainingComplete}>
                Decline
              </Button>
            </Stack>
          </Stack>
          {!trainingComplete && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Complete training above to accept/decline.
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const AcceptedCard = ({ inv }) => {
    const s = inviteStats(inv);
    // If the project exists, we can open it
    const projectExists = projects.some(p => p.id === inv.projectId);
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Accepted</Typography>
              <Typography variant="h6">{inv.name}</Typography>
              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2"><b>{s.tasks}</b> tasks</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2">≈ <b>{s.totalPayout}</b> total</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2">{s.perTask}/task</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md="auto">
                  <Typography variant="body2">~ {s.totalTime}</Typography>
                </Grid>
              </Grid>
            </Box>
            <Button
              size="small"
              variant="contained"
              onClick={() => onOpenProject?.(inv.projectId)}
              disabled={!projectExists}
            >
              {projectExists ? "Open project" : "Start (demo)"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Invites & Training</Typography>

      {/* 1) Mandatory training (global gate) */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Mandatory training</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Please complete this short training to unlock project invitations.
          </Typography>
          <LinearProgress variant="determinate" value={trainingPct} sx={{ my: 1 }} />
          <Stack spacing={1} sx={{ mt: 1 }}>
            {training.steps.map(s => (
              <FormControlLabel
                key={s.id}
                control={<Checkbox checked={!!s.done} onChange={() => toggleStep(s.id)} />}
                label={s.label}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              onClick={markTrainingComplete}
              disabled={trainingComplete}
            >
              {trainingComplete ? "Training completed" : "Mark training complete"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* 2) Invitations (simple, money + time only) */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Project invitations</Typography>
      <Stack spacing={1.5} sx={{ opacity: trainingComplete ? 1 : 0.6 }}>
        {pending.length === 0 ? (
          <Card variant="outlined"><CardContent>
            <Typography variant="body2" color="text.secondary">
              {trainingComplete ? "No pending invitations right now." : "Complete training to see invitations."}
            </Typography>
          </CardContent></Card>
        ) : pending.map(inv => <InviteCard key={inv.id} inv={inv} />)}
      </Stack>

      {/* 3) Accepted projects */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>My accepted projects</Typography>
      <Stack spacing={1.5}>
        {accepted.length === 0 ? (
          <Card variant="outlined"><CardContent>
            <Typography variant="body2" color="text.secondary">You haven’t accepted any projects yet.</Typography>
          </CardContent></Card>
        ) : accepted.map(inv => <AcceptedCard key={inv.id} inv={inv} />)}
      </Stack>

      {/* Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={1600}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}