import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Paper, Stack, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Divider, Grid, Switch, FormControlLabel, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions
} from "@mui/material";

const ORG_KEY = "tellus.org.v1";
const AUDIT_KEY = "tellus.audit.v1";

const DEFAULTS = {
  orgName: "Tellus Digital",
  billingEmail: "billing@example.com",
  dataRetentionDays: 90,
  allowUser2FA: true,      // allows user-level toggle
  enforce2FA: false,       // if true, users cannot disable 2FA
  defaultPolicyVersion: "v1",
  defaultDailyQuota: 50,
  integrations: { s3Bucket: "", webhookUrl: "" },
};

export default function OrgSettings() {
  const [org, setOrg] = useState(() => {
    try { return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(ORG_KEY) || "{}")) }; } catch { return DEFAULTS; }
  });
  const [form, setForm] = useState(org);
  useEffect(()=>setForm(org), [org]);

  const [audit, setAudit] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]"); } catch { return []; }
  });
  useEffect(()=>localStorage.setItem(AUDIT_KEY, JSON.stringify(audit)), [audit]);

  const users = useMemo(() => ([
    { name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
    { name: "Bob Smith", email: "bob@example.com", role: "Project Owner" },
  ]), []);

  const [confirmReset, setConfirmReset] = useState(false);

  const save = () => {
    // compute simple diff for audit
    const changes = diff(org, form);
    localStorage.setItem(ORG_KEY, JSON.stringify(form));
    setOrg(form);

    if (changes.length) {
      const now = new Date().toISOString();
      const entries = changes.map(ch => ({
        id: `al-${Date.now()}-${ch.field}`,
        ts: now,
        actor: "admin@example.com",
        action: "org_update",
        subject: "org",
        field: ch.field, from: String(ch.from ?? ""), to: String(ch.to ?? "")
      }));
      setAudit(a => [...entries, ...a]);
    }
  };

  const resetIntegrations = () => {
    const next = { ...form, integrations: { s3Bucket: "", webhookUrl: "" } };
    setForm(next);
    setConfirmReset(false);
    const now = new Date().toISOString();
    setAudit(a => [
      { id: `al-${Date.now()}-integrations`, ts: now, actor: "admin@example.com", action: "org_update", subject: "org", field: "integrations", from: "custom", to: "cleared" },
      ...a
    ]);
  };

  const downloadAudit = () => {
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "org_audit_log.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // enforce consistency: if enforce2FA true, allowUser2FA implicitly true
  useEffect(() => {
    if (form.enforce2FA && !form.allowUser2FA) {
      setForm(f => ({ ...f, allowUser2FA: true }));
    }
  }, [form.enforce2FA]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Organization Settings</Typography>

      {/* Org defaults */}
      <Paper sx={{ p: 2, maxWidth: 980, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Organization Name" fullWidth value={form.orgName} onChange={(e)=>setForm(f=>({ ...f, orgName:e.target.value }))} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="Billing Email" fullWidth value={form.billingEmail} onChange={(e)=>setForm(f=>({ ...f, billingEmail:e.target.value }))} />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Default Data Retention (days)"
              type="number" fullWidth
              value={form.dataRetentionDays}
              onChange={(e)=>setForm(f=>({ ...f, dataRetentionDays: +e.target.value }))}
              helperText="Applies to new projects; existing projects keep their retention."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Default Policy Version"
              fullWidth
              value={form.defaultPolicyVersion}
              onChange={(e)=>setForm(f=>({ ...f, defaultPolicyVersion: e.target.value }))}
              helperText="Used for new projects’ policy/version tag."
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Default Daily Quota / Annotator"
              type="number" fullWidth
              value={form.defaultDailyQuota}
              onChange={(e)=>setForm(f=>({ ...f, defaultDailyQuota: +e.target.value }))}
              helperText="Applied when assigning annotators to NEW projects."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={form.allowUser2FA} onChange={(_,v)=>setForm(f=>({ ...f, allowUser2FA: v }))} />}
              label="Allow users to manage their own 2FA"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tooltip title={form.enforce2FA ? "All users must have 2FA enabled" : ""}>
              <FormControlLabel
                control={<Switch checked={form.enforce2FA} onChange={(_,v)=>setForm(f=>({ ...f, enforce2FA: v }))} />}
                label="Enforce 2FA for all users"
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={save}>Save</Button>
              <Button onClick={()=>setForm(org)}>Reset</Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Integrations */}
      <Paper sx={{ p: 2, maxWidth: 980, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Integrations</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="S3 Bucket (exports)"
              fullWidth
              placeholder="s3://my-bucket/path"
              value={form.integrations.s3Bucket}
              onChange={(e)=>setForm(f=>({ ...f, integrations: { ...f.integrations, s3Bucket: e.target.value } }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Webhook URL (events)"
              fullWidth
              placeholder="https://example.com/webhook"
              value={form.integrations.webhookUrl}
              onChange={(e)=>setForm(f=>({ ...f, integrations: { ...f.integrations, webhookUrl: e.target.value } }))}
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={()=>window.alert("Tested (demo).")}>Test</Button>
              <Button color="warning" onClick={()=>setConfirmReset(true)}>Reset integrations…</Button>
            </Stack>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display:"block", mt: 1 }}>
          Changes here are versioned in the audit log. They apply to new jobs/exports going forward.
        </Typography>
      </Paper>

      {/* Users & Roles (readonly demo list) */}
      <Typography variant="h6" gutterBottom>Users & Roles</Typography>
      <TableContainer component={Paper} sx={{ maxWidth: 980, mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.email}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.role} color="primary" size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Org Audit Log */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>Audit Log</Typography>
        <Button size="small" onClick={downloadAudit}>Download JSON</Button>
      </Stack>
      <TableContainer component={Paper} sx={{ maxWidth: 980 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Field</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {audit.length === 0 ? (
              <TableRow><TableCell colSpan={5}>
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>No audit entries yet.</Typography>
              </TableCell></TableRow>
            ) : (
              audit.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.ts).toLocaleString()}</TableCell>
                  <TableCell>{e.actor || "—"}</TableCell>
                  <TableCell>{e.field || e.action}</TableCell>
                  <TableCell>{e.from || "—"}</TableCell>
                  <TableCell>{e.to || "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirm destructive action */}
      <Dialog open={confirmReset} onClose={()=>setConfirmReset(false)}>
        <DialogTitle>Reset integrations?</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            This clears the S3 and webhook settings. You can’t undo this, but you can re-enter values.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirmReset(false)}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={resetIntegrations}>Reset</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ---------------- helpers ---------------- */
function diff(prev, next, path = "") {
  const changes = [];
  const keys = new Set([...Object.keys(prev||{}), ...Object.keys(next||{})]);
  for (const k of keys) {
    const p = prev ? prev[k] : undefined;
    const n = next ? next[k] : undefined;
    const here = path ? `${path}.${k}` : k;

    if (typeof p === "object" && p !== null && typeof n === "object" && n !== null) {
      changes.push(...diff(p, n, here));
    } else if (String(p) !== String(n)) {
      changes.push({ field: here, from: p, to: n });
    }
  }
  return changes;
}