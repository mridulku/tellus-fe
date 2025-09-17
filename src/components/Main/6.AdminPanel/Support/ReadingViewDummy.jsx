/*  ReadingViewDummy.jsx  – Firestore + GPT rewrite  */
import React, { useEffect, useRef, useState } from "react";
import {
  Box, Button, Tabs, Tab, Chip, IconButton, Menu, MenuItem,
  CircularProgress, Typography
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SmartToyIcon      from "@mui/icons-material/SmartToy";
import { doc, getDoc }   from "firebase/firestore";
import { db }            from "../../../../firebase";
import AskAIChat         from "./AskAIChat";
import { gptRewrite }    from "./gptRewrite";          // ← GPT helper

/* ───────── firestore doc ───────── */
const DOC_ID  = "03Bbhr3JbG3uhmAF7lRy";
const COLLECT = "subchapters_demo";

/* ───────── rewrite styles ───────── */
const STYLES = [
  { key: "original", label: "Original"      },
  { key: "concise",  label: "Concise"       },
  { key: "bullets",  label: "Bullet-points" },
  { key: "story",    label: "Story form"    },
];

/* ───────── local fallback when GPT is offline ───────── */
const mockRewrite = (html, style) => {
  if (style === "concise")
    return `<p><em>(concise)</em> ${html.replace(/<\/p><p>/g, " ")}</p>`;
  if (style === "bullets") {
    const txt = html.replace(/<[^>]+>/g, "");
    return `<ul>${txt.split(". ").filter(Boolean)
      .map(t => `<li>${t.trim()}</li>`).join("")}</ul>`;
  }
  if (style === "story")
    return `<p><strong>🧙‍♂️ Story:</strong><br/>${html}</p>`;
  return html;
};

/* ───────── chunk helper ───────── */
const chunkHtml = (html, words = 60) =>
  html.split(" ").reduce((a, w, i) => {
    const idx = Math.floor(i / words);
    (a[idx] ??= []).push(w);
    return a;
  }, []).map(arr => `<p>${arr.join(" ")}</p>`);

/* =================================================================== */
export default function ReadingViewDummy() {
  /* ------------ state ------------- */
  const [pages, setPages]     = useState(null);
  const [title, setTitle]     = useState("");
  const [loadingDoc, setLD]   = useState(true);

  const [tab, setTab]         = useState("read");
  const [pageIdx, setPageIdx] = useState(0);
  const [seconds, setSec]     = useState(0);

  const [style, setStyle]     = useState("original");
  const [anchEl, setAnchEl]   = useState(null);
  const [loadingStyle, setLS] = useState(false);
  const cache = useRef({});                         // styleKey -> pages[]

  const [selText, setSel]     = useState("");
  const [mode, setMode]       = useState("page");

  /* ------------ timers & fetches ------------- */
  /* clock */
  useEffect(() => {
    const id = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  /* Firestore fetch */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, COLLECT, DOC_ID));
        if (!snap.exists()) throw new Error("Doc not found");
        const { summary = "", name = "" } = snap.data();
        const orig = chunkHtml(summary, 60);
        cache.current.original = orig;
        setPages(orig);
        setTitle(name);
      } catch (e) {
        console.error(e);
        setPages([]);
      }
      setLD(false);
    })();
  }, []);

  /* GPT rewrite fetch */
  useEffect(() => {
    if (!pages || style === "original" || cache.current[style]) return;

    (async () => {
      setLS(true);
      try {
        /* run requests in parallel for speed */
        const rewritten = await Promise.all(
          pages.map(html => gptRewrite(html, style))
        );
        cache.current[style] = rewritten;
      } catch (err) {
        console.warn("GPT failed, using mock:", err);
        cache.current[style] = pages.map(html => mockRewrite(html, style));
      } finally {
        setLS(false);
      }
    })();
  }, [style, pages]);

  /* ------------ guards ------------- */
  if (loadingDoc)
    return (
      <Box sx={{ w: "100%", h: "100%", bgcolor: "#000", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress sx={{ color: "#FFD700" }} />
      </Box>
    );
  if (!pages?.length)
    return <Box sx={{ color: "#fff", p: 4, textAlign: "center" }}>No content.</Box>;

  /* ------------ helpers ------------- */
  const VIEW = cache.current[style] || pages;
  const handleMouseUp = () => setSel(window.getSelection().toString().trim());

  /* ------------ UI ------------- */
  return (
    <Box sx={{ w: "100%", h: "100%", bgcolor: "#000", color: "#fff", p: 2, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Box sx={{ w: "85%", maxWidth: 700, h: "92%", bgcolor: "#111", border: "1px solid #333", borderRadius: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* header */}
        <Box sx={{ bgcolor: "#222", borderBottom: "1px solid #333", p: 1.2, display: "flex", alignItems: "center" }}>
          <Tabs
            value={tab}
            onChange={(_, v) => { if (v === "ai") setMode(selText ? "selection" : "page"); setTab(v); }}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ "& .MuiTab-root": { minHeight: 32 } }}
          >
            <Tab
              value="read"
              label={
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: .5 }}>
                  Read
                  {loadingStyle
                    ? <CircularProgress size={12} sx={{ color: "#FFD700" }} />
                    : <Chip label={STYLES.find(s => s.key === style)?.label} size="small" sx={{ bgcolor: "primary.main", color: "#fff", fontSize: 11 }} />}
                  <IconButton size="small" sx={{ p: 0, color: "#bbb" }} onClick={(e) => { e.stopPropagation(); setAnchEl(e.currentTarget); }}>
                    <ArrowDropDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
            <Tab
              value="ai"
              label="Ask AI"
              icon={<SmartToyIcon sx={{ ml: .5 }} fontSize="small" />}
              iconPosition="end"
            />
          </Tabs>

          <Typography sx={{ ml: 2, fontSize: 13, opacity: .7, maxWidth: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </Typography>

          <Box sx={{ ml: "auto", fontSize: 14, bgcolor: "#333", px: 1, py: .5, borderRadius: 1, display: "flex", alignItems: "center", gap: .5 }}>
            🕒 {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
          </Box>
        </Box>

        {/* style picker */}
        <Menu anchorEl={anchEl} open={Boolean(anchEl)} onClose={() => setAnchEl(null)}>
          {STYLES.map(opt => (
            <MenuItem
              key={opt.key}
              selected={opt.key === style}
              disabled={loadingStyle && opt.key !== style}
              onClick={() => { setAnchEl(null); setStyle(opt.key); setPageIdx(0); }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Menu>

        {/* body */}
        <Box sx={{ flex: 1, p: 2, overflowY: "auto" }} onMouseUp={handleMouseUp}>
          {tab === "read" ? (
            <div dangerouslySetInnerHTML={{ __html: VIEW[pageIdx] }} style={{ fontSize: "1.1rem", lineHeight: 1.6 }} />
          ) : (
            <AskAIChat
              contextText={mode === "page" ? VIEW[pageIdx].replace(/<[^>]+>/g, " ") : selText}
              mode={mode}
              onModeChange={setMode}
              selection={selText}
            />
          )}
        </Box>

        {/* footer nav */}
        {tab === "read" && (
          <Box sx={{ p: 1, borderTop: "1px solid #333", display: "flex", justifyContent: "space-between" }}>
            <Button size="small" variant="outlined" disabled={pageIdx === 0} onClick={() => setPageIdx(i => i - 1)}>
              Previous
            </Button>
            <Button size="small" variant="outlined" disabled={pageIdx === VIEW.length - 1} onClick={() => setPageIdx(i => i + 1)}>
              Next
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}