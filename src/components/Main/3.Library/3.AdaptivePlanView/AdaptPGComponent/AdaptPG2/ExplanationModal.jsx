// File: ExplanationModal.jsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";

export default function ExplanationModal({ open, onClose, title, logs }) {
  if (!logs || logs.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          <Typography variant="body2">No logs found.</Typography>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={onClose} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
        {logs.map((log, idx) => (
          <Box key={idx} sx={{ mb: 3, borderBottom: "1px solid #444", pb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>API:</strong> {log.usedApi}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Request Params:</strong>
            </Typography>
            <pre style={{ color: "#0f0", fontSize: "0.8rem" }}>
              {JSON.stringify(log.requestPayload, null, 2)}
            </pre>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Response Payload:</strong>
            </Typography>
            <pre style={{ color: "#0f0", fontSize: "0.8rem" }}>
              {JSON.stringify(log.responsePayload, null, 2)}
            </pre>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Logic:</strong> {log.logic}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Possible Values:</strong> {log.possibleValues}
            </Typography>
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ backgroundColor: "#222" }}>
        <Button onClick={onClose} variant="contained" color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}