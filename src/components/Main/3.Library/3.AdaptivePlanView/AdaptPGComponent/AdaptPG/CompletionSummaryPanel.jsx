// File: CompletionSummaryPanel.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography } from "@mui/material";

/** A helper to safely format N seconds => "3m 20s" or "15s" */
function formatSeconds(sec) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 1) {
    return `${sec}s`;
  }
  return `${m}m ${s}s`;
}

/** 
 * parseReadingCompletionDate tries multiple date formats:
 *   1) Firestore Timestamp object with .seconds
 *   2) Firestore Timestamp object with ._seconds
 *   3) A string that can be parsed as an ISO date
 *   4) A Date object
 */
function parseReadingCompletionDate(maybeDate) {
  // 0) If it's falsy, just return null
  if (!maybeDate) return null;

  // 1) If it's an object with .seconds or ._seconds
  if (typeof maybeDate === "object") {
    if (typeof maybeDate.seconds === "number") {
      return new Date(maybeDate.seconds * 1000);
    }
    if (typeof maybeDate._seconds === "number") {
      return new Date(maybeDate._seconds * 1000);
    }
  }

  // 2) If it's a string, try parsing it as ISO
  if (typeof maybeDate === "string") {
    const asDate = new Date(maybeDate);
    if (!isNaN(asDate.getTime())) {
      return asDate;
    }
  }

  // 3) If it's already a Date object and valid
  if (maybeDate instanceof Date && !isNaN(maybeDate.valueOf())) {
    return maybeDate;
  }

  // else we couldn't parse
  return null;
}

/**
 * CompletionSummaryPanel
 * ----------------------
 * A summary panel that shows:
 *   - If reading => reading completion date, total reading lumps
 *   - If quiz => for each Q or R => submission date, lumps, concept pass/fail
 *
 * PROPS:
 *   - activity: (object) => { activityId, type, etc. }
 *   - aggregatorObj: e.g. { readingSummary, quizStagesData, ... }
 *   - conceptList: an array from aggregatorObj.concepts
 *   - attempts: (optional) the merged quiz+revision attempts array
 */
export default function CompletionSummaryPanel({
  activity,
  aggregatorObj,
  conceptList = [],
  attempts = [],
}) {
  if (!activity?.activityId) {
    return null; // No activity => no summary
  }

  // 1) Distinguish reading from quiz by type
  const rawType = (activity.type || "").toLowerCase();
  const isReading = rawType.includes("read");

  // 2) We'll fetch doc-level time lumps from /api/getActivityTime
  const [timeData, setTimeData] = useState(null); // { totalTime, details: [ ... ] }
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancel = false;
    async function doFetch() {
      setLoading(true);
      setErr("");
      try {
        const typeParam = isReading ? "read" : "quiz";
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
          params: { activityId: activity.activityId, type: typeParam },
        });
        if (!cancel) {
          setTimeData(res.data);
        }
      } catch (e) {
        if (!cancel) {
          setErr(e.message || "Time breakdown fetch error");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    doFetch();

    return () => { cancel = true; };
  }, [activity.activityId, isReading]);

  // aggregator => readingSummary or quiz stages
  const readingSummary = aggregatorObj.readingSummary || null;

  return (
    <Box sx={{ p:2, backgroundColor:"#333", borderRadius:1, mt:2 }}>
      {isReading
        ? renderReadingSummary(readingSummary, timeData, loading, err)
        : renderQuizSummary(aggregatorObj, conceptList, attempts, timeData, loading, err)
      }
    </Box>
  );
}

/** Renders reading => day-based lumps + aggregator reading time + completion date */
function renderReadingSummary(readingSummary, timeData, loading, err) {
  let completionDateStr = "(not completed)";
  const aggregatorTimeMin = readingSummary?.timeSpent || 0;

  // Attempt to parse readingSummary.completionDate if it exists
  if (readingSummary?.completionDate) {
    const parsedDate = parseReadingCompletionDate(readingSummary.completionDate);
    if (parsedDate) {
      completionDateStr = parsedDate.toLocaleDateString();
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb:1 }}>
        Reading Completion
      </Typography>
      <Typography variant="body2">
        Completion Date: {completionDateStr}
      </Typography>
      <Typography variant="body2" sx={{ mb:1 }}>
        Aggregator Time: {aggregatorTimeMin.toFixed(1)} min
      </Typography>

      {loading && <Typography>Loading lumps...</Typography>}
      {err && <Typography sx={{ color:"red" }}>{err}</Typography>}
      {(!loading && !err && timeData?.details) && (
        <ReadingDayBreakdown details={timeData.details} />
      )}
    </Box>
  );
}

