// src/components/Main/0.tellus/annotator/NotificationsPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Card, CardContent, Stack, Chip, Button, Divider,
  ToggleButton, ToggleButtonGroup, IconButton, Tooltip, Snackbar, Alert
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

const LS_KEY = "annotator.notifications.v1";

const seed = () => ([
  { id: "n1", ts: Date.now() - 1000 * 60 * 5,   type: "assignment", text: "New project invite: RM — Pairwise (accept by Oct 5)", read: false, critical: false },
  { id: "n2", ts: Date.now() - 1000 * 60 * 60,  type: "deadline",   text: "Task batch due in 6 hours", read: false, critical: true  },
  { id: "n3", ts: Date.now() - 1000 * 60 * 220, type: "export",     text: "Your export ‘Safety Eval C’ is ready", read: true,  critical: false },
  { id: "n4", ts: Date.now() - 1000 * 60 * 720, type: "flag",       text: "One of your items was flagged for review", read: false, critical: false },
]);

const typeColor = (t) => {
  switch (t) {
    case "assignment": return "primary";
    case "deadline": return "warning";
    case "flag": return "error";
    case "export": return "success";
    default: return "default";
  }
};

export default function NotificationsPanel() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unread | critical
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        const seeded = seed();
        setItems(seeded);
        localStorage.setItem(LS_KEY, JSON.stringify(seeded));
      }
    } catch {
      const seeded = seed();
      setItems(seeded);
    }
  }, []);

  const persist = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

  const filtered = useMemo(() => {
    switch (filter) {
      case "unread":   return items.filter(i => !i.read);
      case "critical": return items.filter(i => i.critical);
      default:         return items;
    }
  }, [items, filter]);

  const markRead = (id, v=true) => {
    setItems(prev => {
      const next = prev.map(i => i.id === id ? { ...i, read: v } : i);
      persist(next);
      return next;
    });
  };

  const markAllRead = () => {
    setItems(prev => {
      const next = prev.map(i => ({ ...i, read: true }));
      persist(next);
      return next;
    });
    setToast({ open: true, msg: "All notifications marked as read", severity: "success" });
  };

  const remove = (id) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id);
      persist(next);
      return next;
    });
  };

  const openItem = (it) => {
    // Deep link into the right spot. For the demo, just show an alert.
    window.alert(`Open source for: ${it.text}`);
    markRead(it.id, true);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Notifications</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems="center">
            <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="unread">Unread</ToggleButton>
              <ToggleButton value="critical">Critical</ToggleButton>
            </ToggleButtonGroup>
            <Stack direction="row" spacing={1} sx={{ ml: "auto" }}>
              <Button startIcon={<MarkEmailReadIcon />} onClick={markAllRead}>Mark all read</Button>
              <Button onClick={() => window.alert("Open Settings → Notification Preferences (demo).")}>Preferences</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.25}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No notifications here.</Typography>
        ) : filtered
          .sort((a,b) => b.ts - a.ts)
          .map((it) => (
          <Card key={it.id} variant="outlined" sx={{ borderLeft: "4px solid", borderLeftColor: it.critical ? "warning.main" : "divider" }}>
            <CardContent sx={{ py: 1.5 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }}>
                <Chip size="small" color={typeColor(it.type)} label={it.type} />
                <Typography variant="body2" sx={{ flex: 1 }}>{it.text}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(it.ts).toLocaleString()}</Typography>
                <Stack direction="row" spacing={0.5}>
                  {!it.read && (
                    <Tooltip title="Mark read">
                      <IconButton size="small" onClick={() => markRead(it.id, true)}>
                        <DoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Open">
                    <Button size="small" onClick={() => openItem(it)}>Open</Button>
                  </Tooltip>
                  <Tooltip title="Dismiss">
                    <IconButton size="small" onClick={() => remove(it.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Snackbar
        open={toast.open}
        autoHideDuration={1800}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
}