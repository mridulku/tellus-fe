import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, RadioGroup, FormControlLabel, Radio, TextField, Stack
} from "@mui/material";

const FLAG_REASONS = [
  "Ambiguous instructions",
  "Unsafe / policy risk",
  "Off-topic / wrong data",
  "UI or technical issue",
  "Other",
];

export default function FlagDialog({ open, onClose, onSubmit }) {
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
      <DialogTitle>Flag this task</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
            {FLAG_REASONS.map((r) => (
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
        <Button variant="contained" disabled={!reason} onClick={handleSubmit}>Submit flag</Button>
      </DialogActions>
    </Dialog>
  );
}