/* ------------------------------------------------------------------
 * HistoryView.jsx   (FULL FILE)
 * ------------------------------------------------------------------
 *  • Shows concept mastery + quiz / revision attempts for a sub-chapter
 *  • Stage-selector tabs so the user can flip between
 *    Remember / Understand / Apply / Analyse history.
 *  • Feedback + learner answer visible for non-MCQ questions.
 *  • NEW: per-question numeric score chip inside the accordion.
 * ------------------------------------------------------------------ */

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* ────────────────────────────────────────────────────────── */
/* Utility helpers                                           */
/* ────────────────────────────────────────────────────────── */

function mergeQuizAndRevision(quizArr, revArr) {
  const combined = [];
  quizArr.forEach((q) => combined.push({ ...q, type: "quiz", attemptNumber: q.attemptNumber || 1 }));
  revArr.forEach((r) =>
    combined.push({ ...r, type: "revision", revisionNumber: r.revisionNumber || 1 })
  );
  combined.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
  return combined;
}
function toMillis(ts) {
  if (!ts) return 0;
  if (ts._seconds) return ts._seconds * 1000;
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
}
function formatDate(ts) {
  const ms = toMillis(ts);
  if (!ms) return "Unknown Date";
  return new Date(ms).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function buildUsageMap(details) {
  const usageByAttempt = {};
  details.forEach((d) => {
    const isQuizTime = d.collection === "quizTimeSubActivity";
    const attNum = isQuizTime ? d.attemptNumber : d.revisionNumber;
    if (!attNum) return;
    const dStr = d.dateStr || "UnknownDate";
    usageByAttempt[attNum] ??= {};
    usageByAttempt[attNum][dStr] = (usageByAttempt[attNum][dStr] || 0) + (d.totalSeconds || 0);
  });
  return usageByAttempt;
}

/* ────────────────────────────────────────────────────────── */
/* Concepts accordion                                         */
/* ────────────────────────────────────────────────────────── */

function ConceptsPanel({ aggregatorObj, stageKey }) {
  const stageData = aggregatorObj.quizStagesData?.[stageKey] || {};
  const allStats = stageData.allAttemptsConceptStats || [];
  const quizAttempts = stageData.quizAttempts || [];
  const concepts = aggregatorObj.concepts || [];

  const conceptPassMap = buildConceptPassMap(allStats);
  const passedCount = concepts.filter((c) => conceptPassMap[c.name]?.passed).length;
  const percent = concepts.length ? (passedCount / concepts.length) * 100 : 0;

  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded((p) => !p)}
        sx={{ backgroundColor: "#222", color: "#fff" }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
          <Box sx={{ width: "100%" }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
              Concepts
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{ height: 6, borderRadius: 2, backgroundColor: "#333" }}
            />
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {passedCount}/{concepts.length} mastered
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: "#333" }}>
          <ConceptTable
            concepts={concepts}
            quizAttempts={quizAttempts}
            allAttemptsConceptStats={allStats}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
function buildConceptPassMap(allStats) {
  const map = {};
  allStats.forEach((att) => {
    const label = `Q${att.attemptNumber}`;
    att.conceptStats?.forEach((cs) => {
      const c = cs.conceptName;
      map[c] ??= { tested: false, passed: false, attemptLabels: [] };
      map[c].tested = true;
      if (cs.passOrFail === "PASS") {
        map[c].passed = true;
        map[c].attemptLabels.push(label);
      }
    });
  });
  return map;
}

/* ------------------------------------------------------- */
/* ConceptTable (unchanged – keep your existing version)   */
/* ------------------------------------------------------- */
function ConceptTable({ concepts, quizAttempts, allAttemptsConceptStats }) {
  /* … same implementation you already have … */
}

/* ────────────────────────────────────────────────────────── */
/* AttemptsTabs                                              */
/* ────────────────────────────────────────────────────────── */

