import React, { useState } from "react";
import {
  Box, Typography, TextField, Stack, Button, Divider,
  Snackbar, Alert, Tooltip
} from "@mui/material";

export default function SFTPrompt({ task, onSubmit, onSkip, onFlag, meta }) {
  const [response, setResponse] = useState("");
  const [rewardOpen, setRewardOpen] = useState(false);

  const rewardLabel =
    typeof task?.rewardCents === "number"
      ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
      : "Saved";

  const handleSubmit = () => {
    setRewardOpen(true);
    onSubmit({ response });
  };

  return (
    <Box>
      {/* Micro progress (optional) */}
      {meta && (
        <Typography variant="caption" color="text.secondary">
          Task {meta.index + 1}/{meta.total}
          {typeof meta?.project?.payPerTaskCents === "number" && (
            <> • Earns +₹{(meta.project.payPerTaskCents / 100).toFixed(2)}</>
          )}
        </Typography>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
        SFT — Prompt → Response
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title}</Typography>
      <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>{task.prompt}</Typography>

      {task.instructions && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2">Instructions</Typography>
          <Typography variant="body2" color="text.secondary">{task.instructions}</Typography>
        </>
      )}

      <TextField
        multiline
        minRows={6}
        fullWidth
        sx={{ mt: 2 }}
        label="Your response"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Tooltip title="Submit and move to next">
          <span>
            <Button variant="contained" onClick={handleSubmit} disabled={!response.trim()}>
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