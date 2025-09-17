/* ────────────────────────────────────────────────────────────────
   File:  AdaptPG2.jsx      (2025-05-07 – Redux-driven, full version)
───────────────────────────────────────────────────────────────── */
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Box,
  Typography,
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
import { useDispatch, useSelector } from "react-redux";

import { setCurrentIndex }          from "../../../../../../store/planSlice";
import { fetchAggregatorForDay }    from "../../../../../../store/aggregatorSlice";

import DayActivities from "./DayActivities";
import Loader        from "./Loader";

/* ───── helpers ───── */
const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseCreated = (p) => {
  const s = p?.createdAt?.seconds ?? p?.createdAt?._seconds;
  return s ? dateOnly(new Date(s * 1000)) : dateOnly(new Date());
};
const addDays = (d, n) => dateOnly(new Date(+d + n * 86400000));
const fmt = (d) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ───── component ───── */
export default function AdaptPG2({
  userId,
  plan,
  planId,
  viewMode = "today",   // external controller
  onOpenPlanFetcher,
}) {
  /* ── guards ── */
  if (!plan)                 return <Typography>No plan object provided.</Typography>;
  if (!plan.sessions?.length) return <Typography>No sessions found in this plan.</Typography>;

  /* ── redux ── */
  const dispatch      = useDispatch();
  const timeMap       = useSelector((s) => s.aggregator.timeMap);
  const subchapterMap = useSelector((s) => s.aggregator.subchapterMap);
  const loadingDays   = useSelector((s) => s.aggregator.loadingDays);
  const loadedDays    = useSelector((s) => s.aggregator.loadedDays);

  /* ── accordion ── */
  const [expandedDay, setExpandedDay] = useState(null);

  /* ── dialogs state (must come before helpers that reference setters) ── */
  const [debugOpen, setDebugOpen]         = useState(false);
  const [debugTitle, setDebugTitle]       = useState("");
  const [debugData, setDebugData]         = useState(null);
  const [historyOpen, setHistoryOpen]     = useState(false);
  const [historyTitle, setHistoryTitle]   = useState("");
  const [historyData, setHistoryData]     = useState(null);
  const [prevOpen, setPrevOpen]           = useState(false);
  const [prevTitle, setPrevTitle]         = useState("");
  const [prevItems, setPrevItems]         = useState([]);
  const [progressOpen, setProgressOpen]   = useState(false);
  const [progressTitle, setProgressTitle] = useState("");
  const [progressData, setProgressData]   = useState(null);
  const [timeOpen, setTimeOpen]           = useState(false);
  const [timeTitle, setTimeTitle]         = useState("");
  const [timeData, setTimeData]           = useState([]);

  const close = (fn) => () => fn(false);

  /* ── plan meta ── */
  const bookName  = plan.bookName || plan.bookTitle || plan.title || "";
  const createdAt = parseCreated(plan);
  const todayDate = React.useMemo(() => dateOnly(new Date()), []);

  const metaArr = useMemo(
    () =>
      plan.sessions.map((sess) => {
        const n    = Number(sess.sessionLabel);
        const date = addDays(createdAt, n - 1);
        const label =
          date.getTime() === todayDate.getTime()
            ? `Today (${fmt(date)})`
            : `Day ${n} (${fmt(date)})`;
        return { idx: n - 1, date, label, sess };
      }),
    [plan.sessions, createdAt, todayDate]
  );

  const history = metaArr.filter((m) => m.date < todayDate);
  const today   = metaArr.filter((m) => m.date.getTime() === todayDate.getTime());
  const future  = metaArr.filter((m) => m.date > todayDate);

  const sessionList =
    viewMode === "history" ? history :
    viewMode === "future"  ? future  :
                             today;

  /* ── hydrate helper ── */
   const ensureHydrated = useCallback(
       (idx) => dispatch(fetchAggregatorForDay({ dayIndex: idx })),
       [dispatch]
     );

  /* ── accordion toggle handler ── */
  const handleAcc = (meta) => (_e, open) => {
    setExpandedDay(open ? meta.idx : null);
    if (open) ensureHydrated(meta.idx);
  };

  /* ── auto-hydrate “today only” view ── */
  useEffect(() => {
      if (viewMode === "today") {
          const idx = metaArr.findIndex(
            (m) => m.date.getTime() === todayDate.getTime()
          );
          if (idx !== -1) ensureHydrated(idx);
        }
      }, [viewMode, ensureHydrated]);   //  <-- primitives only

  /* ── helper to render a day ── */
  const renderDay = (meta) => (
    <DayActivities
      userId={userId}
      planId={planId}
      bookName={bookName}
      activities={meta.sess.activities || []}
      timeMap={timeMap}
      subchapterStatusMap={subchapterMap}
      sessionDateISO={meta.date.toISOString().slice(0, 10)}
      dispatch={dispatch}
      setCurrentIndex={setCurrentIndex}
      onOpenPlanFetcher={onOpenPlanFetcher}
      /* modal setters */
      setDebugOpen={setDebugOpen}       setDebugTitle={setDebugTitle}       setDebugData={setDebugData}
      setHistoryOpen={setHistoryOpen}   setHistoryTitle={setHistoryTitle}   setHistoryData={setHistoryData}
      setPrevModalOpen={setPrevOpen}    setPrevModalTitle={setPrevTitle}    setPrevModalItems={setPrevItems}
      setProgressOpen={setProgressOpen} setProgressTitle={setProgressTitle} setProgressData={setProgressData}
      setTimeDetailOpen={setTimeOpen}   setTimeDetailTitle={setTimeTitle}   setTimeDetailData={setTimeData}
    />
  );

  /* ── single accordion panel ── */
  const panel = (meta) => {
    const isLoading = !!loadingDays[meta.idx];
    const isLoaded  = !!loadedDays [meta.idx];

    return (
      <Accordion
        key={meta.idx}
        expanded={expandedDay === meta.idx}
        onChange={handleAcc(meta)}
        sx={{ background: "transparent", border: "none", color: "#FFD700", mb: 0.5 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#FFD700" }} />}>
          <Typography fontWeight={600}>{meta.label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {isLoading && <Loader type="bar" accent="#FFD700" determinate={false} />}
          {isLoaded  && renderDay(meta)}
        </AccordionDetails>
      </Accordion>
    );
  };

  /* ── TODAY-ONLY shortcut ── */
  if (viewMode === "today" && sessionList.length === 1) {
    const meta      = sessionList[0];
    const isLoading = !!loadingDays[meta.idx];
    const isLoaded  = !!loadedDays [meta.idx];

    return (
      <Box sx={{ mt: 2 }}>
        {isLoading && (
          <Box sx={{ px: 2, py: 1 }}>
            <Loader type="bar" accent="#FFD700" determinate={false} />
          </Box>
        )}
        {isLoaded && renderDay(meta)}

        {/* ───── dialogs block (unchanged markup) ───── */}
        {/* DEBUG */}
        <Dialog open={debugOpen} fullWidth maxWidth="md" onClose={close(setDebugOpen)}>
          <DialogTitle>{debugTitle}</DialogTitle>
          <DialogContent sx={{ background: "#222" }}>
            {debugData ? (
              <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(debugData, null, 2)}
              </pre>
            ) : (
              <Typography>No data.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ background: "#222" }}>
            <Button onClick={close(setDebugOpen)} variant="contained" color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* HISTORY */}
        <Dialog open={historyOpen} fullWidth maxWidth="md" onClose={close(setHistoryOpen)}>
          <DialogTitle>{historyTitle}</DialogTitle>
          <DialogContent sx={{ background: "#222" }}>
            {historyData ? (
              <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(historyData, null, 2)}
              </pre>
            ) : (
              <Typography>No history.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ background: "#222" }}>
            <Button onClick={close(setHistoryOpen)} variant="contained" color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* PREVIOUS-ITEMS */}
        <Dialog open={prevOpen} fullWidth maxWidth="sm" onClose={close(setPrevOpen)}>
          <DialogTitle>{prevTitle}</DialogTitle>
          <DialogContent sx={{ background: "#222" }}>
            {prevItems.length ? (
              <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
                {prevItems.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            ) : (
              <Typography>No data.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ background: "#222" }}>
            <Button onClick={close(setPrevOpen)} variant="contained" color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* PROGRESS */}
        <Dialog open={progressOpen} fullWidth maxWidth="sm" onClose={close(setProgressOpen)}>
          <DialogTitle>{progressTitle}</DialogTitle>
          <DialogContent sx={{ background: "#222", color: "#fff" }}>
            {progressData && !progressData.error ? (
              <Typography>
                Mastery:&nbsp;
                <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong>
              </Typography>
            ) : (
              <Typography sx={{ color: "#f88" }}>
                {progressData?.error || "No progress."}
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ background: "#222" }}>
            <Button onClick={close(setProgressOpen)} variant="contained" color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* TIME-DETAIL */}
        <Dialog open={timeOpen} fullWidth maxWidth="md" onClose={close(setTimeOpen)}>
          <DialogTitle>{timeTitle}</DialogTitle>
          <DialogContent sx={{ background: "#222", color: "#fff" }}>
            {timeData.length ? (
              <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
                {timeData.map((d, i) => (
                  <li key={i}>
                    DocID:{d.docId}&nbsp; Collection:{d.collection}&nbsp;
                    TotalSeconds:{d.totalSeconds}
                  </li>
                ))}
              </ul>
            ) : (
              <Typography>No details.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ background: "#222" }}>
            <Button onClick={close(setTimeOpen)} variant="contained" color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  /* ── multi-accordion render ── */
  return (
    <Box sx={{ color: "#fff", mt: 2 }}>
      {sessionList.length === 0 ? (
        <Typography>
          {viewMode === "today"   && "No session for today."}
          {viewMode === "history" && "No past sessions."}
          {viewMode === "future"  && "No upcoming sessions."}
        </Typography>
      ) : (
        sessionList.map(panel)
      )}

      {/* ───── same dialog block duplicated for the multi-accordion path ───── */}
      {/* DEBUG */}
      <Dialog open={debugOpen} fullWidth maxWidth="md" onClose={close(setDebugOpen)}>
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222" }}>
          {debugData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          ) : (
            <Typography>No data.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setDebugOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* HISTORY */}
      <Dialog open={historyOpen} fullWidth maxWidth="md" onClose={close(setHistoryOpen)}>
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222" }}>
          {historyData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(historyData, null, 2)}
            </pre>
          ) : (
            <Typography>No history.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setHistoryOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PREVIOUS-ITEMS */}
      <Dialog open={prevOpen} fullWidth maxWidth="sm" onClose={close(setPrevOpen)}>
        <DialogTitle>{prevTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222" }}>
          {prevItems.length ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {prevItems.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          ) : (
            <Typography>No data.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setPrevOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PROGRESS */}
      <Dialog open={progressOpen} fullWidth maxWidth="sm" onClose={close(setProgressOpen)}>
        <DialogTitle>{progressTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222", color: "#fff" }}>
          {progressData && !progressData.error ? (
            <Typography>
              Mastery:&nbsp;
              <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong>
            </Typography>
          ) : (
            <Typography sx={{ color: "#f88" }}>
              {progressData?.error || "No progress."}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setProgressOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* TIME-DETAIL */}
      <Dialog open={timeOpen} fullWidth maxWidth="md" onClose={close(setTimeOpen)}>
        <DialogTitle>{timeTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222", color: "#fff" }}>
          {timeData.length ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {timeData.map((d, i) => (
                <li key={i}>
                  DocID:{d.docId}&nbsp; Collection:{d.collection}&nbsp;
                  TotalSeconds:{d.totalSeconds}
                </li>
              ))}
            </ul>
          ) : (
            <Typography>No details.</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setTimeOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}