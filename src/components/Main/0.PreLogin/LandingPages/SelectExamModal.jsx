import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Paper, Typography
} from "@mui/material";
import { useDispatch } from "react-redux";
import { setExamType } from "../../../../store/examSlice";   // adjust path

const EXAMS = [
  "CBSE", "JEE Adv", "NEET", "SAT", "GATE",
  "CAT", "GRE", "TOEFL", "UPSC", "FRM"
];

export default function SelectExamModal({ open, onClose, userId }) {
  const dispatch = useDispatch();
  const [saving, setSaving] = useState(false);

  async function handlePick(exam) {
    try {
      setSaving(true);
      // 1  write to Redux
      dispatch(setExamType(exam));

      // 2  write to Firestore (or call your backend)
      await window.firebaseSetDoc(
        // helper you already use elsewhere, or call axios POST
        "users", userId, { examType: exam }, { merge: true }
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} fullWidth maxWidth="sm">
      <DialogTitle>Which exam are you preparing for?</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {EXAMS.map((ex) => (
            <Grid item xs={6} sm={4} key={ex}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark", color: "#fff" }
                }}
                onClick={() => handlePick(ex)}
              >
                <Typography variant="subtitle1">{ex}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}