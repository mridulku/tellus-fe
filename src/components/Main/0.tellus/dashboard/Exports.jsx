// src/components/Main/0.tellus/dashboard/Exports.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel, TextField, LinearProgress,
  Tooltip, IconButton, Divider, RadioGroup, FormControlLabel, Radio, Alert
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CancelIcon from "@mui/icons-material/Cancel";
import HistoryIcon from "@mui/icons-material/History";
import LinkIcon from "@mui/icons-material/Link";

import { PROVIDER_PROJECTS } from "./data/providerSampleData";

const LS_KEY = "tellus.exports.history.v1";

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function summarizeFilters(f) {
  const bits = [];
  if (f.type && f.type !== "all") bits.push(`type=${f.type}`);
  if (f.status && f.status !== "all") bits.push(`status=${f.status}`);
  if (f.from) bits.push(`from=${f.from}`);
  if (f.to) bits.push(`to=${f.to}`);
  if (!bits.length) return "none";
  return bits.join(", ");
}

export default function Exports({ onOpenProject }) {
  const projects = PROVIDER_PROJECTS || [];
  const completed = useMemo(() => projects.filter(p => p.status === "Completed"), [projects]);

  /* ───────────── History (audit trail) persisted to localStorage ───────────── */
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem(LS_KEY, JSON.stringify(history)); }, [history]);

  /* ───────────── New export dialog state ───────────── */
  const [openNew, setOpenNew] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null); // a history row

  const [form, setForm] = useState({
    projectId: "",
    version: "current",
    preset: "none",
    filters: { type: "all", status: "all", from: "", to: "" },
    format: "JSONL",
    destination: "download", // download | webhook
    webhookUrl: "",
    requestedBy: "Demo User",
  });

  const formValid = useMemo(() => {
    if (!form.projectId) return false;
    if (form.destination === "webhook" && !/^https?:\/\//i.test(form.webhookUrl.trim())) return false;
    return true;
  }, [form]);

  const selectedProject = useMemo(
    () => projects.find(p => String(p.id) === String(form.projectId)),
    [projects, form.projectId]
  );

  /* Apply presets */
  const applyPreset = (preset) => {
    let f = { ...form.filters };
    if (preset === "accepted") f = { ...f, status: "accepted" };
    if (preset === "flagged") f = { ...f, status: "flagged" };
    if (preset === "last7") {
      const to = new Date(); // today
      const from = new Date(Date.now() - 7*24*60*60*1000);
      f = { ...f, from: toISODate(from), to: toISODate(to) };
    }
    setForm(s => ({ ...s, preset, filters: f }));
  };

  const toISODate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  /* ───────────── Simulated job runner ───────────── */
  const timersRef = useRef({}); // jobId -> interval

  const startExport = () => {
    // create job
    const proj = projects.find(p => String(p.id) === String(form.projectId));
    const jobId = `job_${Date.now()}`;
    const job = {
      id: jobId,
      startedAt: new Date().toISOString(),
      requestedBy: form.requestedBy || "Demo User",
      projectId: proj?.id,
      projectName: proj?.name || "(unknown)",
      projectType: proj?.type || "",
      version: form.version || "current",
      filters: { ...form.filters },
      format: form.format,
      destination: form.destination,
      webhookUrl: form.destination === "webhook" ? form.webhookUrl.trim() : "",
      status: "Running",
      progress: 0,
      sizeBytes: null,
      message: "",
    };
    setHistory(h => [job, ...h]);
    setOpenNew(false);

    // simulate progress
    timersRef.current[jobId] = setInterval(() => {
      setHistory(h => h.map(row => {
        if (row.id !== jobId) return row;
        const next = Math.min(100, row.progress + Math.random() * 18 + 6);
        const status = next >= 100 ? "Finalizing" : "Running";
        return { ...row, progress: next, status };
      }));
    }, 600);
  };

  // finalize & produce file
  useEffect(() => {
    // watch for jobs that hit "Finalizing" and complete them
    const running = history.filter(h => h.status === "Finalizing");
    running.forEach(job => {
      // clear interval once
      const t = timersRef.current[job.id];
      if (t) { clearInterval(t); delete timersRef.current[job.id]; }

      // produce a tiny demo payload based on format
      const payload = makeDemoPayload(job);
      const blob = new Blob([payload.content], { type: job.format === "CSV" ? "text/csv" : "application/x-ndjson" });
      const sizeBytes = payload.content.length;

      // simulate webhook vs download
      if (job.destination === "download") {
        const filename = `${slug(job.projectName)}_${job.version}_${Date.now()}.${job.format === "CSV" ? "csv" : "jsonl"}`;
        triggerDownload(blob, filename);
      }
      // webhook case: simulate success (no network call in demo)
      setHistory(h => h.map(r => r.id === job.id
        ? { ...r, status: "Completed", progress: 100, sizeBytes, message: job.destination === "webhook" ? "Sent to webhook (simulated)" : "Downloaded" }
        : r
      ));
    });
  }, [history]);

  const cancelJob = (jobId) => {
    const t = timersRef.current[jobId];
    if (t) { clearInterval(t); delete timersRef.current[jobId]; }
    setHistory(h => h.map(r => r.id === jobId ? ({ ...r, status: "Canceled", message: "Canceled by user" }) : r));
  };

  const rerunJob = (row) => {
    // prefill dialog with old row and open
    setForm({
      projectId: String(row.projectId),
      version: row.version || "current",
      preset: "none",
      filters: { ...row.filters },
      format: row.format,
      destination: row.destination,
      webhookUrl: row.webhookUrl || "",
      requestedBy: row.requestedBy || "Demo User",
    });
    setOpenNew(true);
  };

  const clearHistory = () => {
    // keep in-flight jobs
    setHistory(h => h.filter(x => x.status === "Running" || x.status === "Finalizing"));
  };

  /* ───────────── UI ───────────── */
  return (
    <Box>
      <Stack direction={{ xs:"column", md:"row" }} spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flex: 1 }}>Exports</Typography>
        <Tooltip title="Start a new export">
          <span>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpenNew(true); }}>
              New Export
            </Button>
          </span>
        </Tooltip>
        <Tooltip title="View schema & formats">
          <span>
            <Button variant="outlined" startIcon={<InfoOutlinedIcon />} onClick={() => setSchemaOpen(true)}>
              Schema
            </Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Completed projects (quick start) */}
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Completed projects</Typography>
      {completed.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No completed projects yet. You can still export partial data from a project’s Data/Responses tab.
        </Alert>
      ) : (
        <Table size="small" sx={{ mb: 3 }}>
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Quick Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {completed.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.type}{p.subtype ? ` • ${p.subtype}` : ""}</TableCell>
                <TableCell>{p.progress?.completion ?? 100}%</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => onOpenProject?.(p.id)} startIcon={<OpenInNewIcon />}>
                      Open
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={() => {
                        // prefill and start immediately with defaults
                        setForm(s => ({ ...s, projectId: String(p.id), version: "current", preset: "none", filters: { type:"all", status:"all", from:"", to:"" }, format: "JSONL", destination: "download", webhookUrl:"" }));
                        // slight delay so form state settles before start
                        setTimeout(startExport, 0);
                      }}
                    >
                      Export (JSONL)
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* History & logs */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <HistoryIcon fontSize="small" />
        <Typography variant="subtitle1">Export history & logs</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Clear completed logs (keeps running jobs)">
          <span>
            <Button size="small" onClick={clearHistory}>Clear Logs</Button>
          </span>
        </Tooltip>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Started</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Version</TableCell>
            <TableCell>Filters</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Dest</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Size</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.length === 0 && (
            <TableRow>
              <TableCell colSpan={9}>
                <Typography variant="body2" color="text.secondary">No exports yet.</Typography>
              </TableCell>
            </TableRow>
          )}
          {history.map(row => (
            <TableRow key={row.id} hover>
              <TableCell>{new Date(row.startedAt).toLocaleString()}</TableCell>
              <TableCell>
                <Stack spacing={0.25}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.projectName}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.projectType}</Typography>
                </Stack>
              </TableCell>
              <TableCell>{row.version}</TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary" noWrap title={summarizeFilters(row.filters)}>
                  {summarizeFilters(row.filters)}
                </Typography>
              </TableCell>
              <TableCell>{row.format}</TableCell>
              <TableCell>
                {row.destination === "download"
                  ? <Chip size="small" label="Download" />
                  : <Stack direction="row" alignItems="center" spacing={0.5}><Chip size="small" label="Webhook" /><LinkIcon fontSize="inherit" /></Stack>}
              </TableCell>
              <TableCell sx={{ minWidth: 180 }}>
                {row.status === "Running" || row.status === "Finalizing" ? (
                  <Stack spacing={0.5}>
                    <LinearProgress variant="determinate" value={Math.min(100, row.progress || 0)} />
                    <Typography variant="caption" color="text.secondary">{row.status}…</Typography>
                  </Stack>
                ) : (
                  <Typography variant="body2">{row.status}{row.message ? ` — ${row.message}` : ""}</Typography>
                )}
              </TableCell>
              <TableCell>
                {row.sizeBytes != null ? `${(row.sizeBytes/1024).toFixed(1)} KB` : "—"}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Open project">
                    <span>
                      <IconButton size="small" onClick={() => onOpenProject?.(row.projectId)}><OpenInNewIcon fontSize="small" /></IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Details">
                    <span>
                      <IconButton size="small" onClick={() => setDetailOpen(row)}><InfoOutlinedIcon fontSize="small" /></IconButton>
                    </span>
                  </Tooltip>
                  {(row.status === "Completed") && (
                    <Tooltip title="Re-run with same settings">
                      <span>
                        <IconButton size="small" onClick={() => rerunJob(row)}><ReplayIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                  )}
                  {(row.status === "Running" || row.status === "Finalizing") ? (
                    <Tooltip title="Cancel export">
                      <span>
                        <IconButton size="small" color="error" onClick={() => cancelJob(row.id)}><CancelIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                  ) : null}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* New export dialog */}
      <Dialog open={openNew} onClose={() => setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start a new export</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                label="Project"
                value={form.projectId}
                onChange={(e) => setForm(s => ({ ...s, projectId: e.target.value }))}
              >
                {projects.map(p => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs:"column", sm:"row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Version</InputLabel>
                <Select
                  label="Version"
                  value={form.version}
                  onChange={(e) => setForm(s => ({ ...s, version: e.target.value }))}
                >
                  <MenuItem value="current">Current</MenuItem>
                  <MenuItem value="v1">v1</MenuItem>
                  <MenuItem value="v2">v2</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Preset</InputLabel>
                <Select
                  label="Preset"
                  value={form.preset}
                  onChange={(e) => applyPreset(e.target.value)}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="accepted">Accepted only</MenuItem>
                  <MenuItem value="flagged">Flagged only</MenuItem>
                  <MenuItem value="last7">Last 7 days</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Divider />

            <Typography variant="subtitle2">Filters</Typography>
            <Stack direction={{ xs:"column", sm:"row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  value={form.filters.type}
                  onChange={(e) => setForm(s => ({ ...s, filters: { ...s.filters, type: e.target.value } }))}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="sft">SFT</MenuItem>
                  <MenuItem value="pairwise">Pairwise</MenuItem>
                  <MenuItem value="dialogue">Dialogue</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  value={form.filters.status}
                  onChange={(e) => setForm(s => ({ ...s, filters: { ...s.filters, status: e.target.value } }))}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="flagged">Flagged</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Stack direction={{ xs:"column", sm:"row" }} spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="From"
                InputLabelProps={{ shrink: true }}
                value={form.filters.from}
                onChange={(e) => setForm(s => ({ ...s, filters: { ...s.filters, from: e.target.value } }))}
              />
              <TextField
                fullWidth
                type="date"
                label="To"
                InputLabelProps={{ shrink: true }}
                value={form.filters.to}
                onChange={(e) => setForm(s => ({ ...s, filters: { ...s.filters, to: e.target.value } }))}
              />
            </Stack>

            <Divider />

            <Typography variant="subtitle2">Format</Typography>
            <RadioGroup
              row
              value={form.format}
              onChange={(e) => setForm(s => ({ ...s, format: e.target.value }))}
            >
              <FormControlLabel value="JSONL" control={<Radio />} label="JSONL" />
              <FormControlLabel value="CSV" control={<Radio />} label="CSV" />
            </RadioGroup>

            <Stack direction={{ xs:"column", sm:"row" }} spacing={2} alignItems="center">
              <Typography variant="subtitle2" sx={{ minWidth: 100 }}>Destination</Typography>
              <RadioGroup
                row
                value={form.destination}
                onChange={(e) => setForm(s => ({ ...s, destination: e.target.value }))}
              >
                <FormControlLabel value="download" control={<Radio />} label="Browser download" />
                <FormControlLabel value="webhook" control={<Radio />} label="Webhook" />
              </RadioGroup>
            </Stack>
            {form.destination === "webhook" && (
              <TextField
                fullWidth
                label="Webhook URL"
                placeholder="https://example.com/webhook"
                value={form.webhookUrl}
                onChange={(e) => setForm(s => ({ ...s, webhookUrl: e.target.value }))}
              />
            )}

            <Stack direction="row" spacing={1} alignItems="center">
              <InfoOutlinedIcon fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Need the schema? Click <Button size="small" onClick={()=>setSchemaOpen(true)}>Schema</Button>.
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNew(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} disabled={!formValid} onClick={startExport}>
            Start Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schema dialog */}
      <Dialog open={schemaOpen} onClose={() => setSchemaOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export schema & examples</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>JSONL (preferred)</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", bgcolor: "grey.100", p: 1, borderRadius: 1 }}>
{`// SFT
{"id":"item-1","type":"sft","prompt":"...","response":"...","annotatorId":"a1","status":"accepted","ts":"2025-01-01T10:00:00Z"}
// Pairwise
{"id":"item-2","type":"pairwise","prompt":"...","A":"answer A","B":"answer B","choice":"A","notes":"...","annotatorId":"a2","status":"accepted","ts":"2025-01-02T11:00:00Z"}
// Dialogue
{"id":"item-3","type":"dialogue","transcript":[{"role":"user","text":"..."},{"role":"assistant","text":"..."}],"ratings":[{"turn":2,"help":4,"harmless":5}],"annotatorId":"a3","status":"flagged","ts":"2025-01-03T12:00:00Z"}`}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>CSV</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", bgcolor: "grey.100", p: 1, borderRadius: 1 }}>
{`id,type,prompt,response,choice,annotatorId,status,ts
"item-1","sft","...","...","","a1","accepted","2025-01-01T10:00:00Z"
"item-2","pairwise","...","","A","a2","accepted","2025-01-02T11:00:00Z"`}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary">
            Fields may vary by project type. Use JSONL for rich structures (e.g., dialogues, per-turn ratings).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSchemaOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Row details */}
      <Dialog open={!!detailOpen} onClose={() => setDetailOpen(null)} maxWidth="sm" fullWidth>
        {detailOpen && (
          <>
            <DialogTitle>Export details</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={1}>
                <Row label="Started" value={new Date(detailOpen.startedAt).toLocaleString()} />
                <Row label="Requested by" value={detailOpen.requestedBy} />
                <Row label="Project" value={detailOpen.projectName} />
                <Row label="Version" value={detailOpen.version} />
                <Row label="Type" value={detailOpen.projectType} />
                <Row label="Filters" value={summarizeFilters(detailOpen.filters)} />
                <Row label="Format" value={detailOpen.format} />
                <Row label="Destination" value={detailOpen.destination === "download" ? "Browser download" : `Webhook: ${detailOpen.webhookUrl || ""}`} />
                <Row label="Status" value={detailOpen.status} />
                <Row label="Message" value={detailOpen.message || "—"} />
                <Row label="Size" value={detailOpen.sizeBytes != null ? `${(detailOpen.sizeBytes/1024).toFixed(1)} KB` : "—"} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailOpen(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

/* Small row helper */
function Row({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography sx={{ minWidth: 140 }} color="text.secondary">{label}</Typography>
      <Typography sx={{ flex: 1 }}>{value}</Typography>
    </Stack>
  );
}

/* Produce tiny demo payload */
function makeDemoPayload(job) {
  const line = (obj) => JSON.stringify(obj) + "\n";
  const now = new Date().toISOString();

  if (job.format === "CSV") {
    const header = "id,type,prompt,response,choice,annotatorId,status,ts\n";
    const rows = [
      `e1,sft,"How are you?","I'm fine, thanks.",,"a1","accepted","${now}"\n`,
      `e2,pairwise,"Pick best",,"A","a2","accepted","${now}"\n`,
    ];
    return { content: header + rows.join("") };
  }

  // JSONL default
  const lines = [
    line({ id:"e1", type:"sft", prompt:"How are you?", response:"I'm fine, thanks.", annotatorId:"a1", status:"accepted", ts: now }),
    line({ id:"e2", type:"pairwise", prompt:"Pick best", A:"Answer A", B:"Answer B", choice:"A", annotatorId:"a2", status:"accepted", ts: now }),
    ...(job.filters.type === "dialogue" || job.filters.type === "all" ? [
      line({ id:"e3", type:"dialogue", transcript:[{role:"user",text:"Hi"}, {role:"assistant",text:"Hello!"}], annotatorId:"a3", status:"pending", ts: now })
    ] : [])
  ];
  return { content: lines.join("") };
}