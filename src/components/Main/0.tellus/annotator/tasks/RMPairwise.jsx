import React, { useState } from "react";
import {
  Box, Typography, Paper, Stack, Button, Divider,
  RadioGroup, FormControlLabel, Radio, TextField, Alert,
  Snackbar
} from "@mui/material";

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
  const [rewardOpen, setRewardOpen] = useState(false);

  const rewardLabel =
    typeof task?.rewardCents === "number"
      ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
      : "Saved";

  const submit = () => {
    setRewardOpen(true);
    const payload = adversarialMode
      ? { attack, preferred: choice, justification: justification || undefined }
      : { preferred: choice, justification: justification || undefined };
    onSubmit(payload);
  };

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
        <Button onClick={onSkip}>Skip</Button>
        <Button color="warning" onClick={onFlag}>Flag</Button>
      </Stack>

      <Snackbar
        open={rewardOpen}
        autoHideDuration={1200}
        onClose={() => setRewardOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">{rewardLabel}</Alert>
      </Snackbar>
    </Box>
  );
}