// src/components/Main/0.tellus/dashboard/ProjectList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, Stack, LinearProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider,
  Grid, TextField, Select, MenuItem, FormControl, InputLabel,
  Tooltip, Snackbar, Alert, IconButton
} from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";

import { listProjects, updateProjectStatus } from "./data/providerSampleData";


const LS_KEY = "projectList.filters.v1";

export default function ProjectList({ setActiveView, onOpenProject }) {
  // Seed from shared demo data so IDs & details match ProjectDetail/getProjectById
  const seed = useMemo(() => {
    // Map shared projects to the list-row shape used here
    return listProjects().map((p) => ({
      id: p.id,
      name: p.name,
      type: `${p.type}${p.subtype ? " • " + p.subtype : ""}`,
      typeKey: p.type, // "SFT" | "RM" | "Safety"
      owner: p.owner,
      createdAt: p.createdAt,
      due: p.due ?? p.dueDate,
      status: p.status,
      completion: p.progress?.completion ?? 0,
      targetItems: p.progress?.itemsTotal ?? 0,
      collectedItems: p.progress?.itemsDone ?? 0,
      flags: p.metrics?.flags ?? 0,
      description: p.description || "",
    }));
  }, []);
  const [projects, setProjects] = useState(seed);

  /* ---------------------- filters (persisted) ---------------------- */
  const ownerOptions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.owner))),
    [projects]
  );
  const typeOptions = ["All", "SFT", "RM", "Safety"];
  const statusOptions = ["All", "Active", "Paused", "Draft", "Completed"];

  const [filters, setFilters] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
      return {
        q: saved.q || "",
        type: saved.type || "All",
        status: saved.status || "All",
        owner: saved.owner || "All",
        createdFrom: saved.createdFrom || "",
        dueTo: saved.dueTo || "",
      };
    } catch {
      return { q: "", type: "All", status: "All", owner: "All", createdFrom: "", dueTo: "" };
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(filters));
  }, [filters]);

  const clearFilters = () =>
    setFilters({ q: "", type: "All", status: "All", owner: "All", createdFrom: "", dueTo: "" });

  /* -------------------- filter / search logic --------------------- */
  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return projects.filter((p) => {
      if (filters.type !== "All" && p.typeKey !== filters.type) return false;
      if (filters.status !== "All" && p.status !== filters.status) return false;
      if (filters.owner !== "All" && p.owner !== filters.owner) return false;
      if (filters.createdFrom && p.createdAt < filters.createdFrom) return false;
      if (filters.dueTo && p.due > filters.dueTo) return false;
      if (q) {
        const hay = `${p.name} ${p.type} ${p.owner} ${p.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, filters]);

  /* ----------------------- dialogs & toasts ----------------------- */
  const [confirm, setConfirm] = useState({ open: false, id: null, action: null });
  const [exportDlg, setExportDlg] = useState({ open: false, id: null, format: "JSONL" });
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  const statusChip = (s) => {
    const map = {
      Active: { color: "success", label: "Active" },
      Paused: { color: "warning", label: "Paused" },
      Draft: { color: "default", label: "Draft" },
      Completed: { color: "primary", label: "Completed" },
    };
    const cfg = map[s] || map.Draft;
    return <Chip size="small" color={cfg.color} label={cfg.label} />;
  };

  const flagsChip = (n) => {
    if (!n) return <Chip size="small" label="0" />;
    const color = n >= 10 ? "error" : n >= 3 ? "warning" : "default";
    return <Chip size="small" color={color} label={String(n)} />;
  };

  const handleView = (proj) => {
    if (typeof onOpenProject === "function") {
      onOpenProject(proj.id);
    } else {
      setSelected(proj);
      setDetailOpen(true);
    }
  };

  const askPauseResume = (proj, action) =>
    setConfirm({ open: true, id: proj.id, action });

  const doPauseResume = () => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === confirm.id
          ? { ...p, status: confirm.action === "pause" ? "Paused" : "Active" }
          : p
      )
    );
        // Keep the shared data in sync so ProjectDetail shows the new status
    updateProjectStatus(confirm.id, confirm.action === "pause" ? "Paused" : "Active");
    setToast({
      open: true,
      msg:
        confirm.action === "pause"
          ? "Project paused."
          : "Project resumed.",
      severity: "success",
    });
    setConfirm({ open: false, id: null, action: null });
  };

  const askExport = (proj) =>
    setExportDlg({ open: true, id: proj.id, format: "JSONL" });

  const doExport = () => {
    const proj = projects.find((p) => p.id === exportDlg.id);
    if (!proj) return;

    if (exportDlg.format === "JSONL") {
      const jsonl =
        JSON.stringify({ id: proj.id, name: proj.name, status: proj.status }) + "\n";
      const blob = new Blob([jsonl], { type: "application/x-ndjson" });
      triggerDownload(blob, `${slug(proj.name)}.jsonl`);
    } else {
      const header = "id,name,status\n";
      const row = `${proj.id},"${proj.name.replace(/"/g, '""')}",${proj.status}\n`;
      const blob = new Blob([header + row], { type: "text/csv" });
      triggerDownload(blob, `${slug(proj.name)}.csv`);
    }
    setToast({ open: true, msg: "Export started.", severity: "info" });
    setExportDlg({ open: false, id: null, format: "JSONL" });
  };

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  /* ------------------- fallback local detail view ------------------ */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Projects</Typography>
        <Button
          variant="contained"
          onClick={() => setActiveView && setActiveView("createProject")}
        >
          Create Project
        </Button>
      </Stack>

      {/* Filters toolbar */}
      <Box sx={{ mt: 2, p: 2, border: "1px solid #eee", borderRadius: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name/owner/type…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />,
              }}
            />
          </Grid>
          <Grid item xs={6} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={filters.type}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, type: e.target.value }))
                }
              >
                {typeOptions.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <FormControl fullWidth>
              <InputLabel>Owner</InputLabel>
              <Select
                label="Owner"
                value={filters.owner}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, owner: e.target.value }))
                }
              >
                <MenuItem value="All">All</MenuItem>
                {ownerOptions.map((o) => (
                  <MenuItem key={o} value={o}>{o}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <TextField
              label="Created from"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.createdFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, createdFrom: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={6} md={2.5}>
            <TextField
              label="Due up to"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={filters.dueTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dueTo: e.target.value }))
              }
            />
          </Grid>
          <Grid item xs={12} md="auto">
            <Tooltip title="Clear all filters">
              <span>
                <Button onClick={clearFilters} startIcon={<ClearAllIcon />}>
                  Clear
                </Button>
              </span>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      {/* List */}
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Name / Type</TableCell>
            <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Owner</TableCell>
            <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Created</TableCell>
            <TableCell>Due</TableCell>
            <TableCell>Status</TableCell>
            <TableCell width={260}>Progress</TableCell>
            <TableCell>Flags</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((p) => (
            <TableRow
              key={p.id}
              hover
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") handleView(p); }}
              onDoubleClick={() => handleView(p)}
            >
              <TableCell sx={{ maxWidth: 280 }}>
                <Stack spacing={0.25}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={p.name}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap title={p.type}>
                    {p.type}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{p.owner}</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>{p.createdAt}</TableCell>
              <TableCell>{p.due}</TableCell>
              <TableCell>{statusChip(p.status)}</TableCell>
              <TableCell>
                <Stack spacing={0.5}>
                  <LinearProgress variant="determinate" value={p.completion} />
                  <Typography variant="caption" color="text.secondary">
                    {p.completion}% • {p.collectedItems}/{p.targetItems}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{flagsChip(p.flags)}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" onClick={() => handleView(p)}>
                    View
                  </Button>

                  {p.status === "Active" ? (
                    <Tooltip title="Pause project">
                      <span>
                        <IconButton size="small" color="warning" onClick={() => askPauseResume(p, "pause")}>
                          <PauseIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : p.status === "Paused" ? (
                    <Tooltip title="Resume project">
                      <span>
                        <IconButton size="small" color="success" onClick={() => askPauseResume(p, "resume")}>
                          <PlayArrowIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Pause/Resume unavailable">
                      <span>
                        <IconButton size="small" disabled>
                          <PauseIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}

                  <Tooltip title={p.status === "Completed" ? "Export results" : "Export available after completion"}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={p.status !== "Completed"}
                        onClick={() => askExport(p)}
                      >
                        <FileDownloadIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography variant="body2" color="text.secondary">
                  No projects match your filters.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Confirm Pause/Resume */}
      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null, action: null })}>
        <DialogTitle>{confirm.action === "pause" ? "Pause project?" : "Resume project?"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            {confirm.action === "pause"
              ? "Pausing will stop new tasks from being served."
              : "Resuming will continue serving tasks to annotators."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, id: null, action: null })}>Cancel</Button>
          <Button variant="contained" color={confirm.action === "pause" ? "warning" : "success"} onClick={doPauseResume}>
            {confirm.action === "pause" ? "Pause" : "Resume"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export dialog */}
      <Dialog open={exportDlg.open} onClose={() => setExportDlg({ open: false, id: null, format: "JSONL" })}>
        <DialogTitle>Export results</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Choose a format to export this project’s results.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              label="Format"
              value={exportDlg.format}
              onChange={(e) => setExportDlg((x) => ({ ...x, format: e.target.value }))}
            >
              <MenuItem value="JSONL">JSONL</MenuItem>
              <MenuItem value="CSV">CSV</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            (Demo export includes minimal fields. Wire to your export service to stream full payloads.)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDlg({ open: false, id: null, format: "JSONL" })}>Cancel</Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={doExport}>
            Export
          </Button>
        </DialogActions>
      </Dialog>

      {/* Local Project Detail Dialog (used when onOpenProject is not supplied) */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.name || "Project"}</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {selected.type}
              </Typography>
              <Typography sx={{ mt: 1 }}>{selected.description}</Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Row label="Owner" value={selected.owner} />
                <Row label="Created" value={selected.createdAt} />
                <Row label="Due" value={selected.due} />
                <Row label="Status" value={selected.status} />
                <Row
                  label="Progress"
                  value={`${selected.completion}% • ${selected.collectedItems}/${selected.targetItems}`}
                />
                <Row label="Flags" value={selected.flags} />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                What’s next
              </Typography>
              <Typography variant="body2" color="text.secondary">
                From here you can extend this route to include: live responses, annotator filters, flag queue,
                per-rubric stats, exports, and audit samples. If you wire a route, pass an <code>onOpenProject</code> prop
                to navigate instead of this dialog.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled" sx={{ width: "100%" }}>
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function Row({ label, value }) {
  return (
    <Stack direction="row" spacing={2}>
      <Typography sx={{ minWidth: 140 }} color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ flex: 1 }}>{value}</Typography>
    </Stack>
  );
}