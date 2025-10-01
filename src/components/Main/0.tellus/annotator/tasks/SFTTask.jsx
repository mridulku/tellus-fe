// src/components/Main/0.tellus/annotator/tasks/SFTTask.jsx
import React, { useState } from "react";
import {
  Box, Typography, TextField, Stack, Button, Divider,
  Snackbar, Alert, Tooltip
} from "@mui/material";
import FlagDialog from "../common/FlagDialog";
import SkipDialog from "../common/SkipDialog";

/**
 * Unified SFT task.
 * task.type === "SFT"
 * task.sftMode: "PROMPT" | "AUTHOR_QA"
 *  - PROMPT: uses task.prompt
 *  - AUTHOR_QA: uses task.topic (optional), author question + answer
 */
export default function SFTTask({ task, onSubmit, onSkip, onFlag, meta }) {
  const mode = task?.sftMode || (task?.prompt ? "PROMPT" : "AUTHOR_QA");

  const [response, setResponse] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);

  // dialogs
  const [flagOpen, setFlagOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const openFlag = () => setFlagOpen(true);
  const openSkip = () => setSkipOpen(true);
  const handleFlagSubmit = (data) => { setFlagOpen(false); onFlag?.(data); };
  const handleSkipSubmit = (data) => { setSkipOpen(false); onSkip?.(data); };

  const rewardLabel =
    typeof task?.rewardCents === "number"
      ? `Saved • +₹${(task.rewardCents / 100).toFixed(2)}`
      : "Saved";

  const canSubmit =
    mode === "PROMPT"
      ? !!response.trim()
      : !!question.trim() && !!answer.trim();

  const handleSubmit = () => {
    setSnackOpen(true);
    if (mode === "PROMPT") onSubmit?.({ response });
    else onSubmit?.({ question, answer });
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

      {/* Policy / refusal hint (optional) */}
      {task?.policyHint && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {task.policyHint === "refusal_expected"
            ? "If the prompt is disallowed, provide a brief, polite refusal and suggest safer alternatives."
            : `Policy hint: ${String(task.policyHint).replace(/_/g, " ")}`}
        </Alert>
      )}
      {task?.refusalTemplate && !task?.policyHint && (
        <Alert severity="info" sx={{ mt: 1 }}>
          Refusal hint: {task.refusalTemplate}
        </Alert>
      )}

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
        {mode === "PROMPT" ? "SFT — Prompt → Response" : "SFT — Author Q&A"}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5 }}>{task.title}</Typography>

      {/* MODE: PROMPT */}
      {mode === "PROMPT" && (
        <>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
            {task.prompt}
          </Typography>
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
        </>
      )}

      {/* MODE: AUTHOR_QA */}
      {mode === "AUTHOR_QA" && (
        <>
          {task.topic && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Topic: {task.topic}
            </Typography>
          )}
          {task.instructions && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Instructions</Typography>
              <Typography variant="body2" color="text.secondary">{task.instructions}</Typography>
            </>
          )}
          <TextField
            fullWidth
            sx={{ mt: 2 }}
            label="Write a good question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            minRows={4}
            sx={{ mt: 2 }}
            label="Write the ideal answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Tooltip title="Submit and move to next">
          <span>
            <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
              Submit
            </Button>
          </span>
        </Tooltip>
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

      <Snackbar
        open={snackOpen}
        autoHideDuration={1200}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled">{rewardLabel}</Alert>
      </Snackbar>
    </Box>
  );
}