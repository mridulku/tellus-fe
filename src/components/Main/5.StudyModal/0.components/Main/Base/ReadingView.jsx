import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";

import Loader from "./Loader";
 

import {
  Box,
  Button,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Typography
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import AskAIChat from "./AskAIChat";               // <-- keep the same import path
import { gptRewrite } from "./gptRewrite";         // <-- keep the same import path


import { fetchReadingTime, incrementReadingTime } from "../../../../../../store/readingSlice";
import { fetchPlan, setCurrentIndex }            from "../../../../../../store/planSlice";
import { refreshSubchapter }                     from "../../../../../../store/aggregatorSlice";  // ⬅️ add this

/* ---------------- rewrite styles ---------------- */
const STYLES = [
  { key: "original", label: "Original" },
  { key: "concise",  label: "Concise" },
  { key: "bullets",  label: "Bullet-points" },
  { key: "story",    label: "Story form" },
];

/* ---------------- local fallback when GPT is offline ---------------- */
const mockRewrite = (html, style) => {
  if (style === "concise") {
    return `<p><em>(concise)</em> ${html.replace(/<\/p><p>/g, " ")}</p>`;
  }
  if (style === "bullets") {
    const txt = html.replace(/<[^>]+>/g, "");
    return `<ul>${txt
      .split(". ")
      .filter(Boolean)
      .map((t) => `<li>${t.trim()}</li>`)
      .join("")}</ul>`;
  }
  if (style === "story") {
    return `<p><strong>🧙‍♂️ Story:</strong><br/>${html}</p>`;
  }
  return html;
};

/* ---------------- chunk helper (from legacy) ---------------- */
function chunkHtmlByParagraphs(htmlString, chunkSize = 180) {
  let sanitized = htmlString.replace(/\\n/g, "\n");
  sanitized = sanitized.replace(/\r?\n/g, " ");

  let paragraphs = sanitized
    .split(/<\/p>/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => p + "</p>");

  const pages = [];
  let currentPageHtml = "";
  let currentPageWordCount = 0;

  paragraphs.forEach((paragraph) => {
    const plainText = paragraph.replace(/<[^>]+>/g, "");
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    if (currentPageWordCount + wordCount <= chunkSize) {
      currentPageHtml += paragraph;
      currentPageWordCount += wordCount;
    } else {
      if (currentPageHtml.trim().length > 0) {
        pages.push(currentPageHtml);
      }
      currentPageHtml = paragraph;
      currentPageWordCount = wordCount;
    }
  });

  if (currentPageHtml.trim().length > 0) {
    pages.push(currentPageHtml);
  }

  return pages;
}

/* ---------------- format time ---------------- */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

  // -- jump past a chapter that is already complete --------------
 

/* ===================================================================
   ReadingView
   Merged from legacy + GPT rewrite prototype
=================================================================== */
export default function ReadingView({ activity, onNeedsRefreshStatus }) {
  // ---- legacy props & checks ----
  if (!activity) {
    return (
      <Box
        sx={{
          width: "100%", height: "100%",
          bgcolor: "#000", color: "#fff",
          display: "flex", justifyContent: "center", alignItems: "center",
          p: 2
        }}
      >
        No activity provided.
      </Box>
    );
  }
  const { subChapterId, activityId, completed } = activity;
  const isComplete = completed === true;

  // ---- Redux & dispatch ----
  const userId       = useSelector((state) => state.auth?.userId || "demoUser");
  const planId       = useSelector((state) => state.plan?.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan?.currentIndex);
  const dispatch     = useDispatch();

  // ---- subchapter & usage states (legacy) ----
  const [subChapter, setSubChapter] = useState(null);
  const [serverTime, setServerTime] = useState(0);
  const [leftoverSec, setLeftoverSec] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // track reading start for final data
  const readingStartRef = useRef(null);

  // optional day-by-day breakdown
  const [timeDetails, setTimeDetails] = useState([]);
  const [showTimeDetailsOverlay, setShowTimeDetailsOverlay] = useState(false);

  // ---- GPT tab states (from prototype) ----
  const [tab, setTab]             = useState("read");
  const [style, setStyle]         = useState("original");
  const [anchEl, setAnchEl]       = useState(null);
  const [loadingStyle, setLS]     = useState(false);

  const [selText, setSel]         = useState("");
  const [mode, setMode]           = useState("page"); // "page" or "selection"

  // local cache for rewriting
  const cache = useRef({});

  // to show a spinner while loading subchapter from server
  const [loadingSubchapter, setLoadingSubchapter] = useState(false);

  // debug overlay toggle
  const [showDebug, setShowDebug] = useState(false);

  function handleGotoNext() {
    /*  We don’t need to ping the backend again – the chapter is
        already recorded as finished – we just advance the cursor.  */
    dispatch(setCurrentIndex(currentIndex + 1));
  }

  // ---- fetch subchapter & usage on mount or subchapter change (legacy) ----
  useEffect(() => {
    if (!subChapterId) return;

    setLoadingSubchapter(true);
    setSubChapter(null);
    setServerTime(0);
    setLeftoverSec(0);
    setLastSnapMs(Date.now());
    setPages([]);
    setCurrentPageIndex(0);
    readingStartRef.current = new Date();

    async function fetchData() {
      try {
        // (A) load subchapter from server
        const res = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL}/api/subchapters/${subChapterId}`
        );
        const scData = res.data;
        setSubChapter(scData);

        // (B) fetch existing usage from aggregator
        const actionRes = await dispatch(
          fetchReadingTime({ userId, planId, subChapterId })
        );
        if (fetchReadingTime.fulfilled.match(actionRes)) {
          const existingSec = actionRes.payload || 0;
          setServerTime(existingSec);
          setLeftoverSec(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("Failed to fetch subchapter or usage:", err);
      } finally {
        setLoadingSubchapter(false);
      }
    }

    fetchData();
  }, [subChapterId, dispatch, userId, planId]);

  // ---- chunk subchapter once loaded (legacy) ----
  useEffect(() => {
    if (!subChapter?.summary) return;
    const chunked = chunkHtmlByParagraphs(subChapter.summary, 180);
    cache.current.original = chunked;
    setPages(chunked);
     // If the activity is complete, open on the last page so the
 // disabled “Reading Already Complete” button is visible.
 if (completed === true) {
   setCurrentPageIndex(chunked.length - 1);
 } else {
   setCurrentPageIndex(0);
 }
  }, [subChapter]);

  // ---- lumps-of-15 to aggregator (legacy) ----
  useEffect(() => {
    if (!lastSnapMs) return;
    if (isComplete) return;

    const heartbeatId = setInterval(async () => {
      if (leftoverSec >= 15) {
        const lumps = Math.floor(leftoverSec / 15);
        if (lumps > 0) {
          const totalToPost = lumps * 15;
          // TODO persistence
          const resultAction = await dispatch(
            incrementReadingTime({
              activityId,
              userId,
              planId,
              subChapterId,
              increment: totalToPost,
            })
          );
          if (incrementReadingTime.fulfilled.match(resultAction)) {
            const newTotal = resultAction.payload || serverTime + totalToPost;
            setServerTime(newTotal);
          } else {
            console.error("Increment reading time failed:", resultAction);
          }
          const remainder = leftoverSec % 15;
          setLeftoverSec(remainder);
          setLastSnapMs(Date.now() - remainder * 1000);
        }
      }
    }, 1000);

    return () => clearInterval(heartbeatId);
  }, [
    leftoverSec,
    lastSnapMs,
    dispatch,
    userId,
    planId,
    subChapterId,
    serverTime,
    isComplete,
    activityId,
  ]);

  // ---- local second-by-second reading time (legacy) ----
  useEffect(() => {
    if (isComplete) return;
    const timerId = setInterval(() => {
      setLeftoverSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [isComplete]);

  // ---- fetch day-by-day breakdown (legacy) ----
  useEffect(() => {
    if (!activityId) return;
    async function fetchTimeDetails() {
      try {
        ;

const resp = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
          params: { activityId, type: "read" },
        });
        if (resp.data && resp.data.details) {
          setTimeDetails(resp.data.details);
        }
      } catch (err) {
        console.error("fetchTimeDetails error:", err);
      }
    }
    fetchTimeDetails();
  }, [activityId]);

  // ---- GPT rewriting effect (from prototype) ----
  useEffect(() => {
    if (!pages || style === "original" || cache.current[style]) return;
    setLS(true);
    (async () => {
      try {
        // run requests in parallel
        const rewritten = await Promise.all(
          pages.map((html) => gptRewrite(html, style))
        );
        cache.current[style] = rewritten;
        // TODO persistence
      } catch (err) {
        console.warn("GPT failed, using mock:", err);
        cache.current[style] = pages.map((html) => mockRewrite(html, style));
      } finally {
        setLS(false);
      }
    })();
  }, [style, pages]);

  // ---- selection text for "Ask AI" tab (from prototype) ----
  const handleMouseUp = () => {
    const selection = window.getSelection().toString().trim();
    if (selection) setSel(selection);
  };

  // ---- event: next/prev page (legacy + minor UI) ----
  function handleNextPage() {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex((i) => i + 1);
    }
  }
  function handlePrevPage() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((i) => i - 1);
    }
  }

  // ---- finish reading => mark complete, re-fetch plan (legacy) ----
  async function handleFinishReading() {
    const readingEndTime = new Date();
    try {
      const oldIndex = currentIndex;

      // (A) Post reading usage
      // TODO persistence
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/submitReading`,{
        userId,
        activityId,
        subChapterId,
        readingStartTime: readingStartRef.current?.toISOString(),
        readingEndTime: readingEndTime.toISOString(),
        planId: planId ?? null,
        timestamp: new Date().toISOString(),
      });

      // (B) Mark the activity as completed
      // TODO persistence
      const payload = {
        userId,
        planId,
        activityId,
        completed: true,
      };
      if (typeof activity.replicaIndex === "number") {
        payload.replicaIndex = activity.replicaIndex;
      }

      await dispatch(refreshSubchapter(subChapterId));
      

await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, payload);

      // (C) Refresh local or parent state
      if (typeof onNeedsRefreshStatus === "function") {
        onNeedsRefreshStatus();
      }
      

const backendURL = import.meta.env.VITE_BACKEND_URL;
      const fetchUrl   = "/api/adaptive-plan";
      const fetchAction = await dispatch(
        fetchPlan({ planId, backendURL, fetchUrl })
      );
      // (D) Move to next index
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      } else {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
    } catch (err) {
      console.error("Error finishing reading:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  // ---- derived time to display ----
  const displayedTime = isComplete
    ? serverTime
    : serverTime + leftoverSec;

  
      /* ------------------------------------------------------------
         GLOBAL LOADER
         • shows while we’re still pulling the sub-chapter from the server
      ------------------------------------------------------------ */
      const isBusy = loadingSubchapter;   // ← there is no loadingBook / loadingCh here
      if (isBusy) {
        return (
          <Loader
            type="bar"          // animated bar with fake % inside Loader
            fullScreen          // blur overlay
            message="Loading your reading passage…"
          />
        );
      }




  if (!pages?.length) {
    return (
      <Box sx={{ color: "#fff", p: 4, textAlign: "center" }}>
        No content.
      </Box>
    );
  }

  // ---- pick the correct style version of the pages from cache ----
    /*  after a style switch the cache might not be ready yet —
      fallback to original pages until rewrite is finished     */
  const VIEW = cache.current[style] || pages;


  const currentPageHtml = VIEW[currentPageIndex] || "";

  // ---- render ----
  return (
    <Box
      sx={{
        width: "100%", height: "100%", bgcolor: "#000", color: "#fff",
        display: "flex", justifyContent: "center", alignItems: "center",
        p: 2
      }}
    >
      {/* main card */}
      <Box
        sx={{
          width: "85%", maxWidth: 700, height: "92%",
          bgcolor: "#111", border: "1px solid #333", borderRadius: 2,
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}
      >
        {/* header */}
        <Box
          sx={{
            bgcolor: "#222", borderBottom: "1px solid #333",
            p: 1.2, display: "flex", alignItems: "center"
          }}
        >
          {/* tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => {
              if (v === "ai") setMode(selText ? "selection" : "page");
              setTab(v);
            }}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ "& .MuiTab-root": { minHeight: 32 } }}
          >
            <Tab
              value="read"
              label={
                <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                  Read
                  {loadingStyle ? (
                    <CircularProgress size={12} sx={{ color: "#FFD700" }} />
                  ) : (
                    <Chip
                      label={STYLES.find((s) => s.key === style)?.label}
                      size="small"
                      sx={{
                        bgcolor: "primary.main", color: "#fff",
                        fontSize: 11
                      }}
                    />
                  )}
                  <IconButton
                    size="small"
                    sx={{ p: 0, color: "#bbb" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnchEl(e.currentTarget);
                    }}
                  >
                    <ArrowDropDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            />
            <Tab
              value="ai"
              label="Ask AI"
              icon={<SmartToyIcon sx={{ ml: 0.5 }} fontSize="small" />}
              iconPosition="end"
            />
          </Tabs>

          {/* subChapter title */}
          <Typography
            sx={{
              ml: 2, fontSize: 13, opacity: 0.7, maxWidth: 300,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}
          >
            {subChapter?.name || ""}
          </Typography>

          {/* time chip & debug toggler */}
          <Box
            sx={{
              ml: "auto", display: "flex", alignItems: "center", gap: 1
            }}
          >
            <Box
              sx={{
                fontSize: 14, bgcolor: "#333", px: 1, py: 0.5,
                borderRadius: 1, display: "inline-flex", alignItems: "center"
              }}
            >
              🕒 {formatTime(displayedTime)}
            </Box>
            {/* day-by-day overlay toggle if complete */}
            {isComplete && (
              <Button
                variant="text"
                size="small"
                sx={{ color: "#999" }}
                onClick={() => setShowTimeDetailsOverlay((o) => !o)}
              >
                i
              </Button>
            )}
            {/* debug info toggle */}
            <Button
              variant="text"
              size="small"
              sx={{ color: "#999" }}
              onClick={() => setShowDebug((o) => !o)}
            >
              debug
            </Button>
          </Box>
        </Box>

        {/* style menu */}
        <Menu
          anchorEl={anchEl}
          open={Boolean(anchEl)}
          onClose={() => setAnchEl(null)}
        >
          {STYLES.map((opt) => (
            <MenuItem
              key={opt.key}
              selected={opt.key === style}
              disabled={loadingStyle && opt.key !== style}
              onClick={() => {
                setAnchEl(null);
                setStyle(opt.key);
                setCurrentPageIndex(0);
              }}
            >
              {opt.label}
            </MenuItem>
          ))}
        </Menu>

        {/* main body */}
        <Box
          sx={{ flex: 1, p: 2, overflowY: "auto" }}
          onMouseUp={handleMouseUp}
        >
          {tab === "read" ? (
            <div
              dangerouslySetInnerHTML={{ __html: currentPageHtml }}
              style={{ fontSize: "1.1rem", lineHeight: 1.6 }}
            />
          ) : (
            <AskAIChat
              contextText={
                mode === "page"
                  ? currentPageHtml.replace(/<[^>]+>/g, " ")
                  : selText
              }
              mode={mode}
              onModeChange={setMode}
              selection={selText}
            />
          )}
        </Box>

        {/* footer nav (only for "read" tab) */}
        {tab === "read" && (
          <Box
            sx={{
              p: 1, borderTop: "1px solid #333",
              display: "flex", justifyContent: "space-between"
            }}
          >
            <Button
              size="small"
              variant="outlined"
              disabled={currentPageIndex === 0}
              onClick={handlePrevPage}
            >
              Previous
            </Button>
            {currentPageIndex < VIEW.length - 1 && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleNextPage}
              >
                Next
              </Button>
            )}
                       {/* last-page action button */}
            {currentPageIndex === VIEW.length - 1 && (
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={isComplete ? handleGotoNext : handleFinishReading}
              >
                {isComplete ? "Next Task" : "Finish Reading"}
              </Button>
            )}


          </Box>
        )}
      </Box>

      {/* Day-by-day overlay */}
      {showTimeDetailsOverlay && (
        <Box
          sx={{
            position: "absolute", top: 80,
            backgroundColor: "#222", border: "1px solid #444",
            borderRadius: 1, p: 2, maxWidth: 300, zIndex: 9999
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Reading Time Breakdown
          </Typography>
          {timeDetails && timeDetails.length > 0 ? (
            <ul style={{ paddingLeft: "1.25rem" }}>
              {timeDetails.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "0.4rem" }}>
                  <strong>{item.dateStr || "No date"}</strong>:
                  {" "}{item.totalSeconds} sec
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">No data found.</Typography>
          )}
        </Box>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <Box
          sx={{
            position: "absolute", top: 80, right: 16,
            backgroundColor: "#222", border: "1px solid #444",
            borderRadius: 1, p: 1.5, width: 300, zIndex: 9999
          }}
        >
          <Typography variant="h6">Debug Info</Typography>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
{JSON.stringify(
  {
    activity,
    subChapter,
    serverTime,
    leftoverSec,
    currentPageIndex,
    totalPages: VIEW.length,
    completed,
  },
  null,
  2
)}
          </pre>
        </Box>
      )}
    </Box>
  );
}