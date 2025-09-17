// File: AdaptPG.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";

import { Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

// Sub-components
import PlanOverview from "./PlanOverview";
import DayDropdown from "./DayDropdown";
import DayActivities from "./DayActivities";

// Utilities
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseCreatedAt(plan) {
  if (!plan?.createdAt) return dateOnly(new Date());
  if (plan.createdAt._seconds) return dateOnly(new Date(plan.createdAt._seconds * 1000));
  if (plan.createdAt.seconds) return dateOnly(new Date(plan.createdAt.seconds * 1000));
  return dateOnly(new Date(plan.createdAt));
}
function addDays(baseDate, daysOffset) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  return dateOnly(d);
}
function formatDate(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdaptPG({
  userId,
  plan,
  planId,
  dayDropIdx,
  onDaySelect,
  onOpenPlanFetcher,
}) {
  const dispatch = useDispatch();
  const currentIndex = useSelector((state) => state.plan.currentIndex);

  // 1) If no plan or no sessions => early return
  if (!plan) {
    return <div>No plan object provided.</div>;
  }
  if (!plan.sessions || plan.sessions.length === 0) {
    return <div>No sessions found in this plan.</div>;
  }

  // 2) Build day labels => "Today (Apr 8, 2025)", or "Day N (..)"
  const createdAtDate = parseCreatedAt(plan);
  const today = dateOnly(new Date());
  const sessions = plan.sessions;

  const dayLabels = useMemo(() => {
    return sessions.map((sess) => {
      const sNum = Number(sess.sessionLabel);
      const dayDate = addDays(createdAtDate, sNum - 1);
      const dayStr = formatDate(dayDate);
      if (dayDate.getTime() === today.getTime()) {
        return `Today (${dayStr})`;
      }
      return `Day ${sNum} (${dayStr})`;
    });
  }, [sessions, createdAtDate, today]);

  let safeDayIdx = dayDropIdx || 0;
  if (safeDayIdx < 0) safeDayIdx = 0;
  if (safeDayIdx >= sessions.length) safeDayIdx = sessions.length - 1;
  const currentSession = sessions[safeDayIdx] || {};
  const { activities = [] } = currentSession;

  // 3) aggregator fetch => timeMap, subchapterStatusMap
  const [timeMap, setTimeMap] = useState({});
  const [subchapterStatusMap, setSubchapterStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  // 3a) Logs for each aggregator call => to show in Explanation modals
  const [timeFetchLogs, setTimeFetchLogs] = useState([]);
  const [statusFetchLogs, setStatusFetchLogs] = useState([]);

  useEffect(() => {
    if (!activities.length) {
      setTimeMap({});
      setSubchapterStatusMap({});
      return;
    }

    let cancel = false;

    async function doFetch() {
      try {
        setLoading(true);

        const newTimeMap = {};
        const newTimeLogs = [];

        // 1) For each activity => getActivityTime
        for (const act of activities) {
          if (!act.activityId) continue;
          const rawType = (act.type || "").toLowerCase();
          const paramType = rawType.includes("read") ? "read" : "quiz";
          const requestPayload = { activityId: act.activityId, type: paramType };

          try {
            const timeRes = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
              params: requestPayload,
            });
            const totalTime = timeRes.data?.totalTime || 0;
            newTimeMap[act.activityId] = totalTime;

            // push log
            newTimeLogs.push({
              field: "timeSpent",
              activityId: act.activityId,
              usedApi: "/api/getActivityTime",
              requestPayload,
              responsePayload: timeRes.data,
              logic: "We fetch totalTime for reading or quiz from aggregator logs.",
              possibleValues: "Any integer >= 0, representing seconds of time spent.",
            });
          } catch (err) {
            console.error("Error fetching time for", act.activityId, err);
          }
        }

        // 2) subchapter-status => aggregator
        const uniqueSubIds = new Set();
        for (const act of activities) {
          if (act.subChapterId) uniqueSubIds.add(act.subChapterId);
        }
        const newStatusMap = {};
        const newStatusLogs = [];

        for (const subId of uniqueSubIds) {
          const requestPayload = { userId, planId, subchapterId: subId };
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`, {
              params: requestPayload,
            });
            newStatusMap[subId] = res.data;

            newStatusLogs.push({
              field: "subchapterStatus",
              subchapterId: subId,
              usedApi: "/subchapter-status",
              requestPayload,
              responsePayload: res.data,
              logic: "We fetch aggregator subchapter status to see locked/unlocked, quiz attempts, etc.",
              possibleValues: "Complex object with 'readingSummary', 'quizStages', 'taskInfo', etc.",
            });
          } catch (err) {
            console.error("Error fetching subchapter-status for", subId, err);
          }
        }

        if (!cancel) {
          setTimeMap(newTimeMap);
          setSubchapterStatusMap(newStatusMap);
          setTimeFetchLogs(newTimeLogs);
          setStatusFetchLogs(newStatusLogs);
        }
      } catch (err) {
        console.error("Error in doFetch =>", err);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    doFetch();
    return () => {
      cancel = true;
    };
  }, [activities, planId, userId]);

  // aggregator debug modals
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTitle, setDebugTitle] = useState("");
  const [debugData, setDebugData] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyData, setHistoryData] = useState(null);

  const [prevModalOpen, setPrevModalOpen] = useState(false);
  const [prevModalTitle, setPrevModalTitle] = useState("");
  const [prevModalItems, setPrevModalItems] = useState([]);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState("");
  const [progressData, setProgressData] = useState(null);

  const [timeDetailOpen, setTimeDetailOpen] = useState(false);
  const [timeDetailTitle, setTimeDetailTitle] = useState("");
  const [timeDetailData, setTimeDetailData] = useState([]);

  function handleCloseDebug() {
    setDebugOpen(false);
    setDebugTitle("");
    setDebugData(null);
  }
  function handleCloseHistory() {
    setHistoryOpen(false);
    setHistoryTitle("");
    setHistoryData(null);
  }
  function handleClosePrevious() {
    setPrevModalOpen(false);
    setPrevModalTitle("");
    setPrevModalItems([]);
  }
  function handleCloseProgress() {
    setProgressOpen(false);
    setProgressTitle("");
    setProgressData(null);
  }
  function handleCloseTimeDetail() {
    setTimeDetailOpen(false);
    setTimeDetailTitle("");
    setTimeDetailData([]);
  }

  if (loading) {
    return <div style={{ color: "#fff", marginTop: "1rem" }}>Loading aggregator data...</div>;
  }

  return (
    <Box sx={{ color: "#fff", mt: 2 }}>
      {/* 1) PlanOverview => top-level plan doc */}
      <PlanOverview planId={planId} plan={plan} />

      {/* 2) DayDropdown => pick a day */}
      <DayDropdown safeDayIdx={safeDayIdx} sessions={sessions} dayLabels={dayLabels} onDaySelect={onDaySelect} />

      {/* 3) Render day’s activities */}
      <DayActivities
        userId={userId}
        planId={planId}
        activities={activities}
        timeMap={timeMap}
        subchapterStatusMap={subchapterStatusMap}
        onOpenPlanFetcher={onOpenPlanFetcher}
        dispatch={dispatch}
        setCurrentIndex={setCurrentIndex}

        // aggregator debug modals
        setDebugOpen={setDebugOpen} setDebugTitle={setDebugTitle} setDebugData={setDebugData}
        setHistoryOpen={setHistoryOpen} setHistoryTitle={setHistoryTitle} setHistoryData={setHistoryData}
        setPrevModalOpen={setPrevModalOpen} setPrevModalTitle={setPrevModalTitle} setPrevModalItems={setPrevModalItems}
        setProgressOpen={setProgressOpen} setProgressTitle={setProgressTitle} setProgressData={setProgressData}
        setTimeDetailOpen={setTimeDetailOpen} setTimeDetailTitle={setTimeDetailTitle} setTimeDetailData={setTimeDetailData}

        // aggregator logs => we’ll show them in “info” modals if user clicks
        timeFetchLogs={timeFetchLogs}
        statusFetchLogs={statusFetchLogs}
      />

      {/* aggregator debug modals */}
      <Dialog open={debugOpen} onClose={handleCloseDebug} fullWidth maxWidth="md">
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {debugData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: "#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseDebug} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={handleCloseHistory} fullWidth maxWidth="md">
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {historyData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(historyData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: "#fff" }}>No history data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseHistory} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={prevModalOpen} onClose={handleClosePrevious} fullWidth maxWidth="sm">
        <DialogTitle>{prevModalTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {prevModalItems && prevModalItems.length > 0 ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {prevModalItems.map((line, idx) => (
                <li key={idx} style={{ marginBottom: "0.4rem" }}>
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleClosePrevious} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={progressOpen} onClose={handleCloseProgress} fullWidth maxWidth="sm">
        <DialogTitle>{progressTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {progressData && !progressData.error ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mastery: <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong>
              </Typography>
              {/* any other aggregator data */}
            </Box>
          ) : (
            <p style={{ color: "#f88" }}>{progressData?.error || "No progress data found."}</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseProgress} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={timeDetailOpen} onClose={handleCloseTimeDetail} fullWidth maxWidth="md">
        <DialogTitle>{timeDetailTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {timeDetailData && timeDetailData.length > 0 ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {timeDetailData.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "0.6rem" }}>
                  <p>
                    <strong>DocID:</strong> {item.docId} <br />
                    <strong>Collection:</strong> {item.collection} <br />
                    <strong>TotalSeconds:</strong> {item.totalSeconds}
                  </p>
                  {/* lumps, etc. */}
                </li>
              ))}
            </ul>
          ) : (
            <p>No detailed docs found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseTimeDetail} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}