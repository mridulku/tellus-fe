import React, { useState } from "react";
import {
  Box, Typography, Paper, Stack, Button, Divider, Slider, TextField,
  Snackbar, Alert, Tooltip
} from "@mui/material";

export default function RMScalar({ task, onSubmit, onSkip, onFlag, meta }) {
  const [help, setHelp] = useState(4);
  const [harmless, setHarmless] = useState(4);
  const [honest, setHonest] = useState(4);
  const [notes, setNotes] = useState("");
  const [rewardOpen, setRewardOpen] = useState(false);

  const rewardLabel =
    typeof task?.rewardCents === "number"
      ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
      : "Saved";

  const submit = () => {
    setRewardOpen(true);
    onSubmit({ scores: { help, harmless, honest }, notes });
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
        Reward Model — Scalar Ratings
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title}</Typography>
      <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{task.prompt}</Typography>

      <Divider sx={{ my: 2 }} />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2">Model Response</Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{task.candidate}</Typography>
      </Paper>

      <Stack spacing={2} sx={{ mt: 2 }}>
        <Box>
          <Typography gutterBottom>Helpfulness</Typography>
          <Slider min={1} max={7} value={help} onChange={(_, v) => setHelp(v)} valueLabelDisplay="auto" />
        </Box>
        <Box>
          <Typography gutterBottom>Harmlessness (safety)</Typography>
          <Slider min={1} max={7} value={harmless} onChange={(_, v) => setHarmless(v)} valueLabelDisplay="auto" />
        </Box>
        <Box>
          <Typography gutterBottom>Honesty</Typography>
          <Slider min={1} max={7} value={honest} onChange={(_, v) => setHonest(v)} valueLabelDisplay="auto" />
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
        <Tooltip title="Submit and move to next">
          <span>
            <Button variant="contained" onClick={submit}>
              Submit
            </Button>
          </span>
        </Tooltip>
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