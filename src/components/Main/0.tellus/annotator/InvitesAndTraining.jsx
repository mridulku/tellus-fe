// src/components/Main/0.tellus/annotator/InvitesAndTraining.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  Grid, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, TextField, Checkbox, FormControlLabel, Snackbar, Alert
} from "@mui/material";

const LS_KEY = "annotator.invites.v1";

const seedInvites = (projects=[]) => {
  // map a few existing SAMPLE_PROJECTS ids if available
  const byId = Object.fromEntries(projects.map(p => [p.id, p]));
  const now = Date.now();
  const day = 24*60*60*1000;

  return [
    {
      id: "inv1",
      projectId: "p3",
      projectName: byId["p3"]?.name || "Choose better of two answers (Helpfulness)",
      payPerTaskCents: byId["p3"]?.payPerTaskCents ?? 50,
      avgMinutesPerTask: byId["p3"]?.avgMinutesPerTask ?? 3,
      taskTypes: ["RM_PAIRWISE"],
      cognitiveLoad: "Medium",
      requiresTraining: false,
      expiresAt: new Date(now + 2*day).toISOString(),
      status: "pending",
      training: { steps: [], completed: true },
    },
    {
      id: "inv2",
      projectId: "p6",
      projectName: byId["p6"]?.name || "Try to elicit unsafe behavior (more harmful)",
      payPerTaskCents: byId["p6"]?.payPerTaskCents ?? 60,
      avgMinutesPerTask: byId["p6"]?.avgMinutesPerTask ?? 4,
      taskTypes: ["RED_TEAM", "RM_PAIRWISE"],
      cognitiveLoad: "High",
      requiresTraining: true,
      expiresAt: new Date(now + 1*day + 4*60*60*1000).toISOString(), // 1 day + 4h
      status: "pending",
      training: {
        completed: false,
        steps: [
          { id: "t1", label: "Watch 3-min safety intro video", done: false },
          { id: "t2", label: "Read project guideline doc", done: false },
          { id: "t3", label: "Complete 2 sample items", done: false },
        ],
      },
    },
    {
      id: "inv3",
      projectId: "p4",
      projectName: byId["p4"]?.name || "Rate one response (HHH Likert)",
      payPerTaskCents: byId["p4"]?.payPerTaskCents ?? 45,
      avgMinutesPerTask: byId["p4"]?.avgMinutesPerTask ?? 2,
      taskTypes: ["RM_SCALAR"],
      cognitiveLoad: "Low",
      requiresTraining: false,
      expiresAt: new Date(now - 6*60*60*1000).toISOString(), // expired 6h ago
      status: "pending",
      training: { steps: [], completed: true },
    },
  ];
};

function centsToINR(cents) {
  return `₹${(cents/100).toFixed(2)}`;
}
function timeLeftLabel(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms/3600000);
  const m = Math.floor((ms%3600000)/60000);
  if (h > 24) {
    const d = Math.floor(h/24);
    return `${d}d ${h%24}h left`;
  }
  return `${h}h ${m}m left`;
}