function AttemptsTabs({ quizAttempts, revisionAttempts, usageByAttempt }) {
  const combined = mergeQuizAndRevision(quizAttempts, revisionAttempts);
  if (!combined.length) return <Typography variant="body2">No attempts found.</Typography>;

  const attemptsArray = combined.map((att) => ({
    ...att,
    isQuiz: att.type === "quiz",
    label: `${att.type === "quiz" ? "Q" : "R"}${att.attemptNumber || att.revisionNumber} (${formatDate(
      att.timestamp
    )})`,
  }));

  const [tabIndex, setTabIndex] = useState(0);
  const selected = attemptsArray[tabIndex];

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        variant="scrollable"
        scrollButtons="auto"
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: "#fff" } }}
        sx={{ minHeight: "32px" }}
      >
        {attemptsArray.map((a, i) => (
          <Tab
            key={i}
            label={a.label}
            sx={{ minHeight: 32, color: "#ccc", "&.Mui-selected": { color: "#fff", fontWeight: "bold" } }}
          />
        ))}
      </Tabs>
      {selected && (
        <AttemptDetail attempt={selected} usageMap={usageByAttempt[getAttemptNum(selected)] || {}} />
      )}
    </Box>
  );
}
const getAttemptNum = (a) => (a.type === "quiz" ? a.attemptNumber : a.revisionNumber);

/* ────────────────────────────────────────────────────────── */
/* AttemptDetail                                             */
/* ────────────────────────────────────────────────────────── */

function AttemptDetail({ attempt, usageMap }) {
  if (attempt.type !== "quiz") {
    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: "#222", borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
          (Revision Attempt)
        </Typography>
        <TimeUsage usageMap={usageMap} />
      </Box>
    );
  }

  const subs = attempt.quizSubmission || [];
  const correct = subs.filter((q) => parseFloat(q.score) >= 1).length;

  return (
    <Box sx={{ mt: 2, p: 2, backgroundColor: "#222", borderRadius: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip label={`Score: ${attempt.score || "N/A"}`} sx={pill} />
        <TimeUsagePill usageMap={usageMap} />
        <Chip label={`Correct: ${correct}/${subs.length}`} sx={pill} />
      </Box>
      {subs.map((q, i) => (
        <QuestionAccordion key={i} q={q} index={i} />
      ))}
    </Box>
  );
}
const pill = { backgroundColor: "#333", color: "#fff", fontWeight: "bold" };

/* TimeUsage + TimeUsagePill (unchanged – keep yours) */

function TimeUsage({ usageMap }) {
  const entries = Object.entries(usageMap).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
        Time usage:
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="body2">0 seconds</Typography>
      ) : (
        entries.map(([dStr, secs], i) => (
          <Typography variant="body2" key={i}>
            {dStr}: {secs} sec
          </Typography>
        ))
      )}
    </Box>
  );
}
function TimeUsagePill({ usageMap }) {
  let totalSec = 0;
  Object.values(usageMap).forEach((v) => (totalSec += v));
  return <Chip label={`Time: ${totalSec || 0}s`} sx={pill} />;
}

/* ────────────────────────────────────────────────────────── */
/* QuestionAccordion                                         */
/* ────────────────────────────────────────────────────────── */

