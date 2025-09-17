// File: RedesignedDailyPlan.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";

// MUI
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";

// Icons
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LockIcon from "@mui/icons-material/Lock";

// --------------- Utilities ---------------
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function parseCreatedAt(plan) {
  if (!plan?.createdAt) {
    return dateOnly(new Date());
  }
  if (plan.createdAt._seconds) {
    return dateOnly(new Date(plan.createdAt._seconds * 1000));
  } else if (plan.createdAt.seconds) {
    return dateOnly(new Date(plan.createdAt.seconds * 1000));
  } else {
    return dateOnly(new Date(plan.createdAt));
  }
}
function addDays(baseDate, daysOffset) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  return dateOnly(d);
}
function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}
function toMillis(ts) {
  if (!ts) return 0;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts._seconds) return ts._seconds * 1000;
  return 0;
}

// aggregatorLocked => overlay if aggregator says locked
function aggregatorLockedOverlay() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Typography sx={{ color: "#fff", opacity: 0.8 }}>LOCKED</Typography>
    </Box>
  );
}

// --------------- Pill ---------------
function Pill({ text, bgColor = "#424242", textColor = "#fff", sx = {}, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-block",
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        bgcolor: bgColor,
        color: textColor,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        pointerEvents: "auto",
        ...sx,
      }}
    >
      {text}
    </Box>
  );
}

// --------------- Additional aggregator helpers ---------------
function getTaskInfoStageLabel(act) {
  if ((act.type || "").toLowerCase() === "read") return "Reading";
  const st = (act.quizStage || "").toLowerCase();
  switch (st) {
    case "remember":
      return "Remember";
    case "understand":
      return "Understand";
    case "apply":
      return "Apply";
    case "analyze":
      return "Analyze";
    default:
      return "Quiz";
  }
}
function getTasksDoneCount(subchapterStatusMap, subChId, stageLower) {
  const hist = subchapterStatusMap[subChId]?.history?.[stageLower];
  if (!hist) return 0;
  const quizArr = hist.quizAttempts || [];
  const revArr = hist.revisionAttempts || [];
  return quizArr.length + revArr.length;
}
function getMasteryPct(subchapterStatusMap, subChId, stageLower) {
  const hist = subchapterStatusMap[subChId]?.history?.[stageLower];
  if (!hist || !hist.masteryPct) return 0;
  return hist.masteryPct;
}

