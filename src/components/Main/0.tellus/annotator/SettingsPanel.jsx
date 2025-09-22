// src/components/Main/0.tellus/annotator/SettingsPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Card, CardContent, CardActions, Grid, TextField,
  Select, MenuItem, FormControl, InputLabel, Stack, Divider, Button,
  Switch, FormControlLabel, Snackbar, Alert, Chip, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const LS_KEY = "annotator.settings.v1";

const DEFAULTS = {
  timezone: "Asia/Kolkata",
  quiet: { start: "22:00", end: "07:00" },
  unavailable: [], // ["2025-10-12", ...]
  capacityPerDay: 25,
  security: { emailVerified: true, twoFAEnabled: false },
  notifications: {
    channels: { inapp: true, email: true },
    digest: "none", // none | daily | weekly
    categories: {
      assignments: true,
      approvals: true,
      flags: true,
      exports: true,
      deadlines: true,
      system: true,
      critical: true, // enforced in-app
    }
  }
};

const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
];

export default function SettingsPanel() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [newDate, setNewDate] = useState("");
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  // Load / Save
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);
  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
    setToast({ open: true, msg: "Settings saved", severity: "success" });
  };
  const reset = () => {
    setSettings(DEFAULTS);
    setToast({ open: true, msg: "Settings reset to defaults", severity: "info" });
  };

  const addUnavailable = () => {
    if (!newDate) return;
    if (!settings.unavailable.includes(newDate)) {
      setSettings(s => ({ ...s, unavailable: [...s.unavailable, newDate] }));
    }
    setNewDate("");
  };
  const removeUnavailable = (d) =>
    setSettings(s => ({ ...s, unavailable: s.unavailable.filter(x => x !== d) }));

  const tzPreview = useMemo(() => {
    try {
      const fmt = new Intl.DateTimeFormat("en-US", { timeZone: settings.timezone, timeStyle: "short", dateStyle: "medium" });
      return fmt.format(new Date());
    } catch {
      return "";
    }
  }, [settings.timezone]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Settings</Typography>

      {/* Availability */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Availability</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control your time zone, quiet hours, and unavailable dates. These are used for notifications and planning nudges.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Time zone</InputLabel>
                <Select
                  label="Time zone"
                  value={settings.timezone}
                  onChange={(e) => setSettings(s => ({ ...s, timezone: e.target.value }))}
                >
                  {TIMEZONES.map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                </Select>
              </FormControl>
              {!!tzPreview && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: .5, display: "block" }}>
                  Local preview: {tzPreview}
                </Typography>
              )}
            </Grid>

            <Grid item xs={6} md={3}>
              <TextField
                label="Quiet hours (start)"
                type="time"
                fullWidth
                value={settings.quiet.start}
                onChange={(e) => setSettings(s => ({ ...s, quiet: { ...s.quiet, start: e.target.value } }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField
                label="Quiet hours (end)"
                type="time"
                fullWidth
                value={settings.quiet.end}
                onChange={(e) => setSettings(s => ({ ...s, quiet: { ...s.quiet, end: e.target.value } }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Add unavailable day"
                type="date"
                fullWidth
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button sx={{ mt: 1 }} onClick={addUnavailable} disabled={!newDate}>Add day</Button>
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {settings.unavailable.map((d) => (
                  <Chip
                    key={d}
                    label={d}
                    onDelete={() => removeUnavailable(d)}
                    deleteIcon={<DeleteIcon />}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Daily capacity (soft target)"
                type="number"
                fullWidth
                value={settings.capacityPerDay}
                onChange={(e) => setSettings(s => ({ ...s, capacityPerDay: Math.max(0, +e.target.value || 0) }))}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: .5, display: "block" }}>
                Used for “Today’s Plan” estimates; not a hard cap.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button onClick={reset}>Reset</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </CardActions>
      </Card>

      {/* Security */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Security</Typography>
          <Grid container spacing={2} sx={{ mt: .5 }}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email verification" value={settings.security.emailVerified ? "Verified" : "Not verified"} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.twoFAEnabled}
                    onChange={(e) => setSettings(s => ({ ...s, security: { ...s.security, twoFAEnabled: e.target.checked } }))}
                  />
                }
                label="Enable 2FA (TOTP/SMS)"
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={save}>Save</Button>
        </CardActions>
      </Card>

      {/* Notifications */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Notification Preferences</Typography>
          <Grid container spacing={2} sx={{ mt: .5 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Digest</InputLabel>
                <Select
                  label="Digest"
                  value={settings.notifications.digest}
                  onChange={(e) => setSettings(s => ({ ...s, notifications: { ...s.notifications, digest: e.target.value } }))}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.channels.inapp}
                    onChange={(e) => setSettings(s => ({ ...s, notifications: { ...s.notifications, channels: { ...s.notifications.channels, inapp: e.target.checked } } }))}
                  />
                }
                label="In-app notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.channels.email}
                    onChange={(e) => setSettings(s => ({ ...s, notifications: { ...s.notifications, channels: { ...s.notifications.channels, email: e.target.checked } } }))}
                  />
                }
                label="Email notifications"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ mb: .5 }}>Categories</Typography>
              {Object.entries(settings.notifications.categories).map(([k, v]) => (
                <FormControlLabel
                  key={k}
                  control={
                    <Switch
                      checked={!!v}
                      onChange={(e) =>
                        setSettings(s => ({
                          ...s,
                          notifications: {
                            ...s.notifications,
                            categories: { ...s.notifications.categories, [k]: e.target.checked }
                          }
                        }))
                      }
                    />
                  }
                  label={k.charAt(0).toUpperCase() + k.slice(1)}
                />
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                Critical alerts are always shown in-app.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={save}>Save</Button>
        </CardActions>
      </Card>

      {/* Privacy */}
      <Card>
        <CardContent>
          <Typography variant="h6">Privacy & Data</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You can export your profile & metrics, or request deletion. Requests are logged for compliance.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => window.alert("Export requested (demo).")}>Export my data</Button>
            <Button color="warning" onClick={() => window.alert("Deletion request submitted (demo).")}>Request deletion</Button>
          </Stack>
        </CardContent>
      </Card>

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