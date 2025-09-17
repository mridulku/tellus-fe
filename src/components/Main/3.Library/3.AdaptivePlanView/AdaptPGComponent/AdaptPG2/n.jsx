/* ────────────────────────────────────────────────────────────────
   File:  AdaptPG2.jsx                (2025-05-06 – compact “range” switch)
───────────────────────────────────────────────────────────────── */
import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import DayActivities from "./DayActivities";
import Loader        from "./Loader";               // ← adjust path if needed

/* ───────── helpers ───────── */
const dateOnly     = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseCreated = p => {
  const s = p?.createdAt?.seconds ?? p?.createdAt?._seconds;
  return s ? dateOnly(new Date(s * 1000)) : dateOnly(new Date());
};
const addDays      = (d, n) => dateOnly(new Date(+d + n * 86400000));
const fmt          = d => d.toLocaleDateString("en-US",
                          { month:"short", day:"numeric", year:"numeric" });

/* ───────── component ───────── */
export default function AdaptPG2({ userId, plan, planId, onOpenPlanFetcher }) {
  /* ── early guards ───────────────────────────── */
  if (!plan)                   return <Typography>No plan object provided.</Typography>;
  if (!plan.sessions?.length)  return <Typography>No sessions found in this plan.</Typography>;

  /* ── derived meta  ──────────────────────────── */
  const dispatch   = useDispatch();
  const bookName   = plan.bookName || plan.bookTitle || plan.title || "";
  const createdAt  = parseCreated(plan);
  const todayDate  = dateOnly(new Date());

  const metaArr = useMemo(
    () =>
      plan.sessions.map(sess => {
        const n     = Number(sess.sessionLabel);
        const date  = addDays(createdAt, n - 1);
        const label = date.getTime() === todayDate.getTime()
          ? `Today (${fmt(date)})`
          : `Day ${n} (${fmt(date)})`;
        return { idx:n-1, date, label, sess };
      }),
    [plan.sessions, createdAt, todayDate]
  );

  const history = metaArr.filter(m => m.date <  todayDate);
  const today   = metaArr.filter(m => m.date.getTime() === todayDate.getTime());
  const future  = metaArr.filter(m => m.date >  todayDate);

  /* ── “range” dropdown state  (history / today / future) ──── */
  const initialRange =
          today.length   ? "today"   :
          history.length ? "history" :
          "future";
  const [range, setRange] = useState(initialRange);

  /* ── expanded accordion & per-day cache ──────────────────── */
  const [expandedDay, setExp] = useState(null);
  const [dayCache,    setCache] = useState({}); // { dayIdx : {...} }

  /* ── fetch helper (unchanged logic) ──────────────────────── */
  const fetchDay = useCallback(
    async meta => {
      if (dayCache[meta.idx]) return;
      const acts             = meta.sess.activities || [];
      const timeMap          = {};
      const subMap           = {};
      const timeLogs         = [];
      const statLogs         = [];

      for (const act of acts) {
        if (!act.activityId) continue;
        const type = act.type?.toLowerCase().includes("read") ? "read" : "quiz";
        const req  = { activityId:act.activityId, type };
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`,
          { params:req }
        );
        timeMap[act.activityId] = data?.totalTime || 0;
        timeLogs.push({ field:"timeSpent", activityId:act.activityId,
                        usedApi:"/api/getActivityTime", requestPayload:req,
                        responsePayload:data });
      }
      const subIds = [...new Set(acts.map(a => a.subChapterId).filter(Boolean))];
      for (const sid of subIds) {
        const req   = { userId, planId, subchapterId:sid };
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`,
          { params:req }
        );
        subMap[sid] = data;
        statLogs.push({ field:"subchapterStatus", subchapterId:sid,
                        usedApi:"/subchapter-status", requestPayload:req,
                        responsePayload:data });
      }
      const dateISO = meta.date.toISOString().slice(0,10); // “YYYY-MM-DD”
      setCache(c => ({
        ...c,
        [meta.idx]: { dateISO, acts, timeMap, subMap, timeLogs, statLogs }
      }));
    },
    [dayCache, userId, planId]
  );

  const handleAcc = meta => async (_e, open) => {
    setExp(open ? meta.idx : null);
    if (open) await fetchDay(meta);
  };

  /* ── dialog states (unchanged) ───────────────────────────── */
  const [debugOpen,     setDebugOpen]     = useState(false);
  const [debugTitle,    setDebugTitle]    = useState("");
  const [debugData,     setDebugData]     = useState(null);

  const [historyOpen,   setHistoryOpen]   = useState(false);
  const [historyTitle,  setHistoryTitle]  = useState("");
  const [historyData,   setHistoryData]   = useState(null);

  const [prevOpen,      setPrevOpen]      = useState(false);
  const [prevTitle,     setPrevTitle]     = useState("");
  const [prevItems,     setPrevItems]     = useState([]);

  const [progressOpen,  setProgressOpen]  = useState(false);
  const [progressTitle, setProgressTitle] = useState("");
  const [progressData,  setProgressData]  = useState(null);

  const [timeOpen,      setTimeOpen]      = useState(false);
  const [timeTitle,     setTimeTitle]     = useState("");
  const [timeData,      setTimeData]      = useState([]);

  const close = fn => () => fn(false);

  /* ── renderer helpers ────────────────────────────────────── */
  const renderDay = cached => (
    <DayActivities
      userId={userId}
      planId={planId}
      bookName={bookName}
      activities={cached.acts}
      timeMap={cached.timeMap}
      sessionDateISO={cached.dateISO}
      subchapterStatusMap={cached.subMap}
      dispatch={dispatch}
      setCurrentIndex={setCurrentIndex}
      onOpenPlanFetcher={onOpenPlanFetcher}
      /* many modal setters – unchanged */
      setDebugOpen={setDebugOpen}     setDebugTitle={setDebugTitle}   setDebugData={setDebugData}
      setHistoryOpen={setHistoryOpen} setHistoryTitle={setHistoryTitle} setHistoryData={setHistoryData}
      setPrevModalOpen={setPrevOpen}  setPrevModalTitle={setPrevTitle} setPrevModalItems={setPrevItems}
      setProgressOpen={setProgressOpen} setProgressTitle={setProgressTitle} setProgressData={setProgressData}
      setTimeDetailOpen={setTimeOpen}   setTimeDetailTitle={setTimeTitle}   setTimeDetailData={setTimeData}
      timeFetchLogs={cached.timeLogs}
      statusFetchLogs={cached.statLogs}
    />
  );

  const panel = meta => (
    <Accordion key={meta.idx}
               expanded={expandedDay === meta.idx}
               onChange={handleAcc(meta)}
               sx={{ background:"#2F2F2F", color:"#FFD700", mb:1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color:"#FFD700" }} />}>
        <Typography fontWeight={600}>{meta.label}</Typography>
      </AccordionSummary>

      <AccordionDetails>
        {!dayCache[meta.idx] && expandedDay === meta.idx ? (
          <Loader type="bar" accent="#FFD700" determinate={false} />
        ) : (
          dayCache[meta.idx] && renderDay(dayCache[meta.idx])
        )}
      </AccordionDetails>
    </Accordion>
  );

  /* ── data list picked by current “range” ─────────────────── */
  const rangeMap = { history, today, future };
  const list     = rangeMap[range] || [];

  /* ───────────────────── render ───────────────────────────── */
  return (
    <Box sx={{ color:"#fff", mt:2 }}>
      {/* ── header row with dropdown pill ─────────────────── */}
      <Box sx={{
        display:"flex",
        alignItems:"center",
        gap:1,
        mb:2,
        flexWrap:"wrap"
      }}>
        <Typography variant="h6" sx={{ mr:1 }}>Tasks</Typography>

        <Select
          size="small"
          value={range}
          onChange={e => setRange(e.target.value)}
          sx={{
            "& .MuiSelect-select": { py:0.5, px:1.5 },
            bgcolor:"#333",
            color:"#FFD700",
            fontWeight:600,
            borderRadius:2,
            minWidth:110,
          }}
        >
          <MenuItem value="history">
            History&nbsp;
            <Chip
              label={history.length}
              size="small"
              sx={{ ml:1, height:18, bgcolor:"#555", color:"#fff" }}
            />
          </MenuItem>
          <MenuItem value="today">
            Today&nbsp;
            <Chip
              label={today.length}
              size="small"
              sx={{ ml:1, height:18, bgcolor:"#555", color:"#fff" }}
            />
          </MenuItem>
          <MenuItem value="future">
            Future&nbsp;
            <Chip
              label={future.length}
              size="small"
              sx={{ ml:1, height:18, bgcolor:"#555", color:"#fff" }}
            />
          </MenuItem>
        </Select>
      </Box>

      {/* ── body list (accordion or cards) ─────────────────── */}
      {list.length === 0 ? (
        <Typography>
          {range === "today"   && "No session for today."}
          {range === "history" && "No past sessions."}
          {range === "future"  && "No upcoming sessions."}
        </Typography>
      ) : (
        list.map(panel)
      )}

      {/* ── (all the dialogs remain exactly as before) ─────── */}
      {/* Debug / History / Previous Items / Progress / Time */}
      {/*  … unchanged dialog markup … */}
      {/* ----- DEBUG DIALOG ----- */}
      <Dialog open={debugOpen} fullWidth maxWidth="md" onClose={close(setDebugOpen)}>
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ background:"#222" }}>
          {debugData
            ? <pre style={{ color:"#0f0", fontSize:"0.85rem", whiteSpace:"pre-wrap" }}>
                {JSON.stringify(debugData,null,2)}
              </pre>
            : <Typography>No data.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background:"#222" }}>
          <Button onClick={close(setDebugOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

     
    </Box>
  );
}