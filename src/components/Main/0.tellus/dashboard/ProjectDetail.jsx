// src/components/Main/0.tellus/dashboard/ProjectDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Breadcrumbs, Link, Chip, Grid, Card, CardContent, Stack,
  Tabs, Tab, Divider, Button, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress
} from "@mui/material";
import { getProjectById, getAnnotatorById } from "./data/providerSampleData";

const EXPORTS_LS_KEY = "tellus.exports.history.v1";

/* ---------------- Small UI helpers ---------------- */
function StatCard({ label, value, sub }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ mt: .5 }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </CardContent>
    </Card>
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
function pct(n, d) {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}

/* ---------------- Main ---------------- */
export default function ProjectDetail({ projectId, onBack }) {
  const baseProject = useMemo(() => getProjectById(projectId), [projectId]);
  const [tab, setTab] = useState(0);

  // Defensive: if project missing
  if (!baseProject) return <Typography>Project not found.</Typography>;

  /* Clone project to allow demo-time mutations (activity log, overrides, etc.) */
  const [activity, setActivity] = useState(baseProject.activity || []);
  const [overrides, setOverrides] = useState({}); // responseId -> partial override (status, meta, etc.)
  const [probation, setProbation] = useState(new Set()); // annotatorId on probation (demo)

  // Compose responses with overrides
  const responses = useMemo(() => {
    const arr = Array.isArray(baseProject.responses) ? baseProject.responses : [];
    return arr.map(r => overrides[r.id] ? { ...r, ...overrides[r.id] } : r);
  }, [baseProject.responses, overrides]);

  const itemsDone = baseProject.progress.itemsDone;
  const itemsTotal = baseProject.progress.itemsTotal;
  const completion = baseProject.progress.completion;

  /* ---------------- Derived QA metrics ---------------- */
  const qaStats = useMemo(() => {
    let total = responses.length;
    let flagged = 0, needsReview = 0;
    let goldTotal = 0, goldCorrect = 0;
    let audits = 0, auditsPass = 0;

    responses.forEach(r => {
      if (r.status === "flagged") flagged++;
      if (r.status === "needs_review" || r.meta?.disagreement === true) needsReview++;
      if (r.meta?.isGold) {
        goldTotal++;
        if (r.meta?.goldCorrect === true) goldCorrect++;
      }
      if (typeof r.meta?.auditResult !== "undefined") {
        audits++;
        if (r.meta.auditResult === "pass") auditsPass++;
      }
    });

    return {
      total,
      flagged,
      needsReview,
      goldTotal,
      goldCorrect,
      goldAccPct: goldTotal ? Math.round((goldCorrect / goldTotal) * 100) : null,
      auditTotal: audits,
      auditPass: auditsPass,
      auditPassPct: audits ? Math.round((auditsPass / audits) * 100) : null,
      flagRatePct: total ? Math.round((flagged / total) * 100) : null,
      disagreeRatePct: total ? Math.round((needsReview / total) * 100) : null,
    };
  }, [responses]);

  /* ---------------- Queues (computed) ---------------- */
  const flaggedQueue = useMemo(
    () => responses.filter(r => r.status === "flagged"),
    [responses]
  );
  const disagreeQueue = useMemo(
    () => responses.filter(r => r.status === "needs_review" || r.meta?.disagreement === true),
    [responses]
  );

  /* ---------------- Annotators list ---------------- */
  const annotators = useMemo(
    () => (baseProject.workforce?.assignedAnnotators || []).map(getAnnotatorById).filter(Boolean),
    [baseProject.workforce]
  );

  /* ---------------- Data/Responses filters + drawer ---------------- */
  const [fAnnotator, setFAnnotator] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fType, setFType] = useState("all");
  const [q, setQ] = useState("");
  const [openTx, setOpenTx] = useState(null); // response to show transcript

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return responses.filter(r => {
      const matchAnnot = fAnnotator === "all" || r.annotatorId === fAnnotator;
      const matchStatus = fStatus === "all" || r.status === fStatus;
      const matchType = fType === "all" || r.type === fType;
      const hay =
        (r.payload?.prompt || "") +
        " " +
        (r.payload?.response || "") +
        " " +
        (Array.isArray(r.payload?.transcript) ? r.payload.transcript.map(t=>t.text).join(" ") : "");
      const matchQ = !ql || hay.toLowerCase().includes(ql);
      return matchAnnot && matchStatus && matchType && matchQ;
    });
  }, [responses, fAnnotator, fStatus, fType, q]);

  /* ---------------- Actions that mutate local demo state ---------------- */
  const log = (msg, who = "system") =>
    setActivity(a => [{ ts: new Date().toISOString(), who, msg }, ...a]);

  const updateResponse = (id, patch) => {
    setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), ...patch } }));
  };

  const resolveFlag = (r, resolution = "accepted") => {
    updateResponse(r.id, { status: resolution, meta: { ...(r.meta || {}), resolvedAt: new Date().toISOString() } });
    log(`Flag resolved for item ${r.id} → ${resolution}`, "admin");
  };
  const sendToReview = (r, reviewerName = "Senior Reviewer") => {
    updateResponse(r.id, { status: "needs_review", meta: { ...(r.meta || {}), disagreement: true } });
    log(`Item ${r.id} sent to ${reviewerName} for adjudication`, "admin");
  };
  const adjudicate = (r, decision = "accepted") => {
    updateResponse(r.id, { status: decision, meta: { ...(r.meta || {}), disagreement: false, adjudicatedAt: new Date().toISOString() } });
    log(`Adjudicated item ${r.id} → ${decision}`, "reviewer");
  };

  const toggleProbation = (annotatorId) => {
    setProbation(prev => {
      const copy = new Set(prev);
      if (copy.has(annotatorId)) {
        copy.delete(annotatorId);
        log(`Removed ${annotators.find(a=>a.id===annotatorId)?.name || annotatorId} from probation`, "admin");
      } else {
        copy.add(annotatorId);
        log(`Placed ${annotators.find(a=>a.id===annotatorId)?.name || annotatorId} on probation`, "admin");
      }
      return copy;
    });
  };

  /* ---------------- Compliance helpers ---------------- */
  // Pull export history logged by Exports page
  const [exportHistory, setExportHistory] = useState([]);
  useEffect(() => {
    try {
      const rows = JSON.parse(localStorage.getItem(EXPORTS_LS_KEY) || "[]");
      setExportHistory(rows.filter(r => String(r.projectId) === String(baseProject.id)));
    } catch { setExportHistory([]); }
  }, [baseProject.id, overrides, activity]);

  // Simple policy versions (demo): we’ll treat current config as v2 and synthesize a v1
  const [policyVersions] = useState([
    { id: "v1", label: "v1 (earlier)", config: baseProject.config }, // in a real app this is the older snapshot
    { id: "current", label: "current", config: baseProject.config },  // same for demo; still shows structure
  ]);
  const [vLeft, setVLeft] = useState("v1");
  const [vRight, setVRight] = useState("current");

  const jsonDiff = useMemo(() => {
    // naive text diff: show both sides for demo readability
    const left = JSON.stringify(policyVersions.find(v=>v.id===vLeft)?.config || {}, null, 2);
    const right = JSON.stringify(policyVersions.find(v=>v.id===vRight)?.config || {}, null, 2);
    return { left, right };
  }, [vLeft, vRight, policyVersions]);

  // PII deletion simulation
  const [deleteDlg, setDeleteDlg] = useState({ open: false, identifier: "" });
  const [complianceLog, setComplianceLog] = useState([]);
  const runDeletion = () => {
    const id = deleteDlg.identifier.trim();
    if (!id) return;
    // naive “match” of responses that mention the identifier in prompt/response
    const hits = responses.filter(r => {
      const hay = ((r.payload?.prompt || "") + " " + (r.payload?.response || "")).toLowerCase();
      return hay.includes(id.toLowerCase());
    }).map(r => r.id);

    setComplianceLog(l => [
      { ts: new Date().toISOString(), action: "delete_personal_data", identifier: id, items: hits },
      ...l
    ]);
    log(`Compliance: deletion request for "${id}" — ${hits.length} items affected (simulated)`, "compliance");
    setDeleteDlg({ open: false, identifier: "" });
  };

  /* ---------------- UI ---------------- */
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" onClick={onBack} sx={{ cursor: "pointer" }}>
          Projects
        </Link>
        <Typography color="text.primary">{baseProject.name}</Typography>
      </Breadcrumbs>

      <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>{baseProject.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{baseProject.description}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={`${baseProject.type}${baseProject.subtype? " • "+baseProject.subtype:""}`} />
            <Chip size="small" label={baseProject.status} color={baseProject.status==="Active"?"success":baseProject.status==="Paused"?"warning":"default"} />
            {(baseProject.tags||[]).map(t => <Chip size="small" key={t} label={t} />)}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" disabled>Edit Project</Button>
          <Button variant="outlined" onClick={()=>window.alert("Export started (mock).")}>Export Data</Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><StatCard label="Completion" value={`${completion}%`} sub={`${itemsDone}/${itemsTotal} items`} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Labels per item" value={baseProject.progress.labelsPerItem || 1} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Agreement κ" value={baseProject.metrics.agreementKappa ?? "—"} /></Grid>
        <Grid item xs={12} md={3}><StatCard label="Flags" value={baseProject.metrics.flags || 0} sub={baseProject.metrics.onTrack ? "On track" : "Attention"} /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mt: 2 }}>
        <Tab label="Overview" />
        <Tab label="Config" />
        <Tab label="Workforce" />
        <Tab label="Data / Responses" />
        <Tab label="Analytics" />
        <Tab label="Quality & QA" />           {/* NEW */}
        <Tab label="Compliance & Audit" />     {/* NEW */}
      </Tabs>
      <Divider sx={{ mb: 2 }} />

      {/* OVERVIEW */}
      {tab===0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Timeline & Activity</Typography>
                {(activity || []).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No activity yet.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {activity.map((a, i) => (
                      <Typography key={i} variant="body2">
                        <b>{new Date(a.ts).toLocaleString()}</b> — <i>{a.who}</i>: {a.msg}
                      </Typography>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Meta</Typography>
                <Typography variant="body2"><b>Owner:</b> {baseProject.owner}</Typography>
                <Typography variant="body2"><b>Created by:</b> {baseProject.createdBy} on {baseProject.createdAt}</Typography>
                <Typography variant="body2"><b>Due:</b> {baseProject.dueDate || "—"}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><b>Rights:</b> {baseProject.rights}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* CONFIG */}
      {tab===1 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Configuration</Typography>
            <Box component="pre" sx={{ p:2, bgcolor:"grey.100", border:"1px solid #eee", borderRadius:1, overflow:"auto" }}>
              {JSON.stringify(baseProject.config, null, 2)}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* WORKFORCE */}
      {tab===2 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Assigned Annotators</Typography>
            {(annotators.length===0) ? (
              <Typography variant="body2" color="text.secondary">No annotators assigned.</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quota (daily)</TableCell>
                    <TableCell>Accuracy</TableCell>
                    <TableCell>Flags</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {annotators.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        {a.name} <Typography variant="caption" color="text.secondary" sx={{ ml: .5 }}>{a.email}</Typography>
                      </TableCell>
                      <TableCell>{baseProject.workforce?.dailyQuotaPerAnnotator ?? a.quota}</TableCell>
                      <TableCell>{a.accuracyPct}%</TableCell>
                      <TableCell>{a.flags}</TableCell>
                      <TableCell>{a.rating?.toFixed?.(1) ?? "—"}</TableCell>
                      <TableCell>
                        {probation.has(a.id) ? <Chip size="small" color="warning" label="Probation" /> : <Chip size="small" label="Active" />}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" onClick={()=>window.alert("Flag/Rate flow (mock).")}>Review</Button>
                          <Button size="small" color={probation.has(a.id) ? "success" : "warning"} onClick={()=>toggleProbation(a.id)}>
                            {probation.has(a.id) ? "Remove Probation" : "Place Probation"}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* DATA / RESPONSES */}
      {tab===3 && (
        <Box>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="center">
                <TextField label="Search text" value={q} onChange={(e)=>setQ(e.target.value)} />
                <Select value={fType} onChange={(e)=>setFType(e.target.value)} displayEmpty>
                  <MenuItem value="all">All types</MenuItem>
                  <MenuItem value="sft">SFT</MenuItem>
                  <MenuItem value="pairwise">Pairwise</MenuItem>
                  <MenuItem value="dialogue">Dialogue</MenuItem>
                </Select>
                <Select value={fStatus} onChange={(e)=>setFStatus(e.target.value)} displayEmpty>
                  <MenuItem value="all">All status</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="flagged">Flagged</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="needs_review">Needs review</MenuItem>
                </Select>
                <Select value={fAnnotator} onChange={(e)=>setFAnnotator(e.target.value)} displayEmpty>
                  <MenuItem value="all">All annotators</MenuItem>
                  {annotators.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                </Select>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" onClick={()=>window.alert("Partial export (mock).")}>Download Filtered</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Annotator</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Snippet</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map(r => {
                    const ann = getAnnotatorById(r.annotatorId);
                    const snippet =
                      r.type==="sft" ? (r.payload.response || "").slice(0,80) :
                      r.type==="pairwise" ? `Choice: ${r.payload.choice} — ${r.payload.prompt?.slice(0,40) || ""}…` :
                      r.type==="dialogue" ? (r.payload.transcript?.[1]?.text || "").slice(0,80) :
                      "";
                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{new Date(r.ts).toLocaleString()}</TableCell>
                        <TableCell>{ann?.name || r.annotatorId}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell><Typography variant="body2" noWrap title={snippet}>{snippet}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={r.status}
                            color={
                              r.status==="accepted" ? "success" :
                              r.status==="flagged" ? "warning" :
                              r.status==="needs_review" ? "default" : "default"
                            }
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={()=>setOpenTx(r)}>View</Button>
                            {r.status !== "flagged" && (
                              <Button size="small" color="warning" onClick={()=>sendToReview(r)}>Mark Needs Review</Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Response detail / transcript */}
          <Dialog open={!!openTx} onClose={()=>setOpenTx(null)} maxWidth="md" fullWidth>
            <DialogTitle>Response Detail</DialogTitle>
            <DialogContent dividers>
              {!openTx ? null : (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(openTx.ts).toLocaleString()} • {getAnnotatorById(openTx.annotatorId)?.name} • {openTx.type}
                  </Typography>

                  {/* Label metadata (Compliance: step 1) */}
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    <Chip size="small" label={`policy: ${openTx.meta?.policyVersion || "v1"}`} />
                    <Chip size="small" label={`ui: ${openTx.meta?.uiVersion || "v1"}`} />
                    {openTx.meta?.model && <Chip size="small" label={`model: ${openTx.meta.model}`} />}
                  </Stack>
                  <Divider sx={{ my: 2 }} />

                  {openTx.type==="sft" && (
                    <Box>
                      <Typography variant="subtitle2">Prompt</Typography>
                      <Typography variant="body2" sx={{ whiteSpace:"pre-wrap", mb:2 }}>{openTx.payload.prompt}</Typography>
                      <Typography variant="subtitle2">Response</Typography>
                      <Typography variant="body2" sx={{ whiteSpace:"pre-wrap" }}>{openTx.payload.response}</Typography>
                    </Box>
                  )}
                  {openTx.type==="pairwise" && (
                    <Box>
                      <Typography variant="subtitle2">Prompt</Typography>
                      <Typography variant="body2" sx={{ whiteSpace:"pre-wrap", mb:2 }}>{openTx.payload.prompt}</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2">Candidate A</Typography>
                          <Typography variant="body2" sx={{ whiteSpace:"pre-wrap" }}>{openTx.payload.A}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2">Candidate B</Typography>
                          <Typography variant="body2" sx={{ whiteSpace:"pre-wrap" }}>{openTx.payload.B}</Typography>
                        </Grid>
                      </Grid>
                      <Typography sx={{ mt: 2 }}><b>Choice:</b> {openTx.payload.choice}</Typography>
                      {openTx.payload.notes && <Typography variant="body2"><b>Notes:</b> {openTx.payload.notes}</Typography>}
                    </Box>
                  )}
                  {openTx.type==="dialogue" && (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Transcript</Typography>
                      <Stack spacing={1} sx={{ mb: 2 }}>
                        {(openTx.payload.transcript||[]).map((t,i)=>(
                          <Box key={i} sx={{ p:1.5, border:"1px solid #eee", borderRadius:1, bgcolor: t.role==="assistant"?"grey.50":"white" }}>
                            <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace:"pre-wrap" }}>{t.text}</Typography>
                          </Box>
                        ))}
                      </Stack>
                      {Array.isArray(openTx.payload.ratings) && openTx.payload.ratings.length>0 && (
                        <>
                          <Typography variant="subtitle2">Per-turn Ratings</Typography>
                          {openTx.payload.ratings.map((r,i)=>(
                            <Typography key={i} variant="body2">Turn {r.turn}: help {r.help}, harmless {r.harmless}</Typography>
                          ))}
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
          </Dialog>
        </Box>
      )}

      {/* ANALYTICS (stub – keep yours) */}
      {tab===4 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><StatCard label="Avg. task time" value="~48s" sub="last 7 days" /></Grid>
          <Grid item xs={12} md={4}><StatCard label="Throughput" value="~1.2k/day" sub="aggregate" /></Grid>
          <Grid item xs={12} md={4}><StatCard label="On-time % (SLA)" value="95%" sub="last 14 days" /></Grid>
        </Grid>
      )}

      {/* QUALITY & QA (new) */}
      {tab===5 && (
        <Box>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}><StatCard label="Gold accuracy" value={qaStats.goldAccPct==null?"—":`${qaStats.goldAccPct}%`} sub={`${qaStats.goldCorrect}/${qaStats.goldTotal} gold`} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Audit pass rate" value={qaStats.auditPassPct==null?"—":`${qaStats.auditPassPct}%`} sub={`${qaStats.auditPass}/${qaStats.auditTotal} audits`} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Disagreement rate" value={qaStats.disagreeRatePct==null?"—":`${qaStats.disagreeRatePct}%`} sub={`${qaStats.needsReview}/${qaStats.total} items`} /></Grid>
            <Grid item xs={12} md={3}><StatCard label="Flag rate" value={qaStats.flagRatePct==null?"—":`${qaStats.flagRatePct}%`} sub={`${qaStats.flagged}/${qaStats.total} items`} /></Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Flag Queue</Typography>
                  {flaggedQueue.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No flagged items.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>When</TableCell>
                          <TableCell>Annotator</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {flaggedQueue.map(r => {
                          const ann = getAnnotatorById(r.annotatorId);
                          return (
                            <TableRow key={r.id}>
                              <TableCell>{new Date(r.ts).toLocaleString()}</TableCell>
                              <TableCell>{ann?.name || r.annotatorId}</TableCell>
                              <TableCell>{r.type}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button size="small" onClick={()=>resolveFlag(r, "accepted")}>Accept</Button>
                                  <Button size="small" color="warning" onClick={()=>sendToReview(r)}>Send to Review</Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Disagreements / Needs Review</Typography>
                  {disagreeQueue.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No items need review.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>When</TableCell>
                          <TableCell>Annotator</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Adjudication</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {disagreeQueue.map(r => {
                          const ann = getAnnotatorById(r.annotatorId);
                          return (
                            <TableRow key={r.id}>
                              <TableCell>{new Date(r.ts).toLocaleString()}</TableCell>
                              <TableCell>{ann?.name || r.annotatorId}</TableCell>
                              <TableCell>{r.type}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={1}>
                                  <Button size="small" onClick={()=>adjudicate(r, "accepted")}>Accept</Button>
                                  <Button size="small" color="warning" onClick={()=>adjudicate(r, "rejected")}>Reject</Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* COMPLIANCE & AUDIT (new) */}
      {tab===6 && (
        <Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Label metadata coverage</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Field</TableCell>
                        <TableCell>Present</TableCell>
                        <TableCell>Coverage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {["annotatorId","ts","meta.policyVersion","meta.uiVersion"].map(field => {
                        const present = responses.filter(r => {
                          if (field==="annotatorId") return !!r.annotatorId;
                          if (field==="ts") return !!r.ts;
                          if (field==="meta.policyVersion") return !!(r.meta && r.meta.policyVersion);
                          if (field==="meta.uiVersion") return !!(r.meta && r.meta.uiVersion);
                          return false;
                        }).length;
                        return (
                          <TableRow key={field}>
                            <TableCell>{field}</TableCell>
                            <TableCell>{present}/{responses.length}</TableCell>
                            <TableCell>{pct(present, responses.length)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Policy / Config versions (diff)</Typography>
                  <Stack direction={{ xs:"column", md:"row" }} spacing={1} sx={{ mb: 1 }}>
                    <Select size="small" value={vLeft} onChange={(e)=>setVLeft(e.target.value)}>
                      {policyVersions.map(v => <MenuItem key={v.id} value={v.id}>{v.label}</MenuItem>)}
                    </Select>
                    <Select size="small" value={vRight} onChange={(e)=>setVRight(e.target.value)}>
                      {policyVersions.map(v => <MenuItem key={v.id} value={v.id}>{v.label}</MenuItem>)}
                    </Select>
                  </Stack>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">Left</Typography>
                      <Box component="pre" sx={{ p:1, bgcolor:"grey.100", border:"1px solid #eee", borderRadius:1, maxHeight:240, overflow:"auto", fontSize:12 }}>
                        {jsonDiff.left}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary">Right</Typography>
                      <Box component="pre" sx={{ p:1, bgcolor:"grey.100", border:"1px solid #eee", borderRadius:1, maxHeight:240, overflow:"auto", fontSize:12 }}>
                        {jsonDiff.right}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Export history (audited)</Typography>
                  {exportHistory.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No exports logged for this project yet.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Started</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Filters</TableCell>
                          <TableCell>Format</TableCell>
                          <TableCell>Destination</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Size</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exportHistory.map(row => (
                          <TableRow key={row.id}>
                            <TableCell>{new Date(row.startedAt).toLocaleString()}</TableCell>
                            <TableCell>{row.version}</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary" noWrap title={summarizeFilters(row.filters)}>
                                {summarizeFilters(row.filters)}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.format}</TableCell>
                            <TableCell>{row.destination}</TableCell>
                            <TableCell>
                              {row.status==="Running" || row.status==="Finalizing" ? (
                                <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                                  <LinearProgress variant="determinate" value={Math.min(100,row.progress||0)} />
                                  <Typography variant="caption" color="text.secondary">{row.status}</Typography>
                                </Stack>
                              ) : (
                                row.status
                              )}
                            </TableCell>
                            <TableCell>{row.sizeBytes != null ? `${(row.sizeBytes/1024).toFixed(1)} KB` : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="center">
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>PII deletion request (demo)</Typography>
                    <TextField
                      label="Identifier (email, user id, etc.)"
                      placeholder="user@example.com"
                      size="small"
                      value={deleteDlg.identifier}
                      onChange={(e)=>setDeleteDlg(d=>({ ...d, identifier: e.target.value }))}
                    />
                    <Button variant="contained" onClick={runDeletion}>Run deletion</Button>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Compliance log</Typography>
                  {complianceLog.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No compliance events yet.</Typography>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>When</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Identifier</TableCell>
                          <TableCell>Items affected</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {complianceLog.map((e,i)=>(
                          <TableRow key={i}>
                            <TableCell>{new Date(e.ts).toLocaleString()}</TableCell>
                            <TableCell>{e.action}</TableCell>
                            <TableCell>{e.identifier}</TableCell>
                            <TableCell>{e.items.length}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

/* -------- local helpers used in Compliance table -------- */
function summarizeFilters(f = {}) {
  const bits = [];
  if (f.type && f.type !== "all") bits.push(`type=${f.type}`);
  if (f.status && f.status !== "all") bits.push(`status=${f.status}`);
  if (f.from) bits.push(`from=${f.from}`);
  if (f.to) bits.push(`to=${f.to}`);
  return bits.length ? bits.join(", ") : "none";
}