// --------------- Main Component ---------------
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

  // 1) Early check
  if (!plan) {
    return <div>No plan object provided.</div>;
  }
  if (!plan?.sessions?.length) {
    return <div>No sessions found in this plan.</div>;
  }

  // 2) Show top-level plan data
  // For demonstration, let's assume you might have these fields:
  // plan.bookId, plan.dailyReadingTime, plan.createdAt, etc.
  const topLevelFields = [
    { label: "planId", value: planId },
    { label: "bookId", value: plan.bookId || "(none)" },
    { label: "createdAt", value: String(plan.createdAt) },
    { label: "dailyReadingTime", value: String(plan.dailyReadingTime || 0) },
    // Add any other top-level fields you want to display...
  ];

  // 3) Build day labels => "Day 1 (Apr 8, 2025)", or "Today (Apr 8, 2025)"
  const sessions = plan.sessions;
  const createdAtDate = parseCreatedAt(plan);
  const today = dateOnly(new Date());

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

  // 4) aggregator fetch => timeMap, subchapterStatusMap for current day's activities
  const [timeMap, setTimeMap] = useState({});
  const [subchapterStatusMap, setSubchapterStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

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

        // (A) fetch timeMap
        const newTimeMap = {};
        for (const act of activities) {
          if (!act.activityId) continue;
          const rawType = (act.type || "").toLowerCase();
          const type = rawType.includes("read") ? "read" : "quiz";
          try {
            const res = await axios.get(
  `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
              params: { activityId: act.activityId, type },
            });
            newTimeMap[act.activityId] = res.data?.totalTime || 0;
          } catch (err) {
            console.error("Error fetching time for", act.activityId, err);
          }
        }

        // (B) fetch aggregator subchapter-status
        const uniqueSubIds = new Set();
        for (const act of activities) {
          if (act.subChapterId) uniqueSubIds.add(act.subChapterId);
        }
        const newStatusMap = {};
        for (const subId of uniqueSubIds) {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/subchapter-status`, {
              params: { userId, planId, subchapterId: subId },
            });
            newStatusMap[subId] = res.data;
          } catch (err) {
            console.error("Error fetching subchapter-status for", subId, err);
          }
        }

        if (!cancel) {
          setTimeMap(newTimeMap);
          setSubchapterStatusMap(newStatusMap);
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
  }, [activities, userId, planId]);

  // 5) aggregator modals (debug, history, prev, progress, timeDetail, raw)
  // exactly as before
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

  const [rawOpen, setRawOpen] = useState(false);
  const [rawTitle, setRawTitle] = useState("");
  const [rawData, setRawData] = useState(null);

  // aggregator debug => old subchapterStatus
  function handleOpenDebug(subChId, activity) {
    const data = subchapterStatusMap[subChId] || null;
    setDebugTitle(`(Old) Subchapter-Status => subChId='${subChId}' type='${activity.type}'`);
    setDebugData(data);
    setDebugOpen(true);
  }
  function handleCloseDebug() {
    setDebugOpen(false);
    setDebugTitle("");
    setDebugData(null);
  }

  // subchapter-history => entire JSON debug
  async function handleOpenHistoryDebug(subChId) {
    try {
      setHistoryTitle(`(New) Subchapter-History => subChId='${subChId}'`);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/subchapter-history`, {
        params: { userId, planId, subchapterId: subChId },
      });
      setHistoryData(res.data);
    } catch (err) {
      console.error("handleOpenHistory => error:", err);
      setHistoryData({ error: err.message });
    } finally {
      setHistoryOpen(true);
    }
  }
  function handleCloseHistory() {
    setHistoryOpen(false);
    setHistoryTitle("");
    setHistoryData(null);
  }

  // "Previous"
  async function handleOpenPrevious(subChId, activity) {
    try {
      const stage = (activity.quizStage || "").toLowerCase();
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/subchapter-history`, {
        params: { userId, planId, subchapterId: subChId },
      });
      const historyObj = res.data?.history?.[stage];
      if (!historyObj) {
        setPrevModalTitle(`Previous Attempts => subCh='${subChId}', stage='${stage}'`);
        setPrevModalItems(["No history found for this stage."]);
        setPrevModalOpen(true);
        return;
      }
      const quizArr = historyObj.quizAttempts || [];
      const revArr = historyObj.revisionAttempts || [];

      const combined = [];
      quizArr.forEach((q) => {
        combined.push({
          type: "quiz",
          attemptNumber: q.attemptNumber || 1,
          score: String(q.score || ""),
          ts: q.timestamp || null,
        });
      });
      revArr.forEach((r) => {
        combined.push({
          type: "revision",
          attemptNumber: r.revisionNumber || 1,
          score: "",
          ts: r.timestamp || null,
        });
      });

      combined.sort((a, b) => {
        const aMs = toMillis(a.ts);
        const bMs = toMillis(b.ts);
        if (aMs !== bMs) return aMs - bMs;
        return (a.attemptNumber || 0) - (b.attemptNumber || 0);
      });

      const lines = combined.length
        ? combined.map((item) => {
            const dateStr = item.ts
              ? new Date(item.ts._seconds * 1000).toLocaleString()
              : "(no time)";
            if (item.type === "quiz") {
              return `Quiz${item.attemptNumber} => Score=${item.score}, ${dateStr}`;
            } else {
              return `Revision${item.attemptNumber} => ${dateStr}`;
            }
          })
        : ["No prior attempts found."];

      setPrevModalTitle(`Previous Attempts => subCh='${subChId}', stage='${stage}'`);
      setPrevModalItems(lines);
      setPrevModalOpen(true);
    } catch (err) {
      console.error("handleOpenPrevious => error:", err);
      setPrevModalTitle("Error fetching previous attempts");
      setPrevModalItems([`Error: ${err.message}`]);
      setPrevModalOpen(true);
    }
  }
  function handleClosePrevious() {
    setPrevModalOpen(false);
    setPrevModalTitle("");
    setPrevModalItems([]);
  }

  // "Progress"
  async function handleOpenProgress(subChId, stageLower) {
    try {
      setProgressTitle(`Progress => subCh='${subChId}', stage='${stageLower}'`);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/subchapter-history`, {
        params: { userId, planId, subchapterId: subChId },
      });
      const stgData = res.data?.history?.[stageLower] || {};
      setProgressData(stgData);
    } catch (err) {
      console.error("handleOpenProgress => error:", err);
      setProgressData({ error: err.message });
    } finally {
      setProgressOpen(true);
    }
  }
  function handleCloseProgress() {
    setProgressOpen(false);
    setProgressTitle("");
    setProgressData(null);
  }

  // "Time Detail"
  async function handleOpenTimeDetail(activityId, type) {
    try {
      setTimeDetailTitle(`Time Breakdown => activityId='${activityId}'`);
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
        params: { activityId, type },
      });
      setTimeDetailData(res.data?.details || []);
    } catch (err) {
      console.error("handleOpenTimeDetail => error:", err);
      setTimeDetailData([{ error: err.message }]);
    } finally {
      setTimeDetailOpen(true);
    }
  }
  function handleCloseTimeDetail() {
    setTimeDetailOpen(false);
    setTimeDetailTitle("");
    setTimeDetailData([]);
  }

  // "Raw Activity" => show plan doc for a single activity
  function handleOpenRawActivity(act) {
    setRawTitle(`Raw Activity Data => activityId='${act.activityId}'`);
    setRawData(act);
    setRawOpen(true);
  }
  function handleCloseRaw() {
    setRawOpen(false);
    setRawTitle("");
    setRawData(null);
  }

  // 6) If loading aggregator
  if (loading) {
    return <div style={{ color: "#fff" }}>Loading aggregator data...</div>;
  }

  // 7) Expand/Collapse: We'll do an Accordion for each activity
  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  // 8) Render
  return (
    <Box sx={{ color: "#fff", mt: 2 }}>
      {/* Top-level plan info */}
      <Box
        sx={{
          border: "1px solid #666",
          borderRadius: 1,
          p: 2,
          mb: 2,
          backgroundColor: "#333",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Plan Overview
        </Typography>
        {topLevelFields.map((f) => (
          <Typography variant="body2" key={f.label} sx={{ mb: 0.5 }}>
            <strong>{f.label}:</strong> {f.value}
          </Typography>
        ))}
      </Box>

      {/* Day Dropdown */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Typography variant="body2">Select Day:</Typography>
        <Select
          value={safeDayIdx}
          onChange={(e) => onDaySelect(Number(e.target.value))}
          sx={{
            minWidth: 200,
            backgroundColor: "#2F2F2F",
            color: "#FFD700",
            fontSize: "0.85rem",
            height: 32,
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: "#2F2F2F",
                color: "#fff",
              },
            },
          }}
        >
          {sessions.map((sess, idx) => (
            <MenuItem key={sess.sessionLabel} value={idx}>
              {dayLabels[idx]}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Show the chosen day in an "expand/collapse" format for each activity */}
      {activities.map((act, idx) => {
        // aggregator locked?
        const aggregatorLocked = (act.aggregatorStatus || "").toLowerCase() === "locked";

        // time
        const lumpsSec = timeMap[act.activityId] || 0;
        const lumpsStr = formatSeconds(lumpsSec);
        const timeNeededVal = act.timeNeeded ? `${act.timeNeeded}m` : "";

        // aggregator => subCh locked?
        const subChId = act.subChapterId || "";
        let lockedFromAPI = false;
        const statusObj = subchapterStatusMap[subChId] || null;
        if (statusObj && Array.isArray(statusObj.taskInfo)) {
          const desiredLabel = getTaskInfoStageLabel(act);
          const found = statusObj.taskInfo.find(
            (ti) => (ti.stageLabel || "").toLowerCase() === desiredLabel.toLowerCase()
          );
          if (found?.locked) {
            lockedFromAPI = true;
          }
        }

        // completion
        const planCompletion = (act.completionStatus || "").toLowerCase();
        let finalStatusLabel = "Not Started";
        let finalStatusColor = "#EF5350";
        if (planCompletion === "complete") {
          finalStatusLabel = "Complete";
          finalStatusColor = "#66BB6A";
        } else if (lockedFromAPI) {
          finalStatusLabel = "Locked";
          finalStatusColor = "#9E9E9E";
        } else if (planCompletion === "deferred") {
          finalStatusLabel = "Deferred";
          finalStatusColor = "#FFA726";
        } else if (lumpsSec > 0) {
          finalStatusLabel = "WIP";
          finalStatusColor = "#BDBDBD";
        }

        // tasks done + mastery if quiz
        const stageLower = (act.quizStage || "").toLowerCase();
        const isQuizStage = ["remember", "understand", "apply", "analyze"].includes(stageLower);
        let tasksDoneText = "-";
        let masteryText = "-";
        if (isQuizStage) {
          const doneCount = getTasksDoneCount(subchapterStatusMap, subChId, stageLower);
          tasksDoneText = `${doneCount}`;
          const masteryPct = getMasteryPct(subchapterStatusMap, subChId, stageLower);
          masteryText = `${masteryPct.toFixed(0)}%`;
        }

        // "read" or "quiz" => for doc-level lumps
        const rawType = (act.type || "").toLowerCase().includes("read") ? "read" : "quiz";

        // Summaries: a small label for the collapsed header
        const summaryLabel = `Activity #${idx + 1} — ID: ${act.activityId || "?"} (${act.type})`;

        return (
          <Box key={idx} sx={{ position: "relative", mb: 1 }}>
            {aggregatorLocked && aggregatorLockedOverlay()}

            <Accordion
              onChange={(event, expanded) => {
                // Optional: on expansion, setCurrentIndex
                // or do some logic
              }}
              sx={{
                backgroundColor: "#444",
                color: "#fff",
                border: "1px solid #666",
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {summaryLabel}
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {/* 1) Raw plan doc (in a simple "key: val" listing) */}
                <Box sx={{ mb: 2, pl: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Plan Doc Fields
                  </Typography>
                  {/* You can map over Object.keys(act) or just show a JSON block */}
                  <Box sx={{ ml: 2 }}>
                    {/* Example: show JSON or do a table */}
                    <pre style={{ color: "#0f0", backgroundColor: "#222", padding: 8 }}>
                      {JSON.stringify(act, null, 2)}
                    </pre>
                  </Box>
                </Box>

                {/* 2) Additional aggregator fields */}
                <Box sx={{ mb: 2, pl: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Aggregator Data
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Completion:</strong>{" "}
                      <Pill text={finalStatusLabel} bgColor={finalStatusColor} textColor="#000" />
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      <strong>Time Spent:</strong>{" "}
                      {timeNeededVal ? `${lumpsStr} / ${timeNeededVal}` : lumpsStr}{" "}
                      <Tooltip
                        title={
                          timeNeededVal
                            ? `Elapsed: ${lumpsStr}, Expected: ${timeNeededVal}`
                            : `Elapsed: ${lumpsStr}`
                        }
                      >
                        <Pill
                          text={<AccessTimeIcon sx={{ fontSize: "1rem" }} />}
                          sx={{ ml: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTimeDetail(act.activityId, rawType);
                          }}
                        />
                      </Tooltip>
                    </Typography>
                    {isQuizStage && (
                      <>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Tasks Done:</strong> {tasksDoneText}{" "}
                          <Pill
                            text="(prev attempts)"
                            bgColor="#555"
                            sx={{ ml: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPrevious(subChId, act);
                            }}
                          />
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Mastery:</strong> {masteryText}%
                          <Pill
                            text="(details)"
                            bgColor="#4CAF50"
                            sx={{ ml: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProgress(subChId, stageLower);
                            }}
                          />
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                {/* 3) Debug Buttons */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pl: 1 }}>
                  <Pill
                    text="Open aggregator debug (old)"
                    bgColor="#666"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDebug(subChId, act);
                    }}
                  />
                  <Pill
                    text="Open subchapter-history"
                    bgColor="#999"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenHistoryDebug(subChId);
                    }}
                  />
                  <Pill
                    text="Open RAW Activity"
                    bgColor="#777"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenRawActivity(act);
                    }}
                  />
                  {/* Optionally a button to "jump to plan fetcher" */}
                  <Pill
                    text="Open PlanFetcher"
                    bgColor="#888"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClickActivity(act);
                    }}
                  />
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        );
      })}

      {/* Below: All your modals for aggregator debugging (unchanged) */}
      {/* aggregator debug */}
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

      {/* subchapter-history debug */}
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

      {/* "Previous" => tasks done list */}
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

      {/* "Progress" => mastery details */}
      <Dialog open={progressOpen} onClose={handleCloseProgress} fullWidth maxWidth="sm">
        <DialogTitle>{progressTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {progressData && !progressData.error ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mastery: <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong>
              </Typography>
              {Array.isArray(progressData.conceptMastery) && progressData.conceptMastery.length > 0 ? (
                <ul style={{ paddingLeft: "1.25rem" }}>
                  {progressData.conceptMastery.map((cObj, idx) => (
                    <li key={idx} style={{ marginBottom: "0.4rem" }}>
                      <strong>{cObj.conceptName}</strong>:
                      &nbsp;{cObj.passOrFail === "PASS" ? `PASS (on quiz attempt #${cObj.passAttempt})` : "FAIL"}
                      &nbsp;({((cObj.ratio || 0) * 100).toFixed(0)}%)
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2">No concept data found.</Typography>
              )}
            </Box>
          ) : (
            <p style={{ color: "#f88" }}>
              {progressData?.error || "No progress data found."}
            </p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseProgress} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Detail => doc-level breakdown */}
      <Dialog open={timeDetailOpen} onClose={handleCloseTimeDetail} fullWidth maxWidth="md">
        <DialogTitle>{timeDetailTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {timeDetailData && timeDetailData.length > 0 ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {timeDetailData.map((item, idx) => {
                const lumpsCount = item.lumps?.length || 0;
                return (
                  <li key={idx} style={{ marginBottom: "0.6rem" }}>
                    <p>
                      <strong>DocID:</strong> {item.docId} <br />
                      <strong>Collection:</strong> {item.collection} <br />
                      <strong>TotalSeconds:</strong> {item.totalSeconds}
                    </p>
                    {lumpsCount > 0 && (
                      <ul>
                        {item.lumps.map((lump, i2) => (
                          <li key={i2}>
                            Lump #{i2 + 1}: {JSON.stringify(lump)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
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

      {/* RAW plan doc for a single activity */}
      <Dialog open={rawOpen} onClose={handleCloseRaw} fullWidth maxWidth="md">
        <DialogTitle>{rawTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {rawData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(rawData, null, 2)}
            </pre>
          ) : (
            <p>No raw activity data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseRaw} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}