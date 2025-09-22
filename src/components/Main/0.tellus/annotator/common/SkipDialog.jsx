import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, RadioGroup, FormControlLabel, Radio, TextField, Stack
} from "@mui/material";

const SKIP_REASONS = [
  "Not enough time",
  "Not confident / out of expertise",
  "Content uncomfortable",
  "Language mismatch",
  "Other",
];

export default function SkipDialog({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const handleClose = () => {
    setReason("");
    setNotes("");
    onClose?.();
  };

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit?.({ reason, notes: notes.trim() || undefined });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Skip this task</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
            {SKIP_REASONS.map((r) => (
              <FormControlLabel key={r} value={r} control={<Radio />} label={r} />
            ))}
          </RadioGroup>
          <TextField
            label="Notes (optional)"
            multiline
            minRows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" disabled={!reason} onClick={handleSubmit}>Confirm skip</Button>
      </DialogActions>
    </Dialog>
  );
}