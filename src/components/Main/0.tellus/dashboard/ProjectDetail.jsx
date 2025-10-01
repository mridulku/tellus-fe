// src/components/Main/0.tellus/dashboard/ProjectDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Breadcrumbs, Link, Chip, Grid, Card, CardContent, Stack,
  Tabs, Tab, Divider, Button, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { getProjectById, getAnnotatorById } from "./data/providerSampleData";

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
function pct(n, d) {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}
const short = (t, n = 80) => (t || "").length > n ? (t || "").slice(0, n) + "…" : (t || "");

/* ---------------- Main ---------------- */
export default function ProjectDetail({ projectId, onBack }) {
  const baseProject = useMemo(() => getProjectById(projectId), [projectId]);
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const [fAnnotator, setFAnnotator] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [openTx, setOpenTx] = useState(null); // dialog item

  if (!baseProject) return <Typography>Project not found.</Typography>;

  // All responses for this project (already type-specific in data)
  const responses = useMemo(() => Array.isArray(baseProject.responses) ? baseProject.responses : [], [baseProject.responses]);
  const annotators = useMemo(
    () => (baseProject.workforce?.assignedAnnotators || []).map(getAnnotatorById).filter(Boolean),
    [baseProject.workforce]
  );

  /* --------- Counts for Progress --------- */
  const counts = useMemo(() => {
    const total = responses.length;
    const done = responses.filter(r => r.status === "accepted").length;
    const inReview = responses.filter(r => r.status === "needs_review").length;
    const flags = responses.filter(r => r.status === "flagged").length;
    const itemsTotal = baseProject.progress?.itemsTotal ?? total;
    const remaining = Math.max(itemsTotal - done, 0);
    return { total, done, inReview, flags, remaining, itemsTotal };
  }, [responses, baseProject.progress]);

  /* --------- Filtered list for Items tab --------- */
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return responses.filter(r => {
      const matchAnnot = fAnnotator === "all" || r.annotatorId === fAnnotator;
      const matchStatus = fStatus === "all" || r.status === fStatus;
      const hay =
        (r.payload?.prompt || "") + " " +
        (r.payload?.response || "") + " " +
        (r.payload?.A || "") + " " +
        (r.payload?.B || "") + " " +
        (r.payload?.notes || "");
      const matchQ = !ql || hay.toLowerCase().includes(ql);
      return matchAnnot && matchStatus && matchQ;
    });
  }, [responses, fAnnotator, fStatus, q]);

  /* --------- Simple issue queues --------- */
  const flaggedQueue = useMemo(() => responses.filter(r => r.status === "flagged"), [responses]);
  const reviewQueue  = useMemo(() => responses.filter(r => r.status === "needs_review" || r.meta?.disagreement === true), [responses]);

  /* --------- Local mutations (demo only) --------- */
  const [overrides, setOverrides] = useState({}); // id -> patch
  useEffect(() => { setOverrides({}); }, [projectId]);

  const updateResponse = (id, patch) => {
    setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), ...patch } }));
  };
  // Runtime-composed view with overrides
  const viewResponses = useMemo(() => {
    if (!Object.keys(overrides).length) return responses;
    return responses.map(r => overrides[r.id] ? { ...r, ...overrides[r.id] } : r);
  }, [responses, overrides]);

  // Use viewResponses for queues and tables
  const vFlagged = useMemo(() => viewResponses.filter(r => r.status === "flagged"), [viewResponses]);
  const vReview  = useMemo(() => viewResponses.filter(r => r.status === "needs_review" || r.meta?.disagreement), [viewResponses]);
  const vFiltered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return viewResponses.filter(r => {
      const matchAnnot = fAnnotator === "all" || r.annotatorId === fAnnotator;
      const matchStatus = fStatus === "all" || r.status === fStatus;
      const hay =
        (r.payload?.prompt || "") + " " +
        (r.payload?.response || "") + " " +
        (r.payload?.A || "") + " " +
        (r.payload?.B || "") + " " +
        (r.payload?.notes || "");
      const matchQ = !ql || hay.toLowerCase().includes(ql);
      return matchAnnot && matchStatus && matchQ;
    });
  }, [viewResponses, fAnnotator, fStatus, q]);

  const resolveFlag = (r, decision = "accepted") => {
    updateResponse(r.id, { status: decision, meta: { ...(r.meta || {}), resolvedAt: new Date().toISOString() } });
  };
  const sendToReview = (r) => {
    updateResponse(r.id, { status: "needs_review", meta: { ...(r.meta || {}), disagreement: true } });
  };
  const adjudicate = (r, decision = "accepted") => {
    updateResponse(r.id, { status: decision, meta: { ...(r.meta || {}), disagreement: false, adjudicatedAt: new Date().toISOString() } });
  };

  /* ---------------- UI ---------------- */
  return (
    <Box>
      {/* Top breadcrumb + actions */}
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
            <Chip size="small" label={baseProject.type} />
            {baseProject.subtype && <Chip size="small" label={baseProject.subtype} />}
            <Chip size="small" label={baseProject.status} color={baseProject.status==="Active"?"success":baseProject.status==="Paused"?"warning":"default"} />
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={()=>window.alert("Export (mock).")}>Export</Button>
        </Stack>
      </Stack>

      {/* Minimal tabs: Progress / Items / Issues */}
      <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mt: 2 }}>
        <Tab label="Progress" />
        <Tab label="Items" />
        <Tab label="Issues" />
      </Tabs>
      <Divider sx={{ mb: 2 }} />

      {/* PROGRESS */}
      {tab===0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><StatCard label="Done"       value={counts.done}           sub={`${pct(counts.done, counts.itemsTotal)} of total`} /></Grid>
          <Grid item xs={12} md={3}><StatCard label="Remaining"  value={counts.remaining}       sub={`${counts.itemsTotal} total`} /></Grid>
          <Grid item xs={12} md={3}><StatCard label="In review"  value={counts.inReview} /></Grid>
          <Grid item xs={12} md={3}><StatCard label="Flags"      value={counts.flags} /></Grid>
        </Grid>
      )}

      {/* ITEMS */}
      {tab===1 && (
        <Box>
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs:"column", md:"row" }} spacing={2} alignItems="center">
                <TextField label="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
                <Select value={fStatus} onChange={(e)=>setFStatus(e.target.value)} displayEmpty>
                  <MenuItem value="all">All status</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="flagged">Flagged</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="needs_review">Needs review</MenuItem>
                </Select>
                <Select value={fAnnotator} onChange={(e)=>setFAnnotator(e.target.value)} displayEmpty>
                  <MenuItem value="all">All people</MenuItem>
                  {annotators.map(a => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
                </Select>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="outlined" onClick={()=>window.alert("Download filtered (mock).")}>Download Filtered</Button>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>When</TableCell>
                    <TableCell>Who</TableCell>
                    <TableCell>Prompt</TableCell>
                    <TableCell>Answer / Choice</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vFiltered.map(r => {
                    const ann = getAnnotatorById(r.annotatorId);
                    const isSFT = r.type === "sft";
                    const isPW  = r.type === "pairwise";
                    const answerSnippet = isSFT
                      ? short(r.payload.response, 80)
                      : isPW
                        ? `Choice: ${r.payload.choice}${r.payload.why ? ` — ${short(r.payload.why, 40)}` : ""}`
                        : "";
                    return (
                      <TableRow key={r.id} hover>
                        <TableCell>{new Date(r.ts).toLocaleString()}</TableCell>
                        <TableCell>{ann?.name || r.annotatorId}</TableCell>
                        <TableCell><Typography variant="body2" noWrap title={r.payload?.prompt}>{short(r.payload?.prompt, 60)}</Typography></TableCell>
                        <TableCell><Typography variant="body2" noWrap title={answerSnippet}>{answerSnippet}</Typography></TableCell>
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
        </Box>
      )}

      {/* ISSUES */}
      {tab===2 && (
        <Grid container spacing={2}>
          {/* Flags */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Flags</Typography>
                {vFlagged.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No flagged items.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>Who</TableCell>
                        <TableCell>Prompt</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vFlagged.map(r => {
                        const ann = getAnnotatorById(r.annotatorId);
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.ts).toLocaleString()}</TableCell>
                            <TableCell>{ann?.name || r.annotatorId}</TableCell>
                            <TableCell><Typography variant="body2" noWrap title={r.payload?.prompt}>{short(r.payload?.prompt)}</Typography></TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button size="small" onClick={()=>setOpenTx(r)}>View</Button>
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

          {/* Needs review */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Needs review</Typography>
                {vReview.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No items need review.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>When</TableCell>
                        <TableCell>Who</TableCell>
                        <TableCell>Prompt</TableCell>
                        <TableCell align="right">Decision</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vReview.map(r => {
                        const ann = getAnnotatorById(r.annotatorId);
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{new Date(r.ts).toLocaleString()}</TableCell>
                            <TableCell>{ann?.name || r.annotatorId}</TableCell>
                            <TableCell><Typography variant="body2" noWrap title={r.payload?.prompt}>{short(r.payload?.prompt)}</Typography></TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
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
      )}

      {/* Detail dialog */}
      <Dialog open={!!openTx} onClose={()=>setOpenTx(null)} maxWidth="md" fullWidth>
        <DialogTitle>Item detail</DialogTitle>
        <DialogContent dividers>
          {!openTx ? null : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {new Date(openTx.ts).toLocaleString()} • {getAnnotatorById(openTx.annotatorId)?.name || openTx.annotatorId} • {openTx.type}
              </Typography>

              {openTx.type === "sft" && (
                <Box>
                  {/* Seed info: instruction + examples */}
                  {openTx.payload?.seed && (
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Guide for annotator</Typography>
                        <Typography variant="body2"><b>Instruction:</b> {openTx.payload.seed.instruction_for_annotator || "—"}</Typography>
                        <Typography variant="body2"><b>Sample input:</b> {openTx.payload.seed.sample_input || "—"}</Typography>
                        <Typography variant="body2"><b>Sample output:</b> {openTx.payload.seed.sample_output || "—"}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                          {String(openTx.payload.seed.tags || "")
                            .split(";")
                            .map(t => t.trim())
                            .filter(Boolean)
                            .map((t,i) => <Chip key={i} size="small" label={t} />)}
                        </Stack>
                        {openTx.payload.seed.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ display:"block", mt: 1 }}>
                            Note: {openTx.payload.seed.notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Actual prompt/answer captured */}
                  <Typography variant="subtitle2">Prompt</Typography>
                  <Typography variant="body2" sx={{ whiteSpace:"pre-wrap", mb:2 }}>{openTx.payload.prompt}</Typography>
                  <Typography variant="subtitle2">Answer</Typography>
                  <Typography variant="body2" sx={{ whiteSpace:"pre-wrap" }}>{openTx.payload.response}</Typography>
                </Box>
              )}

              {openTx.type === "pairwise" && (
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
                  <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap:"wrap" }}>
                    <Chip size="small" label={`Choice: ${openTx.payload.choice}`} />
                    {typeof openTx.payload.strength !== "undefined" && <Chip size="small" label={`How much better: ${openTx.payload.strength}`} />}
                  </Stack>
                  {openTx.payload.why && (
                    <Typography variant="body2" sx={{ mt: 1 }}><b>Why:</b> {openTx.payload.why}</Typography>
                  )}

                  {/* Optional seed reminder strip */}
                  {openTx.payload?.seed && (
                    <Card variant="outlined" sx={{ mt: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Reminders</Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                          {String(openTx.payload.seed.reminders || "")
                            .split(";")
                            .map(t => t.trim())
                            .filter(Boolean)
                            .map((t,i) => <Chip key={i} size="small" label={t} />)}
                        </Stack>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpenTx(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}