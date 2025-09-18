import React, { useState } from "react";
import {
  Box, Typography, Paper, Stack, Button, Divider,
  FormGroup, FormControlLabel, Checkbox, Slider, TextField,
  Snackbar, Alert
} from "@mui/material";

export default function SafetyLabel({ task, onSubmit, onSkip, onFlag, meta }) {
  // task.content: string; task.categories: string[]; task.allowSeverity?: boolean
  const [selected, setSelected] = useState([]);
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState("");
  const [rewardOpen, setRewardOpen] = useState(false);

  const toggle = (cat) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const submit = () => {
    setRewardOpen(true);
    onSubmit({
      labels: selected,
      severity: task.allowSeverity ? severity : undefined,
      notes,
    });
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
        Safety / Policy Labeling
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title || "Label policy-relevant content"}</Typography>

      <Divider sx={{ my: 2 }} />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2">Content</Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
          {task.content}
        </Typography>
      </Paper>

      <Typography variant="subtitle2" sx={{ mt: 2 }}>Select categories</Typography>
      <FormGroup row sx={{ mt: 1 }}>
        {(task.categories || []).map((c) => (
          <FormControlLabel
            key={c}
            control={<Checkbox checked={selected.includes(c)} onChange={() => toggle(c)} />}
            label={c}
          />
        ))}
      </FormGroup>

      {task.allowSeverity && (
        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Severity</Typography>
          <Slider min={1} max={5} value={severity} onChange={(_, v) => setSeverity(v)} valueLabelDisplay="auto" />
        </Box>
      )}

      <TextField
        fullWidth
        multiline
        minRows={3}
        sx={{ mt: 2 }}
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={submit}
          disabled={selected.length === 0}
        >
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
        <Alert severity="success" variant="filled">
          {typeof task?.rewardCents === "number"
            ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
            : "Saved"}
        </Alert>
      </Snackbar>
    </Box>
  );
}