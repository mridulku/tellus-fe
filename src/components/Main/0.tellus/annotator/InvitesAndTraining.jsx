// src/components/Main/0.tellus/annotator/InvitesAndTraining.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Card, CardContent, Stack, Button,
  Grid, LinearProgress, Checkbox, FormControlLabel,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Divider
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
      tasksCount,
      status: "pending", // pending | accepted | declined
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

/* =========================
   Training Demo Modal
   ========================= */
function TrainingModal({ open, onClose, onCompleteStep, onCompleteAll }) {
  const [step, setStep] = useState(0); // 0: quickstart, 1: intro, 2: samples
  const [ackQuickstart, setAckQuickstart] = useState(false);
  const [ackIntro, setAckIntro] = useState(false);

  // Sample tasks
  const [sumText, setSumText] = useState("");
  const [sumAnswer, setSumAnswer] = useState("");
  const [rewriteAnswer, setRewriteAnswer] = useState("");

  const sumOk = sumAnswer.trim().length >= 30 && sumAnswer.trim().length <= 300;
  const rewriteOk = (() => {
    const orig = "Make this sentence polite: Shut up and go away.";
    const out = rewriteAnswer.trim();
    if (out.length < 15) return false;
    const lower = out.toLowerCase();
    const banned = ["shut up", "go away"];
    if (banned.some((w) => lower.includes(w))) return false;
    // simple heuristic: must include a polite phrase
    const polite = ["please", "could you", "would you", "kindly"];
    return polite.some((p) => lower.includes(p));
  })();
  const samplesDone = sumOk && rewriteOk;

  // small helper blocks
  const Quickstart = (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Quickstart (1 min)</Typography>
      <Divider sx={{ mb: 1 }} />
      <Typography variant="body2" sx={{ mb: 1 }}>
        • Read the prompt carefully. <br/>
        • Follow the style in “Sample input/output”. <br/>
        • Keep answers clear, safe, and concise. <br/>
        • If unsure, use the “Flag” button — it’s not a penalty. <br/>
        • Don’t paste from web or violate policy.
      </Typography>
      <FormControlLabel
        control={<Checkbox checked={ackQuickstart} onChange={(e)=>setAckQuickstart(e.target.checked)} />}
        label="I’ve read the quickstart"
      />
    </Box>
  );

  const Intro = (
    <Box>
      <Typography variant="subtitle1" gutterBottom>2-min intro (mock)</Typography>
      <Divider sx={{ mb: 1 }} />
      <Box sx={{ p: 2, border: "1px dashed #ccc", borderRadius: 1, textAlign: "center", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">[ Video placeholder ]</Typography>
        <Typography variant="caption" color="text.secondary">What good answers look like, how to flag, how payouts work.</Typography>
      </Box>
      <FormControlLabel
        control={<Checkbox checked={ackIntro} onChange={(e)=>setAckIntro(e.target.checked)} />}
        label="I watched the intro"
      />
    </Box>
  );

  const Samples = (
    <Box>
      <Typography variant="subtitle1" gutterBottom>Try 2 sample tasks (2–3 min)</Typography>
      <Divider sx={{ mb: 1 }} />
      {/* Sample 1: Summarize */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Task 1 — Summarize in one sentence (≈30–300 chars)
        </Typography>
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Paragraph</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {sumText || "Renewable energy is growing quickly as costs fall. Many countries use wind and solar to reduce emissions and dependence on fossil fuels."}
            </Typography>
          </CardContent>
        </Card>
        <TextField
          fullWidth multiline minRows={2}
          placeholder="Write a one-sentence summary…"
          value={sumAnswer}
          onChange={(e)=>setSumAnswer(e.target.value)}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip size="small" label={sumOk ? "Looks good" : "Needs 30–300 chars"} color={sumOk ? "success" : "default"} />
        </Stack>
      </Box>

      {/* Sample 2: Rewrite politely */}
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Task 2 — Rewrite politely
        </Typography>
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Make this sentence polite</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              Shut up and go away.
            </Typography>
          </CardContent>
        </Card>
        <TextField
          fullWidth
          placeholder="e.g., Could you please give me some space?"
          value={rewriteAnswer}
          onChange={(e)=>setRewriteAnswer(e.target.value)}
        />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip
            size="small"
            label={rewriteOk ? "Polite ✓" : "Avoid rude words; include a polite phrase"}
            color={rewriteOk ? "success" : "default"}
          />
        </Stack>
      </Box>
    </Box>
  );

  const nextDisabled = (
    (step === 0 && !ackQuickstart) ||
    (step === 1 && !ackIntro)
  );

  const handlePrimary = () => {
    if (step === 0 && ackQuickstart) {
      onCompleteStep?.("s1"); // mark quickstart done
      setStep(1);
    } else if (step === 1 && ackIntro) {
      onCompleteStep?.("s2"); // mark intro done
      setStep(2);
    } else if (step === 2 && samplesDone) {
      onCompleteStep?.("s3"); // mark samples done
      onCompleteAll?.();      // mark training complete
      onClose?.();
    }
  };

  const primaryLabel = step < 2 ? "Next" : "Finish";
  const primaryDisabled = (step < 2 ? nextDisabled : !samplesDone);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Training (demo)</DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          <Chip label={`Step ${step+1} of 3`} size="small" />
          {step === 0 && <Chip label="Quickstart" size="small" color="primary" />}
          {step === 1 && <Chip label="Intro" size="small" color="primary" />}
          {step === 2 && <Chip label="Samples" size="small" color="primary" />}
        </Stack>
        {step === 0 && Quickstart}
        {step === 1 && Intro}
        {step === 2 && Samples}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Close</Button>
        <Button variant="contained" onClick={handlePrimary} disabled={primaryDisabled}>{primaryLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---- Component ---------------------------------------------------------- */
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
  const markStepDone = (id) => {
    setTraining(curr => {
      const steps = curr.steps.map(s => s.id === id ? { ...s, done: true } : s);
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

  // Modal open state
  const [showTraining, setShowTraining] = useState(false);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Invites & Training</Typography>

      {/* 1) Mandatory training (global gate) */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1">Mandatory training</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Complete this short training to unlock project invitations.
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
            <Button variant="outlined" onClick={()=>setShowTraining(true)}>
              Open training demo
            </Button>
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

      {/* Training Modal */}
      <TrainingModal
        open={showTraining}
        onClose={()=>setShowTraining(false)}
        onCompleteStep={(id)=>markStepDone(id)}
        onCompleteAll={markTrainingComplete}
      />

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