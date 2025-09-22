import React, { useState } from "react";
import {
  Box, Typography, Paper, Stack, Button, Divider,
  RadioGroup, FormControlLabel, Radio, TextField, Alert, Snackbar
} from "@mui/material";

import FlagDialog from "../common/FlagDialog";
import SkipDialog from "../common/SkipDialog";

export default function RMPairwise({
  task,
  adversarialMode = false,
  onSubmit,
  onSkip,
  onFlag,
  meta
}) {
  const [choice, setChoice] = useState("");
  const [attack, setAttack] = useState("");      // used when adversarial
  const [justification, setJustification] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);

  // local gold toast to avoid double toasts with TaskPlayer
  const [goldSnack, setGoldSnack] = useState({ open: false, pass: null });

  const submit = () => {
    const payload = adversarialMode
      ? { attack, preferred: choice, justification: justification || undefined }
      : { preferred: choice, justification: justification || undefined };

    // optional component-local calibration feedback for pairwise
    if (task?.isGold && task?.gold?.expected?.preferred) {
      const pass = payload.preferred === task.gold.expected.preferred;
      setGoldSnack({ open: true, pass });
    }

    setSnackOpen(true);
    onSubmit(payload);
  };

  // dialogs
  const [flagOpen, setFlagOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const openFlag = () => setFlagOpen(true);
  const openSkip = () => setSkipOpen(true);
  const handleFlagSubmit = (data) => { setFlagOpen(false); onFlag?.(data); };
  const handleSkipSubmit = (data) => { setSkipOpen(false); onSkip?.(data); };

  return (
    <Box>
      {meta && (
        <Typography variant="caption" color="text.secondary">
          Task {meta.index + 1}/{meta.total}
          {typeof meta?.project?.payPerTaskCents === "number" && (
            <> • Earns +₹{(meta.project.payPerTaskCents / 100).toFixed(2)}</>
          )}
        </Typography>
      )}

      {/* Policy / refusal hint */}
      {task?.policyHint && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {task.policyHint === "refusal_expected"
            ? "Refusal expected: prefer safe refusals over unsafe compliance."
            : `Policy hint: ${String(task.policyHint).replace(/_/g, " ")}`}
        </Alert>
      )}
      {task?.refusalTemplate && !task?.policyHint && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Refusal hint: {task.refusalTemplate}
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
        Reward Model — Pairwise{adversarialMode ? " (Adversarial)" : ""}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title || "Which is better?"}</Typography>
      {task.prompt && (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{task.prompt}</Typography>
      )}

      {adversarialMode && (
        <>
          <Divider sx={{ my: 2 }} />
          <Alert severity="info" sx={{ mb: 2 }}>
            Your goal is to probe for unsafe or policy-breaking behavior. Use creative strategies (roleplay,
            obfuscation, indirect requests) but do not write actionable harmful content yourself.
          </Alert>
          <TextField
            multiline
            minRows={3}
            fullWidth
            label="Your adversarial prompt / strategy"
            value={attack}
            onChange={(e) => setAttack(e.target.value)}
            placeholder="Describe the probing prompt or strategy you applied."
          />
        </>
      )}

      <Divider sx={{ my: 2 }} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2">Response A</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{task.candidates.A}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, flex: 1 }}>
          <Typography variant="subtitle2">Response B</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{task.candidates.B}</Typography>
        </Paper>
      </Stack>

      <RadioGroup sx={{ mt: 2 }} value={choice} onChange={(e) => setChoice(e.target.value)}>
        <FormControlLabel value="A" control={<Radio />} label={adversarialMode ? "A is more harmful" : "Prefer A"} />
        <FormControlLabel value="B" control={<Radio />} label={adversarialMode ? "B is more harmful" : "Prefer B"} />
        <FormControlLabel value="tie" control={<Radio />} label="Tie / equally good (or safe)" />
      </RadioGroup>

      {task?.requireJustification && (
        <TextField
          fullWidth
          multiline
          minRows={2}
          sx={{ mt: 2 }}
          label="Brief justification (optional unless required)"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" disabled={!choice} onClick={submit}>
          Submit
        </Button>
        <Button onClick={openSkip}>Skip</Button>
        <Button color="warning" onClick={openFlag}>Flag</Button>
      </Stack>

      {/* dialogs */}
      <FlagDialog
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        onSubmit={handleFlagSubmit}
        defaultReason="content_issue"
      />
      <SkipDialog
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        onSubmit={handleSkipSubmit}
        defaultReason="unclear"
      />

      {/* submit toast */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={1200}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">
          {typeof task?.rewardCents === "number"
            ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
            : "Saved"}
        </Alert>
      </Snackbar>

      {/* gold toast */}
      <Snackbar
        open={goldSnack.open}
        autoHideDuration={1400}
        onClose={() => setGoldSnack({ open: false, pass: null })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {goldSnack.pass === true ? (
          <Alert severity="success" variant="filled">Calibration: Correct ✔</Alert>
        ) : (
          <Alert severity="error" variant="filled">Calibration: Incorrect ✖</Alert>
        )}
      </Snackbar>
    </Box>
  );
}