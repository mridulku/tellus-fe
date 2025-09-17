// File: ActivityAccordion.jsx
import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import aggregatorLockedOverlay from "./aggregatorLockedOverlay";
import AggregatorInfoPanel from "./AggregatorInfoPanel";
import QuizSubmissionDetails from "./QuizSubmissionDetails";
import CompletionSummaryPanel from "./CompletionSummaryPanel"; 
// ^^^ NEW import, pointing to your separate summary panel file

/**
 * If activity.type includes 'read', treat as stage='reading'; else quiz.
 */
function getStageKey(activity) {
  const rawType = (activity.type || "").toLowerCase();
  if (rawType.includes("read")) return "reading";
  return (activity.quizStage || "").toLowerCase();
}

/** Merge quiz + revision => single array => sort => group by date. */
function mergeQuizAndRevision(quizArr, revArr) {
  const combined = [];
  quizArr.forEach((q) => {
    combined.push({
      ...q,
      type: "quiz",
      attemptNumber: q.attemptNumber || 1,
    });
  });
  revArr.forEach((r) => {
    combined.push({
      ...r,
      type: "revision",
      revisionNumber: r.revisionNumber || 1,
    });
  });

  // sort by timestamp ascending
  combined.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
  return combined;
}

function toMillis(ts) {
  if (!ts) return 0;
  if (ts._seconds) return ts._seconds * 1000;
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
}