export default function InvitesAndTraining({ projects = [], onOpenProject }) {
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  // Load / persist invites
  const [invites, setInvites] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seedInvites(projects);
  });
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(invites));
  }, [invites]);

  // Dialogs
  const [preview, setPreview] = useState(null); // invite
  const [training, setTraining] = useState(null); // invite requiring training

  // Derived buckets
  const withExpiry = useMemo(() => {
    return invites.map(i => {
      const expired = Date.now() > new Date(i.expiresAt).getTime();
      return { ...i, expired };
    });
  }, [invites]);

  const pending = withExpiry.filter(i => i.status === "pending" && !i.expired);
  const expired = withExpiry.filter(i => i.status === "pending" && i.expired);
  const accepted = withExpiry.filter(i => i.status === "accepted");
  const declined = withExpiry.filter(i => i.status === "declined");

  const projectById = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);

  const accept = (id) => {
    setInvites(curr => curr.map(i => {
      if (i.id !== id) return i;
      if (Date.now() > new Date(i.expiresAt).getTime()) {
        setToast({ open: true, msg: "Invitation expired.", severity: "warning" });
        return i;
      }
      const next = { ...i, status: "accepted" };
      setToast({ open: true, msg: "Project accepted.", severity: "success" });
      return next;
    }));
  };
  const decline = (id) => {
    setInvites(curr => curr.map(i => i.id === id ? { ...i, status: "declined" } : i));
    setToast({ open: true, msg: "Invitation declined.", severity: "info" });
  };

  const toggleStep = (invId, stepId) => {
    setInvites(curr => curr.map(i => {
      if (i.id !== invId) return i;
      const steps = (i.training?.steps || []).map(s => s.id === stepId ? { ...s, done: !s.done } : s);
      const completed = steps.length > 0 && steps.every(s => s.done);
      return { ...i, training: { ...i.training, steps, completed } };
    }));
  };

  const markTrainingComplete = (invId) => {
    setInvites(curr => curr.map(i => i.id === invId
      ? { ...i, training: { ...(i.training||{}), completed: true, steps: (i.training?.steps||[]).map(s => ({...s, done: true})) } }
      : i
    ));
    setToast({ open: true, msg: "Training marked complete.", severity: "success" });
  };

  const canStart = (i) => {
    if (i.status !== "accepted") return false;
    if (!i.requiresTraining) return true;
    return !!i.training?.completed;
  };

  const PreviewDialog = () => {
    if (!preview) return null;
    const p = projectById[preview.projectId];
    return (
      <Dialog open onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Project preview</DialogTitle>
        <DialogContent dividers>
          <Typography variant="h6">{preview.projectName}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={preview.cognitiveLoad + " load"} />
            {preview.taskTypes.map(t => <Chip key={t} size="small" label={t} />)}
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            ≈ {centsToINR(preview.payPerTaskCents)}/task • ~{preview.avgMinutesPerTask} min/task
          </Typography>

          <Divider sx={{ my: 2 }} />

          {!p ? (
            <Typography variant="body2" color="text.secondary">
              Sample preview (no task data available in this demo).
            </Typography>
          ) : (
            <>
              <Typography variant="subtitle2">What you’ll do</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {p.description}
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Example tasks</Typography>
              {(p.tasks || []).slice(0, 2).map(t => (
                <Card key={t.id} variant="outlined" sx={{ my: 1 }}>
                  <CardContent>
                    <Typography variant="body2"><b>{t.title || t.type}</b></Typography>
                    {t.prompt && (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                        {t.prompt.slice(0, 200)}{t.prompt.length > 200 ? "…" : ""}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreview(null)}>Close</Button>
          <Button variant="contained" onClick={() => { setPreview(null); accept(preview.id); }}>
            Accept
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const TrainingDialog = () => {
    if (!training) return null;
    const i = invites.find(x => x.id === training) || null;
    if (!i) return null;
    const steps = i.training?.steps || [];

    const pct = steps.length ? Math.round(100 * steps.filter(s => s.done).length / steps.length) : (i.training?.completed ? 100 : 0);

    return (
      <Dialog open onClose={() => setTraining(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Training — {i.projectName}</DialogTitle>
        <DialogContent dividers>
          {steps.length > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Complete all steps below, then mark training complete to unlock tasks.
              </Typography>
              <LinearProgress variant="determinate" value={pct} sx={{ my: 2 }} />
              <Stack spacing={1}>
                {steps.map((s) => (
                  <Card key={s.id} variant="outlined">
                    <CardContent sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!s.done}
                            onChange={() => toggleStep(i.id, s.id)}
                          />
                        }
                        label={s.label}
                        sx={{ flex: 1, m: 0 }}
                      />
                      <Button size="small" onClick={() => toggleStep(i.id, s.id)}>
                        {s.done ? "Undo" : "Mark done"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No per-step training listed; you can mark training complete.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTraining(null)}>Close</Button>
          <Button variant="contained" onClick={() => { markTrainingComplete(i.id); }}>
            Mark training complete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const InviteCard = ({ inv }) => {
    const expiredLbl = timeLeftLabel(inv.expiresAt);
    const chips = (
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <Chip size="small" label={inv.cognitiveLoad + " load"} />
        {inv.taskTypes.map(t => <Chip key={t} size="small" label={t} />)}
        {inv.requiresTraining && <Chip size="small" color={inv.training?.completed ? "success" : "warning"} label={inv.training?.completed ? "Training done" : "Training required"} />}
        {inv.expired && <Chip size="small" color="error" label="Expired" />}
      </Stack>
    );

    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs:"column", md:"row" }} spacing={1} alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Invitation</Typography>
              <Typography variant="h6">{inv.projectName}</Typography>
              {chips}
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                ≈ {centsToINR(inv.payPerTaskCents)}/task • ~{inv.avgMinutesPerTask} min/task
              </Typography>
              <Typography variant="caption" color={inv.expired ? "error.main" : "text.secondary"} sx={{ display: "block", mt: 0.5 }}>
                {expiredLbl}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setPreview(inv)}>Preview</Button>
              <Button
                size="small"
                variant="contained"
                disabled={inv.expired}
                onClick={() => accept(inv.id)}
              >
                Accept
              </Button>
              <Button size="small" color="inherit" onClick={() => decline(inv.id)}>Decline</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const AcceptedRow = ({ inv }) => {
    const ready = canStart(inv);
    const p = projectById[inv.projectId];
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs:"column", md:"row" }} spacing={1} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Accepted</Typography>
              <Typography variant="h6">{inv.projectName}</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 0.5 }}>
                {inv.requiresTraining && (
                  <Chip
                    size="small"
                    color={inv.training?.completed ? "success" : "warning"}
                    label={inv.training?.completed ? "Training complete" : "Training required"}
                  />
                )}
                <Chip size="small" label={`≈ ${centsToINR(inv.payPerTaskCents)}/task`} />
              </Stack>
            </Box>
            {!inv.training?.completed && inv.requiresTraining && (
              <Button size="small" variant="outlined" onClick={() => setTraining(inv.id)}>
                Start training
              </Button>
            )}
            <Button
              size="small"
              variant="contained"
              disabled={!ready || !p}
              onClick={() => onOpenProject?.(inv.projectId)}
            >
              {p ? "Open project" : "Start (demo)"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Invites & Training</Typography>

      {/* Pending invites */}
      <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>Pending invitations</Typography>
      <Stack spacing={1.5}>
        {pending.length === 0 ? (
          <Card variant="outlined"><CardContent>
            <Typography variant="body2" color="text.secondary">No pending invitations.</Typography>
          </CardContent></Card>
        ) : pending.map(inv => <InviteCard key={inv.id} inv={{ ...inv, expired: false }} />)}
      </Stack>

      {/* Accepted */}
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>My accepted projects</Typography>
      <Stack spacing={1.5}>
        {accepted.length === 0 ? (
          <Card variant="outlined"><CardContent>
            <Typography variant="body2" color="text.secondary">You haven’t accepted any invitations yet.</Typography>
          </CardContent></Card>
        ) : accepted.map(inv => <AcceptedRow key={inv.id} inv={inv} />)}
      </Stack>

      {/* Expired & Declined (collapsed into a simple summary) */}
      {(expired.length > 0 || declined.length > 0) && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>History</Typography>
          <Grid container spacing={1.5}>
            {expired.map(inv => (
              <Grid key={inv.id} item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" color="error" label="Expired" />
                      <Typography variant="body2" sx={{ flex: 1 }}>{inv.projectName}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {declined.map(inv => (
              <Grid key={inv.id} item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label="Declined" />
                      <Typography variant="body2" sx={{ flex: 1 }}>{inv.projectName}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Dialogs */}
      <PreviewDialog />
      <TrainingDialog />

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