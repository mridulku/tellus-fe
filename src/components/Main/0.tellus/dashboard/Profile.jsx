import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Grid, TextField, Button, Paper, Stack,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableHead, TableRow, Divider, Tooltip
} from "@mui/material";

const ORG_KEY = "tellus.org.v1";
const PROFILE_KEY = "tellus.profile.v1";
const AUDIT_KEY = "tellus.audit.v1";

const ROLES = ["Org Admin", "Project Owner", "Viewer"];

export default function Profile() {
  // org policy drives whether user can toggle 2FA
  const org = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(ORG_KEY) || "{}"); } catch { return {}; }
  }, []);
  const allowUser2FA = !!org.allowUser2FA;
  const enforce2FA = !!org.enforce2FA;

  // profile
  const [profile, setProfile] = useState(() => {
    const fallback = { name: "Provider Admin", email: "admin@example.com", role: "Org Admin", twoFA: true };
    try { return { ...fallback, ...(JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}")) }; } catch { return fallback; }
  });

  const [form, setForm] = useState(profile);
  useEffect(()=>setForm(profile), [profile]);

  // Recent activity (audit log)
  const [audit, setAudit] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
  });
  useEffect(()=>localStorage.setItem(AUDIT_KEY, JSON.stringify(audit)), [audit]);

  const recentMine = useMemo(
    () => audit.filter(a => a.subject===profile.email || a.actor===profile.email).slice(0, 8),
    [audit, profile.email]
  );

  const handleSave = () => {
    const prev = profile;
    const next = { ...form };

    // Enforce org 2FA policy
    if (enforce2FA) next.twoFA = true;

    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);

    // Audit role change
    if (prev.role !== next.role) {
      setAudit(a => [
        { id: `al-${Date.now()}`, ts: new Date().toISOString(), actor: profile.email, action: "role_change", subject: profile.email, from: prev.role, to: next.role },
        ...a
      ]);
    }
  };

  const disabled2FA = !allowUser2FA || enforce2FA;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Your Profile</Typography>

      <Paper sx={{ p: 2, maxWidth: 720 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Name" value={form.name} onChange={(e)=>setForm(f=>({ ...f, name:e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Email" value={form.email} disabled />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={form.role}
                onChange={(e)=>setForm(f=>({ ...f, role:e.target.value }))}
              >
                {ROLES.map(r=><MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Tooltip title={enforce2FA ? "Org enforces 2FA for all users" : (!allowUser2FA ? "2FA toggle disabled by org" : "")}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enforce2FA ? true : !!form.twoFA}
                    onChange={(_,v)=>setForm(f=>({ ...f, twoFA: v }))}
                    disabled={disabled2FA}
                  />
                }
                label="Two-factor authentication (2FA)"
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={handleSave}>Save</Button>
              <Button onClick={()=>setForm(profile)}>Reset</Button>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" gutterBottom>Recent Activity</Typography>
        {recentMine.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No recent activity.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentMine.map(e=>(
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.ts).toLocaleString()}</TableCell>
                  <TableCell>{e.action}</TableCell>
                  <TableCell>{e.from || "—"}</TableCell>
                  <TableCell>{e.to || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Paper sx={{ p: 2, maxWidth: 720, mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Security</Typography>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {enforce2FA ? "Your org enforces 2FA for all members." :
             allowUser2FA ? "2FA is optional. We recommend leaving it on." :
             "Your org has disabled user-managed 2FA."}
          </Typography>
          <Button variant="outlined" onClick={()=>window.alert("2FA setup flow (demo).")}>Manage 2FA devices</Button>
        </Stack>
      </Paper>
    </Box>
  );
}