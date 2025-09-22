import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  Slider,
  TextField,
  Snackbar,
  Alert
} from "@mui/material";

import FlagDialog from "../common/FlagDialog";
import SkipDialog from "../common/SkipDialog";

export default function RMScalar({ task, onSubmit, onSkip, onFlag, meta }) {
  const [help, setHelp] = useState(4);
  const [harmless, setHarmless] = useState(4);
  const [honest, setHonest] = useState(4);
  const [notes, setNotes] = useState("");

  // unified snackbar
  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    text:
      typeof task?.rewardCents === "number"
        ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
        : "Saved",
  });

  // dialogs
  const [flagOpen, setFlagOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);

  const doSubmit = () => {
    onSubmit({ scores: { help, harmless, honest }, notes });
    setSnack((s) => ({ ...s, open: true }));
  };

  const openFlag = () => setFlagOpen(true);
  const openSkip = () => setSkipOpen(true);

  const handleFlagSubmit = (data) => {
    setFlagOpen(false);
    // data: { reason, notes }
    onFlag?.(data);
  };
  const handleSkipSubmit = (data) => {
    setSkipOpen(false);
    // data: { reason, notes }
    onSkip?.(data);
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

      {/* Contextual policy / refusal hint */}
      {task?.policyHint && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {task.policyHint === "refusal_expected"
            ? "Refusal expected: rate responses that politely refuse unsafe requests higher than unsafe compliance."
            : `Policy hint: ${String(task.policyHint).replace(/_/g, " ")}`}
        </Alert>
      )}
      {task?.refusalTemplate && !task?.policyHint && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Refusal hint: {task.refusalTemplate}
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
        Reward Model — Scalar Ratings
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title}</Typography>
      <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
        {task.prompt}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2">Model Response</Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          {task.candidate}
        </Typography>
      </Paper>

      <Stack spacing={2} sx={{ mt: 2 }}>
        <Box>
          <Typography gutterBottom>Helpfulness</Typography>
          <Slider
            min={1}
            max={7}
            value={help}
            onChange={(_, v) => setHelp(v)}
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Typography gutterBottom>Harmlessness (safety)</Typography>
          <Slider
            min={1}
            max={7}
            value={harmless}
            onChange={(_, v) => setHarmless(v)}
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Typography gutterBottom>Honesty</Typography>
          <Slider
            min={1}
            max={7}
            value={honest}
            onChange={(_, v) => setHonest(v)}
            valueLabelDisplay="auto"
          />
        </Box>
      </Stack>

      <TextField
        fullWidth
        multiline
        minRows={3}
        label="Notes (optional)"
        sx={{ mt: 2 }}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={doSubmit}>
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

      {/* snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={1400}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}