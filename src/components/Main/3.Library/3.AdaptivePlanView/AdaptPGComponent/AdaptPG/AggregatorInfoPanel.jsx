// File: AggregatorInfoPanel.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";

import Pill from "./Pill";
import ExplanationModal from "./ExplanationModal";

/** formatSeconds => e.g. 125 => "2m 5s" */
function formatSeconds(sec) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 1) {
    return `${sec}s`;
  }
  return `${m}m ${s}s`;
}

function checkAggregatorLocked(activity, subchapterStatusMap) {
  const aggregatorLocked = (activity.aggregatorStatus || "").toLowerCase() === "locked";
  let lockedFromAPI = false;
  const subChId = activity.subChapterId || "";
  if (subChId && subchapterStatusMap[subChId]?.taskInfo) {
    const rawType = (activity.type || "").toLowerCase();
    const stageKey = rawType.includes("read")
      ? "reading"
      : (activity.quizStage || "").toLowerCase();

    const found = subchapterStatusMap[subChId].taskInfo.find(
      (ti) => (ti.stageLabel || "").toLowerCase() === stageKey
    );
    if (found?.locked) lockedFromAPI = true;
  }
  return aggregatorLocked || lockedFromAPI;
}

export default function AggregatorInfoPanel({
  activity,
  timeMap,
  subchapterStatusMap,
  setTimeDetailOpen,
  setTimeDetailTitle,
  setTimeDetailData,

  timeFetchLogs,
  statusFetchLogs,
}) {
  const lumpsSec = timeMap[activity.activityId] || 0;
  const lumpsStr = formatSeconds(lumpsSec);
  const expectedMin = activity.timeNeeded || 0;
  const expectedStr = `${expectedMin}m`;

  const aggregatorLocked = checkAggregatorLocked(activity, subchapterStatusMap);
  const planCompletion = (activity.completionStatus || "").toLowerCase();

  let finalStatusLabel = "Not Started";
  let finalStatusColor = "#EF5350";
  if (planCompletion === "complete") {
    finalStatusLabel = "Complete";
    finalStatusColor = "#66BB6A";
  } else if (aggregatorLocked) {
    finalStatusLabel = "Locked";
    finalStatusColor = "#9E9E9E";
  } else if (planCompletion === "deferred") {
    finalStatusLabel = "Deferred";
    finalStatusColor = "#FFA726";
  } else if (lumpsSec > 0) {
    finalStatusLabel = "WIP";
    finalStatusColor = "#BDBDBD";
  }

  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanationData, setExplanationData] = useState([]);

  function openExplanation(fieldName) {
    let relevantLogs = [];
    if (fieldName === "timeSpent") {
      relevantLogs = timeFetchLogs.filter(
        (log) => log.field === "timeSpent" && log.activityId === activity.activityId
      );
    } else if (fieldName === "locked") {
      if (activity.subChapterId) {
        relevantLogs = statusFetchLogs.filter(
          (log) => log.subchapterId === activity.subChapterId
        );
      }
    }
    setExplanationData(relevantLogs);
    setExplanationOpen(true);
  }
  function closeExplanation() {
    setExplanationOpen(false);
    setExplanationData([]);
  }

  // ============== NEW => minimal snippet-based breakdown ==============
  const [timeBreakdown, setTimeBreakdown] = useState(null); // { totalTime, details }
  const [timeErr, setTimeErr] = useState("");

  const rawType = (activity.type || "").toLowerCase();
  const isReading = rawType.includes("read");
  const apiType = isReading ? "read" : "quiz";

  useEffect(() => {
    if (!activity?.activityId) return;
    let cancel = false;
    async function doFetch() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, {
          params: { activityId: activity.activityId, type: apiType },
        });
        if (!cancel) {
          setTimeBreakdown(res.data);
          setTimeErr("");
        }
      } catch (err) {
        if (!cancel) {
          console.error("AggregatorInfo => time breakdown =>", err);
          setTimeErr(err.message || "Error fetching time breakdown");
        }
      }
    }
    doFetch();
    return () => { cancel=true; };
  }, [activity.activityId, apiType]);

  // For reading => group by date => sum
  // For quiz => group by Q# or R# => each can have multiple dates => sum
  const snippet = buildSnippet(timeBreakdown?.details || [], isReading);

  return (
    <Box sx={{ mb: 2, pl: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Aggregator Fields
      </Typography>

      {/* TIME SPENT */}
      <Box sx={{ mb: 2, ml: 2, borderLeft:"2px solid #999", pl:1 }}>
        <Typography variant="body2" sx={{ mb:1, fontWeight:"bold" }}>
          Time Spent
        </Typography>
        <Box sx={{ display:"flex", alignItems:"center", mb:0.5 }}>
          <Typography variant="body2" sx={{ width:130 }}>
            Actual Time:
          </Typography>
          <Tooltip title={`Elapsed: ${lumpsStr}`}>
            <Pill text={lumpsStr} />
          </Tooltip>

          <InfoOutlinedIcon
            sx={{ ml:1, fontSize:"1rem", cursor:"pointer" }}
            onClick={(e)=> {
              e.stopPropagation();
              openExplanation("timeSpent");
            }}
          />

          <AccessTimeIcon
            sx={{ ml:1, fontSize:"1rem", cursor:"pointer" }}
            onClick={(e)=> {
              e.stopPropagation();
              if (setTimeDetailOpen) {
                setTimeDetailTitle(`Time Breakdown => activityId='${activity.activityId}'`);
                setTimeDetailData([]); // or fetch lumps
                setTimeDetailOpen(true);
              }
            }}
          />
        </Box>

        {/* Our snippet => reading => [ { date, totalSec } ] 
           quiz => [ { label:'Q1', items:[ { date:'2025-04-08', sec:30}, ... ] }, ... ]
        */}
        {timeErr ? (
          <Typography sx={{ color:"red", mt:1 }}>Error: {timeErr}</Typography>
        ) : snippet.length>0 && (
          <Box sx={{ mt:1, ml:1, p:1, backgroundColor:"#333", borderRadius:1 }}>
            {isReading ? (
              // Reading => snippet is [ { date:'2025-04-08', totalSec:120 }, ...]
              snippet.map((row, idx) => (
                <Typography variant="body2" key={idx}>
                  {row.date} &gt; {formatSeconds(row.totalSec)}
                </Typography>
              ))
            ) : (
              // Quiz => snippet is [ { label:'Q1', dates:[ { date:'2025-04-08', sec:30}, ... ]}, ... ]
              snippet.map((attemptObj, i2) => (
                <Box sx={{ mb:1 }} key={i2}>
                  <Typography variant="body2" sx={{ fontWeight:600 }}>
                    {attemptObj.label}
                  </Typography>
                  {attemptObj.dates.map((dRow, i3) => (
                    <Typography variant="body2" key={i3} sx={{ ml:2 }}>
                      {dRow.date} &gt; {formatSeconds(dRow.sec)}
                    </Typography>
                  ))}
                </Box>
              ))
            )}
          </Box>
        )}

        {/* Expected Time */}
        <Box sx={{ display:"flex", alignItems:"center", mb:0.5, mt:1 }}>
          <Typography variant="body2" sx={{ width:130 }}>
            Expected Time:
          </Typography>
          <Pill text={expectedStr} />
        </Box>
      </Box>

      {/* COMPLETION STATUS */}
      <Box sx={{ mb:1, ml:2, borderLeft:"2px solid #999", pl:1 }}>
        <Typography variant="body2" sx={{ mb:1, fontWeight:"bold" }}>
          Completion Status
        </Typography>

        <Box sx={{ display:"flex", alignItems:"center", mb:0.5 }}>
          <Typography variant="body2" sx={{ width:130 }}>
            Plan Completion:
          </Typography>
          <Pill text={planCompletion||"(none)"} />
        </Box>

        {/* aggregatorLocked => Eye for subchapter logs */}
        <Box sx={{ display:"flex", alignItems:"center", mb:0.5 }}>
          <Typography variant="body2" sx={{ width:130 }}>
            Aggregator Locked:
          </Typography>
          <Pill text={aggregatorLocked ? "Yes" : "No"} bgColor={aggregatorLocked?"#9E9E9E":"#424242"} />
          <InfoOutlinedIcon
            sx={{ ml:1, fontSize:"1rem", cursor:"pointer" }}
            onClick={(e)=> {
              e.stopPropagation();
              openExplanation("locked");
            }}
          />
        </Box>

        {/* lumpsSec => if >0 => WIP */}
        <Box sx={{ display:"flex", alignItems:"center", mb:0.5 }}>
          <Typography variant="body2" sx={{ width:130 }}>
            User Spent Time?
          </Typography>
          <Pill text={lumpsSec>0?"Yes":"No"} />
        </Box>

        {/* Final derived */}
        <Box sx={{ display:"flex", alignItems:"center", mb:0.5 }}>
          <Typography variant="body2" sx={{ width:130 }}>
            Final Status:
          </Typography>
          <Pill text={finalStatusLabel} bgColor={finalStatusColor} textColor="#000" />
        </Box>
      </Box>

      {/* Explanation logs */}
      <ExplanationModal
        open={explanationOpen}
        logs={explanationData}
        onClose={closeExplanation}
        title="Aggregator Explanation"
      />
    </Box>
  );
}


// ============== Some small sub-helpers ==============

// If reading => returns [ { date, totalSec }, ... ]
// If quiz => returns [ { label:'Q1', dates:[ { date:'2025-04-08', sec:30 }, ... ] }, ... ]
function buildSnippet(details, isReading) {
  if (!details?.length) return [];

  if (isReading) {
    // group by date => sum
    const map = {};
    details.forEach((doc) => {
      const d = doc.dateStr || "(no date)";
      if (!map[d]) map[d] = 0;
      map[d] += doc.totalSeconds||0;
    });
    return Object.keys(map).sort().map((dateKey) => ({
      date: dateKey,
      totalSec: map[dateKey],
    }));
  } else {
    // quiz => group by Q# or R# => each can have multiple date items
    // example: { 'Q1': { '2025-04-08':30, '2025-04-09':60 }, 'R1':... }
    const qMap = {};
    details.forEach((doc) => {
      if (doc.collection==="quizTimeSubActivity") {
        const qNum = doc.attemptNumber||1;
        const label = `Q${qNum}`;
        if (!qMap[label]) qMap[label] = {};
        const d = doc.dateStr||"(no date)";
        if (!qMap[label][d]) qMap[label][d] = 0;
        qMap[label][d]+= doc.totalSeconds||0;
      } else if (doc.collection==="reviseTimeSubActivity") {
        const rNum = doc.revisionNumber||1;
        const label = `R${rNum}`;
        if (!qMap[label]) qMap[label] = {};
        const d = doc.dateStr||"(no date)";
        if (!qMap[label][d]) qMap[label][d] = 0;
        qMap[label][d]+= doc.totalSeconds||0;
      }
      // ignore readingSubActivity if it accidentally appears
    });
    // convert => [ { label:'Q1', dates:[ { date:'2025-04-08', sec:30}, ... ]} ]
    const out = [];
    Object.keys(qMap).sort().forEach((lab) => {
      const dateObj = qMap[lab];
      const dateArr = [];
      Object.keys(dateObj).sort().forEach((dKey) => {
        dateArr.push({ date: dKey, sec: dateObj[dKey] });
      });
      out.push({ label: lab, dates: dateArr });
    });
    return out;
  }
}