// src/components/Main/0.tellus/dashboard/AnnotatorManager.jsx
import React, { useMemo, useState } from "react";
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, TextField, Stack, Chip, Select, MenuItem, Checkbox,
  IconButton, Tooltip, FormControl, InputLabel, OutlinedInput, Divider,
  DialogTitle, DialogContent, DialogActions, Switch
} from "@mui/material";
import AddIcon from "@mui/icons-material/PersonAddAlt1";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import MoveIcon from "@mui/icons-material/SwapHoriz";
import AssignmentIcon from "@mui/icons-material/AssignmentInd";
import RateReviewIcon from "@mui/icons-material/RateReview";
import HistoryIcon from "@mui/icons-material/History";
import FilterListIcon from "@mui/icons-material/FilterList";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";

import { PROVIDER_ANNOTATORS, PROVIDER_PROJECTS } from "./data/providerSampleData";

/** helper to ensure pools exist */
const withPools = (a) => ({ ...a, pools: Array.isArray(a.pools) && a.pools.length ? a.pools : ["General"] });
/** record a history line on annotator */
const pushHistory = (a, msg) => ({
  ...a,
  history: [{ ts: new Date().toISOString(), msg }, ...(a.history || [])],
});

const DUMMY_TRAINING = [
  { id: "onboarding", name: "Platform Onboarding" },
  { id: "policy-v1", name: "Policy Guidelines v1" },
  { id: "rm-basics", name: "Reward-Modeling Basics" },
];

