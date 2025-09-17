// ────────────────────────────────────────────────────────────────
// ConceptExtractionPage.jsx
// ----------------------------------------------------------------
import React, { useState } from "react";
import {
  Box, Paper, TextField, Button, Typography, Chip,
  Accordion, AccordionSummary, AccordionDetails,
  Checkbox, LinearProgress, Alert, Tooltip, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell
} from "@mui/material";
import ExpandMoreIcon   from "@mui/icons-material/ExpandMore";
import LockIcon         from "@mui/icons-material/Lock";
import RefreshIcon      from "@mui/icons-material/Refresh";
import { db }           from "../../../../firebase";   // ← adjust if needed
import {
  collection, query, where, getDocs,
  doc, writeBatch
} from "firebase/firestore";

const ACCENT = "#BB86FC";

/* ═══════════════════════════════════════════════════════════════
   helpers
════════════════════════════════════════════════════════════════ */
async function fetchBookData(bookId) {
  /* 1. chapterId → name → sub-array  */
  const chapSnap = await getDocs(
    query(collection(db, "chapters_demo"), where("bookId", "==", bookId))
  );
  const chapMap = {};
  chapSnap.forEach(d => {
    chapMap[d.id] = { name: d.data().name || "Untitled", subs: [] };
  });

  /* 2. sub-chapters + concept counts */
  const subSnap = await getDocs(
    query(collection(db, "subchapters_demo"), where("bookId", "==", bookId))
  );

  await Promise.all(
    subSnap.docs.map(async sDoc => {
      const sData = sDoc.data() || {};
      const subId = sDoc.id;

      const cSnap = await getDocs(
        query(collection(db, "subchapterConcepts"), where("subChapterId", "==", subId))
      );

      const parent =
        chapMap[sData.chapterId] ||
        (chapMap[sData.chapterId] = { name: "Unknown chapter", subs: [] });

      parent.subs.push({
        subId,
        name:  sData.name  || "Untitled sub-chapter",
        count: cSnap.size
      });
    })
  );

  /* 3. numerical sort helper (“10.2 …” → 10.2) */
  const num = txt => {
    const m = (txt || "").match(/^(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 1e9;
  };

  /* 4. convert to sorted array so React keeps order stable */
  return Object.entries(chapMap)
    .sort((a, b) => num(a[1].name) - num(b[1].name))
    .map(([chapId, info]) => ({
      chapId,
      chapName: info.name,
      subs: info.subs.sort((a, b) => num(a.name) - num(b.name))
    }));
}

/* ═══════════════════════════════════════════════════════════════
   component
════════════════════════════════════════════════════════════════ */
export default function ConceptExtractionPage() {
  const [bookIdInput, setBookIdInput] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [chapters,    setChapters]    = useState([]);     // [{chapId, chapName, subs:[{…}]}]
  const [selected,    setSelected]    = useState(new Set());
  const [error,       setError]       = useState("");
  const [progress,    setProgress]    = useState(null);   // null | 0-100
  const [filterMode,  setFilterMode]  = useState("all");  // "all" | "done" | "pending"

  /* ── load chapters & sub-chapters for a book ───────────────── */
  async function handleLoad() {
    const id = bookIdInput.trim();
    if (!id) return;
    try {
      setError("");
      setLoading(true);
      setChapters([]);
      setSelected(new Set());
      const data = await fetchBookData(id);
      setChapters(data);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }

  /* ── checkbox helpers ──────────────────────────────────────── */
  const toggleSub = subId => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(subId) ? n.delete(subId) : n.add(subId);
      return n;
    });
  };

  const toggleChapter = chap => {
    /* visible & *eligible* (= count===0) subs under current filter */
    const eligible = chap.subs
      .filter(s =>
        (filterMode === "all"   && s.count === 0) ||
        (filterMode === "pending" && s.count === 0)
      )
      .map(s => s.subId);

    setSelected(prev => {
      const n = new Set(prev);
      const allOn = eligible.length > 0 && eligible.every(id => n.has(id));
      eligible.forEach(id => (allOn ? n.delete(id) : n.add(id)));
      return n;
    });
  };

  /* ── send extraction requests ───────────────────────────────── */
  async function handleExtract() {
    if (selected.size === 0) return;
    try {
      setProgress(0);
      const fake = setInterval(
        () => setProgress(p => (p >= 90 ? 90 : p + 2)),
        175
      );

      const batch = writeBatch(db);
      selected.forEach(subId => {
        batch.update(
          doc(db, "subchapters_demo", subId),
          { conceptExtractionRequested: true }
        );
      });
      await batch.commit();

      clearInterval(fake);
      setProgress(100);
    } catch (e) {
      console.error(e);
      setError(e.message || "Extraction request failed");
      setProgress(null);
    }
  }

  /* ═══════════════════════════════ render ═════════════════════ */
  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto", color: "#fff" }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
        Concept&nbsp;Extraction&nbsp;Tool
      </Typography>

      {/* ── book-id entry ─────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: "#222" }}>
        <TextField
          fullWidth
          label="Book ID"
          variant="outlined"
          value={bookIdInput}
          onChange={e => setBookIdInput(e.target.value)}
          sx={{ bgcolor: "#fff", borderRadius: 1 }}
        />
        <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
          <Button
            onClick={handleLoad}
            variant="contained"
            sx={{ bgcolor: ACCENT, fontWeight: 600 }}
          >
            Load&nbsp;chapters
          </Button>
          <IconButton onClick={handleLoad} disabled={loading}>
            <RefreshIcon sx={{ color: "#888" }} />
          </IconButton>

          {/* three-state filter chip */}
          {chapters.length > 0 && (
            <Chip
              label={
                filterMode === "all"
                  ? "All"
                  : filterMode === "done"
                  ? "Done only"
                  : "Pending only"
              }
              onClick={() =>
                setFilterMode(m =>
                  m === "all" ? "done" : m === "done" ? "pending" : "all"
                )
              }
              sx={{
                bgcolor:
                  filterMode === "all"
                    ? "#555"
                    : filterMode === "done"
                    ? "#4caf50"
                    : ACCENT,
                color: "#000",
                fontWeight: 600
              }}
            />
          )}
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── accordion list ────────────────────────────────────── */}
      {chapters.map(chap => {
        /* ----- filter sub-chapters first ---------------------- */
        const subsToShow = chap.subs.filter(s =>
          filterMode === "all"
            ? true
            : filterMode === "done"
            ? s.count > 0
            : /* pending */ s.count === 0
        );

        /* if nothing survives the filter → skip whole chapter */
        if (subsToShow.length === 0) return null;

        /* ----- chapter-level checkbox state ------------------- */
        const eligible   = subsToShow.filter(s => s.count === 0).map(s => s.subId);
        const allChecked = eligible.length > 0 && eligible.every(id => selected.has(id));
        const someChecked= eligible.some(id => selected.has(id));

        return (
          <Accordion key={chap.chapId} defaultExpanded sx={{ bgcolor: "#111", mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
              <Checkbox
                indeterminate={!allChecked && someChecked}
                checked={allChecked}
                onChange={() => toggleChapter(chap)}
                sx={{ color: ACCENT, mr: 1 }}
                disabled={eligible.length === 0}
              />
              <Typography sx={{ color: "#fff", fontWeight: 600 }}>
                {chap.chapName}
              </Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#222" }}>
                    <TableCell sx={{ color: "#fff" }} />
                    <TableCell sx={{ color: "#fff" }}>Sub-chapter</TableCell>
                    <TableCell sx={{ color: "#fff" }} align="center">
                      Concepts&nbsp;#
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {subsToShow.map(s => {
                    const disabled = s.count > 0;
                    return (
                      <TableRow key={s.subId}>
                        <TableCell width={48}>
                          {disabled ? (
                            <Tooltip title="Concepts already exist">
                              <LockIcon fontSize="small" sx={{ color: "#777" }} />
                            </Tooltip>
                          ) : (
                            <Checkbox
                              size="small"
                              checked={selected.has(s.subId)}
                              onChange={() => toggleSub(s.subId)}
                              sx={{ color: ACCENT }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: "#eee" }}>{s.name}</TableCell>
                        <TableCell align="center" sx={{ color: "#ccc" }}>
                          {s.count}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AccordionDetails>
          </Accordion>
        );
      })}

      {/* ── action bar ────────────────────────────────────────── */}
      {chapters.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            disabled={selected.size === 0 || progress !== null}
            onClick={handleExtract}
            sx={{ bgcolor: ACCENT, fontWeight: 700 }}
          >
            Start&nbsp;extraction&nbsp;({selected.size})
          </Button>
        </Box>
      )}

      {progress !== null && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" sx={{ color: "#aaa" }}>
            {progress < 100 ? `Requesting… ${progress}%` : "Done! 🎉"}
          </Typography>
        </Box>
      )}
    </Box>
  );
}