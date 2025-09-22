// src/components/Main/0.tellus/annotator/ProfilePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Card, CardContent, CardActions, Grid, TextField, Stack,
  Avatar, Button, Chip, Divider, Snackbar, Alert, Autocomplete
} from "@mui/material";

const LS_KEY = "annotator.profile.v1";
const ONB_KEY = "annotator.onboarding.v1";

const DEFAULT_PROFILE = {
  displayName: "Annotator",
  email: "annotator@example.com",
  role: "Annotator",
  languages: ["English (EN)"],
  skills: ["Writing"],
};

const LANGUAGE_OPTIONS = [
  "English (EN)", "Hindi (HI)", "Spanish (ES)", "French (FR)",
  "German (DE)", "Portuguese (PT)", "Japanese (JA)"
];

export default function ProfilePanel() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const onboarding = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(ONB_KEY) || "{}"); } catch { return {}; }
  }, []);

  const save = () => {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
    setToast({ open: true, msg: "Profile saved", severity: "success" });
  };

  // Derived avatar letter
  const letter = (profile.displayName || "A").slice(0, 1).toUpperCase();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Profile</Typography>

      {/* Identity */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Identity</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md="auto">
              <Avatar sx={{ width: 64, height: 64, bgcolor: "primary.main", fontSize: 28 }}>
                {letter}
              </Avatar>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Display name"
                value={profile.displayName}
                onChange={(e) => setProfile(p => ({ ...p, displayName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Email (read-only)" value={profile.email} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Role" value={profile.role} InputProps={{ readOnly: true }} />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={save}>Save</Button>
        </CardActions>
      </Card>

      {/* Preferences */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Preferences</Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={LANGUAGE_OPTIONS}
                value={profile.languages}
                onChange={(_, val) => setProfile(p => ({ ...p, languages: val }))}
                renderInput={(params) => <TextField {...params} label="Preferred language(s)" />}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .5 }}>
                Used to route more relevant tasks to you.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={profile.skills}
                onChange={(_, val) => setProfile(p => ({ ...p, skills: val }))}
                renderInput={(params) => <TextField {...params} label="Skills / Domains (free text)" placeholder="e.g., medical, legal, finance" />}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: .5 }}>
                Used for better project matching and recommendations.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Button variant="contained" onClick={save}>Save</Button>
        </CardActions>
      </Card>

      {/* Training & Onboarding */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6">Training & Onboarding</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Your current onboarding status:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Chip size="small" color={onboarding.emailVerified ? "success" : "default"} label={`Email ${onboarding.emailVerified ? "verified" : "pending"}`} />
            <Chip size="small" color={onboarding.profileCompleted ? "success" : "default"} label={`Profile ${onboarding.profileCompleted ? "complete" : "incomplete"}`} />
            <Chip size="small" color={onboarding.warmupDone ? "success" : "default"} label={`Warm-up ${onboarding.warmupDone ? "done" : "pending"}`} />
            <Chip size="small" color={onboarding.approved ? "success" : "default"} label={`Approval ${onboarding.approved ? "approved" : "pending"}`} />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1}>
            <Button onClick={() => window.alert("Open warm-up tasks (demo).")}>Resume training</Button>
            <Button onClick={() => window.alert("Open project guidelines (demo).")}>View project guide</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Earnings (lightweight summary for demo) */}
      <Card>
        <CardContent>
          <Typography variant="h6">Earnings (demo)</Typography>
          <Typography variant="body2" color="text.secondary">
            Today: ₹120.00 • This week: ₹540.00 • This month: ₹2,320.00
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button onClick={() => window.alert("Download CSV (demo).")}>Download CSV</Button>
            <Button onClick={() => window.alert("Configure payout method (demo).")}>Payout method</Button>
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