function QuestionAccordion({ q, index }) {
  const [expanded, setExpanded] = useState(false);
  const userIdx = parseInt(q.userAnswer, 10);
  const correctIdx = q.correctIndex;
  const isCorrect = parseFloat(q.score) >= 1;

  return (
    <Box sx={{ mb: 2, backgroundColor: "#333", borderRadius: 1, overflow: "hidden" }}>
      {/* Header */}
      <Box onClick={() => setExpanded((p) => !p)} sx={{ p: 1, cursor: "pointer" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Q{index + 1}: {q.question || "Untitled"}
          </Typography>
          <Typography variant="body2" sx={{ color: isCorrect ? "limegreen" : "red", fontWeight: "bold" }}>
            {isCorrect ? "PASS" : "FAIL"}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "#bbb", fontSize: "0.85rem" }}>
          Concept: {q.conceptName || "N/A"}
        </Typography>
      </Box>

      {/* Expanded content */}
      {expanded && (
        <Box sx={{ p: 1, backgroundColor: "#222" }}>
          {/* NEW → numeric score chip */}
          <Chip
            label={`Score: ${q.score !== undefined ? q.score : "N/A"}`}
            sx={{ ...pill, mb: 1 }}
          />

          {/* MCQ options path */}
          {q.options && q.options.map((opt, i) => {
            let bg = "#444";
            if (i === correctIdx && i === userIdx) bg = "#66bb6a";
            else if (i === correctIdx) bg = "#2e7d32";
            else if (i === userIdx) bg = "#ef5350";
            return (
              <Box key={i} sx={{ p: 1, backgroundColor: bg, borderRadius: 1, mb: 1 }}>
                <Typography variant="body2">{opt}</Typography>
              </Box>
            );
          })}

          {/* Non-MCQ feedback path */}
          {!q.options && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Your answer: {q.userAnswer || "(blank)"}
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                {q.feedback || "No feedback recorded."}
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

/* ────────────────────────────────────────────────────────── */
/* Main component with stage tabs                            */
/* ────────────────────────────────────────────────────────── */

export default function HistoryView({
  userId,
  planId,
  subChapterId,
  activityId,
  activityType = "quiz",
}) {
  const STAGES = ["remember", "understand", "apply", "analyse"];
  const [stageKey, setStageKey] = useState("remember");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aggregatorObj, setAggregatorObj] = useState(null);
  const [timeData, setTimeData] = useState(null);

  /* ---- fetch every time stageKey changes ---- */
  useEffect(() => {
    if (!userId || !planId || !subChapterId || !activityId) return;
    let cancel = false;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const aggRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`,
          { params: { userId, planId, subchapterId: subChapterId } }
        );
        if (!cancel) setAggregatorObj(aggRes.data);

        const timeRes = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`,
          { params: { activityId, type: activityType } }
        );
        if (!cancel) setTimeData(timeRes.data);
      } catch (err) {
        if (!cancel) {
          setError(err.message || "Fetch error");
          setAggregatorObj(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [userId, planId, subChapterId, activityId, activityType, stageKey]);

  /* ---- early returns ---- */
  if (!userId || !planId || !subChapterId || !activityId)
    return <Box sx={{ p: 2, color: "red" }}>Missing required IDs.</Box>;
  if (loading)
    return <Box sx={{ p: 2 }}>Loading…</Box>;
  if (error)
    return <Box sx={{ p: 2, color: "red" }}>{error}</Box>;
  if (!aggregatorObj)
    return <Box sx={{ p: 2 }}>No data found.</Box>;

  /* ---- slice data for current stage ---- */
  const stageData = aggregatorObj.quizStagesData?.[stageKey] || {};
  const quizAttempts = stageData.quizAttempts || [];
  const revisionAttempts = stageData.revisionAttempts || [];
  const usageByAttempt = buildUsageMap(timeData?.details || []);

  /* ---- render ---- */
  return (
    <Box sx={{ p: 2, backgroundColor: "#000", color: "#fff" }}>
      {/* Stage selector */}
      <Tabs
        value={stageKey}
        onChange={(_, k) => setStageKey(k)}
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: "#fff" } }}
        sx={{ mb: 2 }}
      >
        {STAGES.map((k) => (
          <Tab
            key={k}
            value={k}
            label={k.charAt(0).toUpperCase() + k.slice(1)}
            sx={{ color: "#ccc", "&.Mui-selected": { color: "#fff", fontWeight: "bold" } }}
          />
        ))}
      </Tabs>

      {/* Concepts and attempts for selected stage */}
      <ConceptsPanel aggregatorObj={aggregatorObj} stageKey={stageKey} />
      <AttemptsTabs
        quizAttempts={quizAttempts}
        revisionAttempts={revisionAttempts}
        usageByAttempt={usageByAttempt}
      />
    </Box>
  );
}