export default function AnnotatorManager({ onOpenProject }) {
  const [annotators, setAnnotators] = useState(PROVIDER_ANNOTATORS.map(withPools));
  const [openAdd, setOpenAdd] = useState(false);
  const [newAnnotator, setNewAnnotator] = useState({ name: "", email:"", quota: 50, pools:["General"], status:"Active" });

  /* selection & filters */
  const [selectedIds, setSelectedIds] = useState([]);
  const [q, setQ] = useState("");
  const allPools = useMemo(() => {
    const s = new Set();
    annotators.forEach(a => (a.pools||["General"]).forEach(p => s.add(p)));
    return ["All", ...Array.from(s)];
  }, [annotators]);
  const [poolFilter, setPoolFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortAsc, setSortAsc] = useState(true);

  const projectsById = useMemo(() => Object.fromEntries(PROVIDER_PROJECTS.map(p=>[p.id,p])), []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = annotators.filter(a => {
      if (statusFilter !== "All" && (a.status || "Active") !== statusFilter) return false;
      if (poolFilter !== "All" && !(a.pools||[]).includes(poolFilter)) return false;
      if (!ql) return true;
      const hay = `${a.name} ${a.email || ""} ${(a.pools||[]).join(" ")} ${(a.projects||[]).map(id=>projectsById[id]?.name||"").join(" ")}`.toLowerCase();
      return hay.includes(ql);
    });
    return list.sort((A,B) => sortAsc ? A.name.localeCompare(B.name) : B.name.localeCompare(A.name));
  }, [annotators, q, poolFilter, statusFilter, sortAsc, projectsById]);

  const toggleSelect = (id) =>
    setSelectedIds(sel => sel.includes(id) ? sel.filter(x=>x!==id) : [...sel, id]);

  /* ───────────── Add / Invite ───────────── */
  const handleAdd = () => {
    const base = {
      id: `a${Date.now()}`,
      name: newAnnotator.name.trim(),
      email: newAnnotator.email.trim(),
      quota: +newAnnotator.quota || 50,
      pools: newAnnotator.pools?.length ? newAnnotator.pools : ["General"],
      status: newAnnotator.status || "Active",
      accuracyPct: 0,
      flags: 0,
      rating: null,
      projects: [],
      projectQuotas: {},
      training: {}, // e.g. { "policy-v1": "completed" }
    };
    setAnnotators((a) => [pushHistory(base, "Invited to organization"), ...a]);
    setOpenAdd(false);
    setNewAnnotator({ name:"", email:"", quota:50, pools:["General"], status:"Active" });
  };

  /* ───────────── Remove (single/bulk) ───────────── */
  const [confirmRemove, setConfirmRemove] = useState({ open:false, ids:[] });
  const askRemove = (ids) => setConfirmRemove({ open:true, ids });
  const doRemove = () => {
    const ids = confirmRemove.ids;
    setAnnotators(list => list.filter(a => !ids.includes(a.id)));
    setSelectedIds([]);
    setConfirmRemove({ open:false, ids:[] });
  };

  /* ───────────── Move pools (single/bulk) ───────────── */
  const [poolDlg, setPoolDlg] = useState({ open:false, ids:[], pools:[], newPoolName:"" });
  const askMovePools = (ids) => {
    const selected = annotators.filter(a => ids.includes(a.id));
    const common = selected.reduce((acc, a, i) => i===0 ? new Set(a.pools||[]) : new Set([...acc].filter(x => (a.pools||[]).includes(x))), new Set());
    setPoolDlg({ open:true, ids, pools: Array.from(common), newPoolName:"" });
  };
  const addPoolName = () => {
    const name = poolDlg.newPoolName.trim();
    if (!name) return;
    setPoolDlg(p => ({ ...p, pools: Array.from(new Set([...(p.pools||[]), name])), newPoolName:"" }));
  };
  const savePools = () => {
    setAnnotators(list => list.map(a => {
      if (!poolDlg.ids.includes(a.id)) return a;
      const next = { ...a, pools: Array.from(new Set(poolDlg.pools)) };
      return pushHistory(next, `Pools set to: ${next.pools.join(", ")}`);
    }));
    setPoolDlg({ open:false, ids:[], pools:[], newPoolName:"" });
  };

  /* ───────────── Assign to projects (single/bulk) ───────────── */
  const [assignDlg, setAssignDlg] = useState({ open:false, ids:[], sel: new Set(), quotas: {} });
  const askAssign = (ids) => {
    setAssignDlg({ open:true, ids, sel: new Set(), quotas: {} });
  };
  const toggleProj = (pid) => {
    setAssignDlg(d => {
      const sel = new Set(d.sel);
      sel.has(pid) ? sel.delete(pid) : sel.add(pid);
      return { ...d, sel };
    });
  };
  const setProjQuota = (pid, q) => {
    setAssignDlg(d => ({ ...d, quotas: { ...d.quotas, [pid]: Math.max(0, parseInt(q||"0", 10)) } }));
  };
  const saveAssign = () => {
    const pids = Array.from(assignDlg.sel);
    setAnnotators(list => list.map(a => {
      if (!assignDlg.ids.includes(a.id)) return a;
      const curr = new Set(a.projects || []);
      pids.forEach(id => curr.add(id));
      const pq = { ...(a.projectQuotas || {}) };
      pids.forEach(id => {
        if (assignDlg.quotas[id] != null) pq[id] = assignDlg.quotas[id];
      });
      const next = { ...a, projects: Array.from(curr), projectQuotas: pq };
      return pushHistory(next, `Assigned to: ${pids.map(id=>projectsById[id]?.name || id).join(", ")}`);
    }));
    setAssignDlg({ open:false, ids:[], sel:new Set(), quotas:{} });
  };

  /* ───────────── Review / Feedback / Training / History ───────────── */
  const [reviewOpen, setReviewOpen] = useState(null); // annotator obj
  const [feedbackText, setFeedbackText] = useState("");
  const [trainingDlg, setTrainingDlg] = useState({ open:false, forId:null, moduleId:DUMMY_TRAINING[0].id });
  const [historyOpen, setHistoryOpen] = useState(null);

  const sendFeedback = () => {
    const id = reviewOpen.id;
    setAnnotators(list => list.map(a => {
      if (a.id !== id) return a;
      return pushHistory(a, `Feedback: ${feedbackText || "(no text)"}`);
    }));
    setFeedbackText("");
    setReviewOpen(null);
  };
  const openTraining = (id) => setTrainingDlg({ open:true, forId:id, moduleId:DUMMY_TRAINING[0].id });
  const sendTraining = () => {
    const { forId, moduleId } = trainingDlg;
    setAnnotators(list => list.map(a => {
      if (a.id !== forId) return a;
      const next = pushHistory(a, `Training sent: ${DUMMY_TRAINING.find(t=>t.id===moduleId)?.name || moduleId}`);
      return next;
    }));
    setTrainingDlg({ open:false, forId:null, moduleId:DUMMY_TRAINING[0].id });
  };
  const toggleTrainingComplete = (aId, moduleId) => {
    setAnnotators(list => list.map(a => {
      if (a.id !== aId) return a;
      const status = (a.training || {})[moduleId] === "completed" ? "pending" : "completed";
      const training = { ...(a.training || {}), [moduleId]: status };
      return pushHistory({ ...a, training }, `Training ${status}: ${DUMMY_TRAINING.find(t=>t.id===moduleId)?.name || moduleId}`);
    }));
  };

  /* ───────────── helpers ───────────── */
  const bulk = {
    any: selectedIds.length > 0,
    askRemove: () => askRemove(selectedIds),
    askMovePools: () => askMovePools(selectedIds),
    askAssign: () => askAssign(selectedIds),
  };

  return (
    <Box>
      {/* Header & actions */}
      <Stack direction={{ xs:"column", md:"row" }} spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>Annotators & Pools</Typography>
        <Tooltip title="Invite annotator">
          <span>
            <Button variant="contained" startIcon={<AddIcon />} onClick={()=>setOpenAdd(true)}>Invite</Button>
          </span>
        </Tooltip>
        <Tooltip title="Assign to projects">
          <span>
            <Button variant="outlined" startIcon={<AssignmentIcon />} disabled={!bulk.any} onClick={bulk.askAssign}>Assign</Button>
          </span>
        </Tooltip>
        <Tooltip title="Move between pools">
          <span>
            <Button variant="outlined" startIcon={<MoveIcon />} disabled={!bulk.any} onClick={bulk.askMovePools}>Move Pools</Button>
          </span>
        </Tooltip>
        <Tooltip title="Remove annotators">
          <span>
            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} disabled={!bulk.any} onClick={bulk.askRemove}>Remove</Button>
          </span>
        </Tooltip>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs:"column", md:"row" }} spacing={1.5} alignItems="center" sx={{ mb: 1.5, p: 1.5, border:"1px solid #eee", borderRadius: 2 }}>
        <FilterListIcon fontSize="small" />
        <TextField
          size="small"
          placeholder="Search annotators, emails, pools, projects…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} /> }}
          sx={{ minWidth: 260 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Pool</InputLabel>
          <Select label="Pool" value={poolFilter} onChange={(e)=>setPoolFilter(e.target.value)}>
            {allPools.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
            {["All","Active","Inactive"].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={sortAsc ? "Sort Z→A" : "Sort A→Z"}>
          <IconButton onClick={()=>setSortAsc(s=>!s)}><SortIcon /></IconButton>
        </Tooltip>
      </Stack>

      {/* Table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={32}></TableCell>
            <TableCell>Name / Email</TableCell>
            <TableCell>Pools</TableCell>
            <TableCell>Projects</TableCell>
            <TableCell>Quota</TableCell>
            <TableCell>Accuracy</TableCell>
            <TableCell>Agreement</TableCell>
            <TableCell>Gold</TableCell>
            <TableCell>Flags</TableCell>
            <TableCell>Training</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.map((a) => {
            const status = a.status || "Active";
            const trainingState = DUMMY_TRAINING.every(t => (a.training||{})[t.id] === "completed") ? "All complete" : "Pending";
            return (
              <TableRow key={a.id} hover>
                <TableCell>
                  <Checkbox checked={selectedIds.includes(a.id)} onChange={()=>toggleSelect(a.id)} />
                </TableCell>
                <TableCell>
                  <Stack spacing={0.25}>
                    <Typography sx={{ fontWeight: 600 }}>{a.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.email || "—"}</Typography>
                    <Chip size="small" variant="outlined" label={status} sx={{ mt: 0.25 }} />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                    {(a.pools||["General"]).map(p => <Chip key={p} size="small" label={p} />)}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                    {(a.projects||[]).map(pid => {
                      const p = projectsById[pid];
                      if (!p) return null;
                      return (
                        <Chip
                          key={pid}
                          size="small"
                          label={p.name}
                          onClick={()=>onOpenProject?.(pid)}
                          sx={{ cursor:"pointer" }}
                        />
                      );
                    })}
                  </Stack>
                </TableCell>
                <TableCell>{a.quota}</TableCell>
                <TableCell>{a.accuracyPct != null ? `${a.accuracyPct}%` : "—"}</TableCell>
                <TableCell>{a.agreementKappa != null ? a.agreementKappa.toFixed?.(2) : "—"}</TableCell>
                <TableCell>{a.goldPassPct != null ? `${a.goldPassPct}%` : "—"}</TableCell>
                <TableCell>{a.flags ?? 0}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Chip size="small" variant="outlined" label={trainingState} />
                    <Tooltip title="Mark all complete (demo)">
                      <span>
                        <IconButton size="small" onClick={()=>{
                          setAnnotators(list => list.map(x=>{
                            if (x.id !== a.id) return x;
                            const training = {};
                            DUMMY_TRAINING.forEach(t => training[t.id] = "completed");
                            return pushHistory({ ...x, training }, "All training marked complete");
                          }));
                        }}>
                          <DoneAllIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Review & feedback">
                      <span>
                        <IconButton size="small" onClick={()=>setReviewOpen(a)}><RateReviewIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move pools">
                      <span>
                        <IconButton size="small" onClick={()=>askMovePools([a.id])}><MoveIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Assign projects">
                      <span>
                        <IconButton size="small" onClick={()=>askAssign([a.id])}><AssignmentIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="History">
                      <span>
                        <IconButton size="small" onClick={()=>setHistoryOpen(a)}><HistoryIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <span>
                        <IconButton size="small" color="error" onClick={()=>askRemove([a.id])}><DeleteIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={11}>
                <Typography variant="body2" color="text.secondary">No annotators match your filters.</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Invite annotator */}
      <Dialog open={openAdd} onClose={()=>setOpenAdd(false)}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, minWidth: 420 }}>
          <Typography variant="h6">Invite Annotator</Typography>
          <TextField label="Name" value={newAnnotator.name} onChange={(e)=>setNewAnnotator(s=>({ ...s, name:e.target.value }))} />
          <TextField label="Email" value={newAnnotator.email} onChange={(e)=>setNewAnnotator(s=>({ ...s, email:e.target.value }))} />
          <TextField label="Daily Quota" type="number" value={newAnnotator.quota} onChange={(e)=>setNewAnnotator(s=>({ ...s, quota: +e.target.value }))} />
          <FormControl>
            <InputLabel>Pools</InputLabel>
            <Select
              multiple
              value={newAnnotator.pools}
              onChange={(e)=>setNewAnnotator(s=>({ ...s, pools: e.target.value }))}
              input={<OutlinedInput label="Pools" />}
              renderValue={(sel)=>sel.join(", ")}
            >
              {allPools.slice(1).map(p => (
                <MenuItem key={p} value={p}>
                  <Checkbox checked={newAnnotator.pools.includes(p)} />
                  <Typography sx={{ ml: 1 }}>{p}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>Status</Typography>
            <Select size="small" value={newAnnotator.status} onChange={(e)=>setNewAnnotator(s=>({ ...s, status:e.target.value }))}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </Stack>
          <Button variant="contained" onClick={handleAdd}>Send Invite</Button>
        </Box>
      </Dialog>

      {/* Confirm Remove */}
      <Dialog open={confirmRemove.open} onClose={()=>setConfirmRemove({ open:false, ids:[] })}>
        <DialogTitle>Remove annotator{confirmRemove.ids.length>1?"s":""}?</DialogTitle>
        <DialogContent dividers>
          {confirmRemove.ids.map(id=>{
            const a = annotators.find(x=>x.id===id);
            if (!a) return null;
            const activeProjects = (a.projects||[]).length;
            return (
              <Box key={id} sx={{ mb: 1.25 }}>
                <Typography><b>{a.name}</b> • {a.email || "—"}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Impact: assigned to {activeProjects} project{activeProjects===1?"":"s"}
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>
            );
          })}
          <Typography variant="body2" color="text.secondary">
            Removal will not delete historical data. Access is revoked and assignments are cleared.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirmRemove({ open:false, ids:[] })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doRemove}>Remove</Button>
        </DialogActions>
      </Dialog>

      {/* Move Pools */}
      <Dialog open={poolDlg.open} onClose={()=>setPoolDlg({ open:false, ids:[], pools:[], newPoolName:"" })} maxWidth="sm" fullWidth>
        <DialogTitle>Move between pools</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth>
            <InputLabel>Pools</InputLabel>
            <Select
              multiple
              value={poolDlg.pools}
              onChange={(e)=>setPoolDlg(p=>({ ...p, pools: e.target.value }))}
              input={<OutlinedInput label="Pools" />}
              renderValue={(sel)=>sel.join(", ")}
            >
              {allPools.slice(1).map(p => (
                <MenuItem key={p} value={p}>
                  <Checkbox checked={poolDlg.pools.indexOf(p) > -1} />
                  <Typography sx={{ ml: 1 }}>{p}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Create new pool"
              value={poolDlg.newPoolName}
              onChange={(e)=>setPoolDlg(p=>({ ...p, newPoolName:e.target.value }))}
            />
            <Button onClick={addPoolName}>Add</Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display:"block", mt: 1 }}>
            Applies to {poolDlg.ids.length} annotator{poolDlg.ids.length===1?"":"s"}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setPoolDlg({ open:false, ids:[], pools:[], newPoolName:"" })}>Cancel</Button>
          <Button variant="contained" onClick={savePools}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Assign to Projects */}
      <Dialog open={assignDlg.open} onClose={()=>setAssignDlg({ open:false, ids:[], sel:new Set(), quotas:{} })} maxWidth="sm" fullWidth>
        <DialogTitle>Assign to projects</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {PROVIDER_PROJECTS.map(p => {
              const checked = assignDlg.sel.has(p.id);
              return (
                <Stack key={p.id} direction="row" spacing={1} alignItems="center">
                  <Checkbox checked={checked} onChange={()=>toggleProj(p.id)} />
                  <Typography sx={{ minWidth: 220 }}>{p.name}</Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Daily quota"
                    value={assignDlg.quotas[p.id] ?? ""}
                    onChange={(e)=>setProjQuota(p.id, e.target.value)}
                    disabled={!checked}
                  />
                </Stack>
              );
            })}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display:"block", mt: 1 }}>
            Applies to {assignDlg.ids.length} annotator{assignDlg.ids.length===1?"":"s"}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setAssignDlg({ open:false, ids:[], sel:new Set(), quotas:{} })}>Cancel</Button>
          <Button variant="contained" onClick={saveAssign}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Review / Feedback */}
      <Dialog open={!!reviewOpen} onClose={()=>setReviewOpen(null)} maxWidth="sm" fullWidth>
        {reviewOpen && (
          <>
            <DialogTitle>Review {reviewOpen.name}</DialogTitle>
            <DialogContent dividers>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography sx={{ minWidth: 120 }}>Rating</Typography>
                  <Select size="small" defaultValue={Math.round(reviewOpen.rating || 5)}>
                    {[1,2,3,4,5].map(n=> <MenuItem key={n} value={n}>{n}</MenuItem>)}
                  </Select>
                  <Typography variant="caption" color="text.secondary">Manual rating (demo)</Typography>
                </Stack>
                <TextField
                  label="Private feedback"
                  multiline minRows={3}
                  placeholder="Notes about quality, speed, issues…"
                  value={feedbackText}
                  onChange={(e)=>setFeedbackText(e.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <Button onClick={()=>openTraining(reviewOpen.id)}>Send Training</Button>
                  <Button variant="outlined" onClick={sendFeedback}>Send Feedback</Button>
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setReviewOpen(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Training dialog */}
      <Dialog open={trainingDlg.open} onClose={()=>setTrainingDlg({ open:false, forId:null, moduleId:DUMMY_TRAINING[0].id })}>
        <DialogTitle>Send training</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth>
            <InputLabel>Module</InputLabel>
            <Select
              label="Module"
              value={trainingDlg.moduleId}
              onChange={(e)=>setTrainingDlg(t=>({ ...t, moduleId: e.target.value }))}
            >
              {DUMMY_TRAINING.map(m => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ display:"block", mt: 1 }}>
            This logs a training invite in the annotator’s history (demo).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setTrainingDlg({ open:false, forId:null, moduleId:DUMMY_TRAINING[0].id })}>Cancel</Button>
          <Button variant="contained" onClick={sendTraining}>Send</Button>
        </DialogActions>
      </Dialog>

      {/* History / Audit */}
      <Dialog open={!!historyOpen} onClose={()=>setHistoryOpen(null)} maxWidth="sm" fullWidth>
        {historyOpen && (
          <>
            <DialogTitle>History: {historyOpen.name}</DialogTitle>
            <DialogContent dividers>
              {(historyOpen.history || []).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No history yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {(annotators.find(a=>a.id===historyOpen.id)?.history || []).map((h,i)=>(
                    <Typography key={i} variant="body2">
                      <b>{new Date(h.ts).toLocaleString()}</b> — {h.msg}
                    </Typography>
                  ))}
                </Stack>
              )}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Training status</Typography>
              <Stack spacing={1}>
                {DUMMY_TRAINING.map(m => {
                  const status = (historyOpen.training || {})[m.id] === "completed";
                  return (
                    <Stack key={m.id} direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ minWidth: 220 }}>{m.name}</Typography>
                      <Chip size="small" label={status ? "Completed" : "Pending"} color={status ? "success" : "default"} />
                      <Switch
                        size="small"
                        checked={status}
                        onChange={()=>toggleTrainingComplete(historyOpen.id, m.id)}
                      />
                    </Stack>
                  );
                })}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setHistoryOpen(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}