/** parse date => "2025-08-16" or similar */
function parseDateFromTimestamp(ts) {
  if (!ts) return "UnknownDate";
  const ms = toMillis(ts);
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 
 * AttemptsByDate => merges quiz+revision => collapsible 
 * (unchanged from your existing code)
 */
function AttemptsByDate({ attempts, onOpenAttempt }) {
  if (!attempts || !attempts.length) return null;

  const map = {};
  attempts.forEach((att) => {
    const dayStr = parseDateFromTimestamp(att.timestamp);
    if (!map[dayStr]) map[dayStr] = [];
    map[dayStr].push(att);
  });

  const dateKeys = Object.keys(map).sort();

  return (
    <Box>
      {dateKeys.map((day) => {
        const arr = map[day];
        return (
          <Accordion
            key={day}
            sx={{ backgroundColor: "#555", color: "#fff", mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {day} ({arr.length} attempt{arr.length>1 ? "s":""})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {arr.map((item, idx) => {
                  const prefix = item.type === "quiz" ? "Q" : "R";
                  const num = item.attemptNumber || item.revisionNumber || 1;
                  const label = `${prefix}${num}`;
                  return (
                    <Box
                      key={idx}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: "#666",
                        px: 1,
                        py: 0.5,
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAttempt(item);
                      }}
                    >
                      <Typography variant="body2">{label}</Typography>
                      <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                    </Box>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

/** 
 * ConceptQuizTable => for each concept, for each quiz attempt => PASS / FAIL / NT
 * (unchanged)
 */
function ConceptQuizTable({ conceptList, quizAttempts }) {
  const sortedAttempts = [...quizAttempts].sort(
    (a, b) => (a.attemptNumber || 0) - (b.attemptNumber || 0)
  );

  function getConceptResult(conceptName, attempt) {
    if (!attempt?.quizSubmission) return "NT";
    const foundQ = attempt.quizSubmission.find(
      (q) => (q.conceptName || "").toLowerCase() === conceptName.toLowerCase()
    );
    if (!foundQ) return "NT"; // not tested
    return foundQ.score && Number(foundQ.score) >= 1 ? "PASS" : "FAIL";
  }

  return (
    <Box sx={{ overflowX: "auto", mb: 2 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={thStyle}>Concept</th>
            {sortedAttempts.map((att) => (
              <th key={att.attemptNumber} style={thStyle}>Q{att.attemptNumber}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {conceptList.map((cn) => (
            <tr key={cn.id}>
              <td style={tdStyle}>{cn.name || `Concept ${cn.id}`}</td>
              {sortedAttempts.map((att) => {
                const res = getConceptResult(cn.name, att);
                let bg = "#555";
                if (res === "PASS") bg = "#66bb6a";
                else if (res === "FAIL") bg = "#ef5350";
                return (
                  <td key={att.attemptNumber} style={{ ...tdStyle, backgroundColor: bg }}>
                    {res}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

const thStyle = {
  border: "1px solid #888",
  padding: "6px 8px",
  backgroundColor: "#333",
  color: "#fff",
  fontWeight: "bold",
};

const tdStyle = {
  border: "1px solid #888",
  padding: "6px 8px",
  textAlign: "center",
};


// ===========================
// The main ActivityAccordion
// ===========================
export default function ActivityAccordion({
  index,
  activity,
  timeMap,
  subchapterStatusMap,
  onClickActivity,
  setDebugOpen,
  setDebugTitle,
  setDebugData,
  setHistoryOpen,
  setHistoryTitle,
  setHistoryData,
  setPrevModalOpen,
  setPrevModalTitle,
  setPrevModalItems,
  setProgressOpen,
  setProgressTitle,
  setProgressData,
  setTimeDetailOpen,
  setTimeDetailTitle,
  setTimeDetailData,
  timeFetchLogs,
  statusFetchLogs,
}) {
  const aggregatorLocked = (activity.aggregatorStatus || "").toLowerCase() === "locked";
  const summaryLabel = `Activity #${index + 1} — ID: ${activity.activityId || "?"} (${activity.type})`;

  // subchapter aggregator object => aggregator data
  const subChId = activity.subChapterId || "";
  const aggregatorObj = subchapterStatusMap[subChId] || {};

  // stage => reading or quiz
  const stageKey = getStageKey(activity);
  const quizStagesData = aggregatorObj.quizStagesData || {};
  const stageData = quizStagesData[stageKey] || {};
  const { quizAttempts = [], revisionAttempts = [] } = stageData;

  // subchapter concepts => aggregatorObj.concepts
  const conceptList = aggregatorObj.concepts || [];

  // merges quiz+revision => attempts-by-date
  const combined = mergeQuizAndRevision(quizAttempts, revisionAttempts);

  // Attempt raw-data modal
  const [attemptOpen, setAttemptOpen] = useState(false);
  const [attemptRawTitle, setAttemptRawTitle] = useState("");
  const [attemptRawData, setAttemptRawData] = useState(null);

  function handleOpenAttempt(item) {
    const prefix = item.type === "quiz" ? "Q" : "R";
    const num = item.attemptNumber || item.revisionNumber || 1;
    setAttemptRawTitle(`${prefix}${num} => Raw Data`);
    setAttemptRawData(item);
    setAttemptOpen(true);
  }
  function handleCloseAttempt() {
    setAttemptOpen(false);
    setAttemptRawTitle("");
    setAttemptRawData(null);
  }

  return (
    <Box sx={{ position: "relative", mb: 1 }}>
      {/* aggregatorLocked overlay */}
      {aggregatorLocked && aggregatorLockedOverlay()}

      <Accordion
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
          {/* (1) Plan Doc (Raw) */}
          <Box sx={{ mb: 2, pl: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Plan Doc (Raw)
            </Typography>
            <Box sx={{ ml: 2 }}>
              <pre style={{ color: "#0f0", backgroundColor: "#222", padding: 8 }}>
                {JSON.stringify(activity, null, 2)}
              </pre>
            </Box>
          </Box>

          {/* (2) Aggregator Info => lumpsSec, aggregatorLocked, final status, etc. */}
          <AggregatorInfoPanel
            activity={activity}
            timeMap={timeMap}
            subchapterStatusMap={subchapterStatusMap}
            setTimeDetailOpen={setTimeDetailOpen}
            setTimeDetailTitle={setTimeDetailTitle}
            setTimeDetailData={setTimeDetailData}
            timeFetchLogs={timeFetchLogs}
            statusFetchLogs={statusFetchLogs}
          />

          {/* (3) Subchapter Concepts */}
          <Box sx={{ mt: 2, pl: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Subchapter Concepts
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Found {conceptList.length} concept(s) for subChId={subChId}.
            </Typography>
            {conceptList.length > 0 && (
              <ul style={{ marginLeft: "1.25rem" }}>
                {conceptList.map((cn) => (
                  <li key={cn.id} style={{ marginBottom: "0.2rem" }}>
                    {cn.name || `Concept ${cn.id}`}
                  </li>
                ))}
              </ul>
            )}
          </Box>

          {/* (4) If quiz => concept vs quiz attempts => pass/fail/NT */}
          {(stageKey !== "reading") && quizAttempts.length > 0 && conceptList.length > 0 && (
            <Box sx={{ mt: 2, pl: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Concept vs Quiz Attempts
              </Typography>
              <ConceptQuizTable conceptList={conceptList} quizAttempts={quizAttempts} />
            </Box>
          )}

          {/* (5) Attempts by Date => merges quiz+revision => collapsible */}
          {(stageKey !== "reading") && combined.length > 0 && (
            <Box sx={{ mt: 2, pl: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Attempts by Date
              </Typography>
              <AttemptsByDate attempts={combined} onOpenAttempt={handleOpenAttempt} />
            </Box>
          )}

          {/* (6) PlanFetcher link */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              sx={{ textDecoration: "underline", cursor: "pointer", color: "#ccc" }}
              onClick={(e) => {
                e.stopPropagation();
                onClickActivity(activity);
              }}
            >
              Open PlanFetcher for this Activity
            </Typography>
          </Box>

          {/* (7) Instead of "CompletionSummaryAccordion", 
                  we simply import and render your "CompletionSummaryPanel." */}
          <Box sx={{ mt: 2 }}>
            <CompletionSummaryPanel
              activity={activity}
              aggregatorObj={aggregatorObj}
              conceptList={conceptList}
              attempts={combined}   // pass the same array with timestamp
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Attempt RAW data => modal (with "pretty" quiz details if item.type==='quiz') */}
      <Dialog open={attemptOpen} onClose={handleCloseAttempt} fullWidth maxWidth="md">
        <DialogTitle>{attemptRawTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {attemptRawData ? (
            <>
              {attemptRawData.type === "quiz" && attemptRawData.quizSubmission && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Detailed Questions/Answers
                  </Typography>
                  <QuizSubmissionDetails attempt={attemptRawData} />
                </Box>
              )}

              <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                Raw JSON:
              </Typography>
              <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(attemptRawData, null, 2)}
              </pre>
            </>
          ) : (
            <p>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseAttempt} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}