/** For quiz => each aggregator attempt => submission date + lumps + concept pass/fail */
function renderQuizSummary(aggregatorObj, conceptList, attempts, timeData, loading, err) {
  if (!attempts || attempts.length === 0) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb:1 }}>
          Quiz Completion
        </Typography>
        <Typography>No quiz/revision attempts found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb:1 }}>
        Quiz Completion
      </Typography>

      {attempts.map((att, idx) => {
        // label => Qx or Rx
        const label = att.type === "quiz"
          ? `Q${att.attemptNumber || 1}`
          : `R${att.revisionNumber || 1}`;

        // Attempt Timestamp => handle both .seconds and ._seconds
        let submissionDate = "(no date)";
        const possibleSec = att.timestamp?.seconds ?? att.timestamp?._seconds;
        if (possibleSec) {
          submissionDate = new Date(possibleSec * 1000).toLocaleString();
        }

        // lumps => day-based usage from timeData.details
        const lumpsArr = buildDayBreakdown(timeData?.details || [], label, att);

        // aggregator => concept pass/fail => question pass/fail
        const totalQ = att.quizSubmission?.length || 0;
        const correctQ = att.quizSubmission
          ? att.quizSubmission.filter(q => (Number(q.score) || 0) >= 1).length
          : 0;
        let scorePct = "(no data)";
        if (totalQ > 0) {
          scorePct = `${((100 * correctQ) / totalQ).toFixed(1)}%`;
        }

        return (
          <Box key={idx} sx={{ mb:2, p:1, backgroundColor:"#444", borderRadius:1 }}>
            <Typography variant="body2" sx={{ fontWeight:"bold", mb:0.5 }}>
              {label}
            </Typography>
            <Typography variant="body2">
              Submission Date: {submissionDate}
            </Typography>
            <Typography variant="body2">
              Score: {correctQ}/{totalQ} ({scorePct})
            </Typography>

            <Typography variant="body2" sx={{ mt:1, fontWeight:"bold" }}>
              Day-wise usage:
            </Typography>
            {loading && <Typography>Loading lumps...</Typography>}
            {err && <Typography sx={{ color:"red" }}>{err}</Typography>}
            {!loading && !err && lumpsArr.map((ln, i2) => (
              <Typography variant="body2" key={i2} sx={{ ml:2 }}>
                {ln.date} {'>'} {formatSeconds(ln.sec)}
              </Typography>
            ))}

            {/* Concept wise pass/fail => aggregator concepts vs quizSubmission */}
            {conceptList.length > 0 && (
              <Box sx={{ mt:1 }}>
                <Typography variant="body2" sx={{ fontWeight:"bold" }}>
                  Concept wise:
                </Typography>
                {conceptList.map((cObj, i3) => {
                  const cName = cObj.name || `Concept ${cObj.id}`;
                  const foundQ = att.quizSubmission?.find(
                    qq => (qq.conceptName || "").toLowerCase() === cName.toLowerCase()
                  );
                  let passFail = "Not Tested";
                  if (foundQ) {
                    passFail = Number(foundQ.score) >= 1 ? "PASS" : "FAIL";
                  }
                  return (
                    <Typography variant="body2" key={i3} sx={{ ml:2 }}>
                      {cName} {'>'} {passFail}
                    </Typography>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

/** reading lumps => date => sum */
function ReadingDayBreakdown({ details }) {
  const map = {};
  details.forEach((doc) => {
    if (doc.collection === "readingSubActivity") {
      const day = doc.dateStr || "(no date)";
      if (!map[day]) map[day] = 0;
      map[day] += doc.totalSeconds || 0;
    }
  });
  const arr = Object.keys(map).sort().map(d => ({ date: d, sec: map[d] }));

  return (
    <Box sx={{ ml:2, mt:1 }}>
      {arr.map((row, idx) => (
        <Typography variant="body2" key={idx}>
          {row.date} {'>'} {formatSeconds(row.sec)}
        </Typography>
      ))}
    </Box>
  );
}

/** 
 * quiz lumps => Q# or R# => date => sum 
 * filtering doc by attemptNumber or revisionNumber + doc.collection
 */
function buildDayBreakdown(details, label, att) {
  const outMap = {};

  details.forEach(doc => {
    // label => "Q1" or "R2"
    if (label.startsWith("Q") && doc.collection === "quizTimeSubActivity") {
      const desiredNum = parseInt(label.slice(1), 10) || 1;
      if (doc.attemptNumber === desiredNum) {
        const d = doc.dateStr || "(no date)";
        if (!outMap[d]) outMap[d] = 0;
        outMap[d] += doc.totalSeconds || 0;
      }
    } else if (label.startsWith("R") && doc.collection === "reviseTimeSubActivity") {
      const desiredNum = parseInt(label.slice(1), 10) || 1;
      if (doc.revisionNumber === desiredNum) {
        const d = doc.dateStr || "(no date)";
        if (!outMap[d]) outMap[d] = 0;
        outMap[d] += doc.totalSeconds || 0;
      }
    }
  });

  const arr = [];
  Object.keys(outMap).sort().forEach(dKey => {
    arr.push({ date: dKey, sec: outMap[dKey] });
  });
  return arr;
}