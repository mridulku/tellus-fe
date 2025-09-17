import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

// ==============================================
// HELPER CONSTANTS & UTILS
// ==============================================
const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

/** For numeric sorting in chapter/subchapter titles, e.g. "1.2 Some Title" */
function parseNumericPrefix(title = "") {
  const match = title.trim().match(/^(\d+(\.\d+){0,2})/);
  if (match) {
    return parseFloat(match[1]);
  }
  return Infinity;
}

/** Format time: if <1 min => Xs, else X.Y min */
function formatTimeSpent(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0 min";
  }
  if (totalMinutes < 1) {
    const secs = Math.round(totalMinutes * 60);
    return `${secs}s`;
  }
  return `${totalMinutes.toFixed(1)} min`;
}

/** Turn a Firestore timestamp into a JS date, or null if missing. */
function toJsDateObj(ts) {
  if (!ts) return null;
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (ts._seconds) return new Date(ts._seconds * 1000);
  // if it's a Date object
  if (ts instanceof Date) return ts;
  return null;
}

/** Sort attempts by timestamp (fallback to attemptNumber). */
function sortAttemptsByTimeOrNumber(arr) {
  return arr.slice().sort((a, b) => {
    const ta = toJsDateObj(a.timestamp);
    const tb = toJsDateObj(b.timestamp);
    if (ta && tb) return ta - tb;
    if (ta && !tb) return -1;
    if (!ta && tb) return 1;
    // fallback => attemptNumber
    const anA = a.attemptNumber || a.revisionNumber || 0;
    const anB = b.attemptNumber || b.revisionNumber || 0;
    return anA - anB;
  });
}

/** Build concept stats for a single quiz submission array. */
function buildConceptStats(quizSubmission, conceptArr) {
  const countMap = {};
  quizSubmission.forEach((q) => {
    const cName = q.conceptName || "UnknownConcept";
    if (!countMap[cName]) {
      countMap[cName] = { correct: 0, total: 0 };
    }
    countMap[cName].total++;
    if (q.score && parseFloat(q.score) >= 1) {
      countMap[cName].correct++;
    }
  });
  const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
  if (countMap["UnknownConcept"]) conceptNamesSet.add("UnknownConcept");

  const statsArray = [];
  conceptNamesSet.forEach((cName) => {
    const rec = countMap[cName] || { correct: 0, total: 0 };
    const ratio = rec.total > 0 ? rec.correct / rec.total : 0;
    let passOrFail = "FAIL";
    if (rec.total === 0) {
      passOrFail = "NOT_TESTED";
    } else if (ratio === 1.0) {
      passOrFail = "PASS";
    }
    statsArray.push({
      conceptName: cName,
      correct: rec.correct,
      total: rec.total,
      ratio,
      passOrFail,
    });
  });
  return statsArray;
}

/** Combine multiple quiz attempts => array of concept stats. */
function buildAllAttemptsConceptStats(quizArr, conceptArr) {
  if (!quizArr.length || !conceptArr.length) {
    return [];
  }
  return quizArr.map((attempt) => {
    const stats = buildConceptStats(attempt.quizSubmission || [], conceptArr);
    return {
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      conceptStats: stats,
      timestamp: attempt.timestamp || null,
    };
  });
}

/** 
 * Compare attempts => find pass-or-fail 
 * Return how many unique concepts are passed 
 */
function computePassCount(allAttemptsConceptStats) {
  if (!allAttemptsConceptStats?.length) return 0;
  const passedSet = new Set();
  for (let attempt of allAttemptsConceptStats) {
    for (let cs of attempt.conceptStats || []) {
      if (cs.passOrFail === "PASS") {
        passedSet.add(cs.conceptName);
      }
    }
  }
  return passedSet.size;
}

// Reading logic
function getReadingStatus(readObj) {
  if (!readObj) {
    return {
      overall: "not-started",
      style: { backgroundColor: "#ffcccc" },
      completionDateStr: "",
      timeSpentStr: "0 min",
    };
  }
  const { totalTimeSpentMinutes, completionDate } = readObj;
  let dateStr = "";
  if (completionDate instanceof Date) {
    dateStr = completionDate.toLocaleDateString();
  }
  const timeStr = formatTimeSpent(totalTimeSpentMinutes || 0);

  if (completionDate instanceof Date) {
    // done
    return {
      overall: "done",
      style: { backgroundColor: "#ccffcc" },
      completionDateStr: dateStr,
      timeSpentStr: timeStr,
    };
  } else if ((totalTimeSpentMinutes || 0) > 0) {
    // in-progress
    return {
      overall: "in-progress",
      style: { backgroundColor: "#fff8b3" },
      completionDateStr: dateStr,
      timeSpentStr: timeStr,
    };
  }
  return {
    overall: "not-started",
    style: { backgroundColor: "#ffcccc" },
    completionDateStr: "",
    timeSpentStr: "0 min",
  };
}

// Quiz stage logic
function getQuizStageStatus(stageData) {
  if (!stageData) {
    return { overall: "not-started", masteryPct: 0, timeStr: "0 min" };
  }
  const totalConcepts = stageData.subchapterConcepts?.length || 0;
  const passCount = computePassCount(stageData.allAttemptsConceptStats);
  const masteryPct = totalConcepts === 0 ? 0 : (passCount / totalConcepts) * 100;
  const timeStr = formatTimeSpent(stageData.timeSpentMinutes || 0);

  if (masteryPct >= 100) {
    return { overall: "done", masteryPct, timeStr };
  } else if (masteryPct > 0 || (stageData.timeSpentMinutes || 0) > 0) {
    return { overall: "in-progress", masteryPct, timeStr };
  }
  return { overall: "not-started", masteryPct, timeStr };
}

// Next tasks
function getReadingTaskInfo(rStatus) {
  if (rStatus.overall === "done") {
    return { hasTask: false, taskLabel: "" };
  }
  return { hasTask: true, taskLabel: "READ" };
}
function getQuizStageTaskInfo(stageData, stageStatus) {
  if (!stageData) {
    // not started => next => quiz1
    if (stageStatus.overall === "done") {
      return { hasTask: false, taskLabel: "" };
    }
    return { hasTask: true, taskLabel: "QUIZ1" };
  }
  if (stageStatus.overall === "done") {
    return { hasTask: false, taskLabel: "" };
  }
  const quizArr = stageData.quizAttempts || [];
  const revArr  = stageData.revisionAttempts || [];
  // gather all => sort by timestamp
  const combined = [];
  quizArr.forEach((q) => combined.push({ type: "quiz", attemptNumber: q.attemptNumber || 1, timestamp: q.timestamp || null }));
  revArr.forEach((r) => combined.push({ type: "revision", attemptNumber: r.revisionNumber || 1, timestamp: r.timestamp || null }));
  sortAttemptsByTimeOrNumber(combined);

  if (combined.length === 0) {
    return { hasTask: true, taskLabel: "QUIZ1" };
  }
  const last = combined[combined.length - 1];
  if (last.type === "quiz") {
    return { hasTask: true, taskLabel: `REVISION${last.attemptNumber}` };
  } else {
    return { hasTask: true, taskLabel: `QUIZ${last.attemptNumber + 1}` };
  }
}

// ==============================================
// MAIN COMPONENT: "ProgressView"
// ==============================================
export default function ProgressView({
  db,
  userId,
  planId,
  bookId = "",
  colorScheme = {},
}) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [chapters, setChapters] = useState([]);

  // lumps & completions (like PlanUsageHistory):
  const [dailyTimeRecords, setDailyTimeRecords] = useState([]);
  const [readingActs, setReadingActs] = useState([]);
  const [quizActs, setQuizActs]       = useState([]);
  const [reviseActs, setReviseActs]   = useState([]);

  const [readingCompletions, setReadingCompletions] = useState([]);
  const [quizCompletions, setQuizCompletions]       = useState([]);
  const [revisionCompletions, setRevisionCompletions] = useState([]);

  const [dateOptions, setDateOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // aggregator data => quizDataMap[subChId][stage]
  const [quizDataMap, setQuizDataMap] = useState({});
  // readingStats => { [subChId]: { totalTimeSpentMinutes, completionDate } }
  const [readingStats, setReadingStats] = useState({});

  // For expansions
  const [chapterExpanded, setChapterExpanded] = useState({});
  // For modals
  const [taskInfoOpen, setTaskInfoOpen] = useState(false);
  const [taskInfoSubChId, setTaskInfoSubChId] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySubChId, setHistorySubChId] = useState("");
  const [historyStage, setHistoryStage] = useState("");

  // 1) On mount => fetch lumps + chapters + aggregator data
  useEffect(() => {
    if (!db || !userId || !planId) return;

    setLoading(true);
    setError("");

    // a) fetch lumps (like planUsageHistory)
    fetchAllLumpsAndCompletions()
      .then(() => {
        // b) fetch chapters
        return fetchChaptersAndSubs();
      })
      .then((chapArr) => {
        setChapters(chapArr);
        // c) build aggregator for each subchapter/stage
        const allSubChIds = [];
        chapArr.forEach((ch) => {
          ch.subchapters.forEach((sub) => allSubChIds.push(sub.id));
        });
        const tasks = [];
        for (const scId of allSubChIds) {
          // reading => store in readingStats from lumps+completions
          // quiz => gather aggregator
          for (const st of QUIZ_STAGES) {
            tasks.push(fetchQuizDataFor(scId, st));
          }
        }
        return Promise.all(tasks);
      })
      .catch((err) => {
        console.error("ProgressView => fetch data error:", err);
        setError(err.message || "Failed to fetch data for aggregator.");
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [db, userId, planId]);

  // Build readingStats after reading lumps + completions loaded:
  useEffect(() => {
    if (!readingActs.length && !readingCompletions.length) {
      return;
    }
    const readingStatsObj = buildReadingStatsFromReadingData(readingActs, readingCompletions);
    setReadingStats(readingStatsObj);
  }, [readingActs, readingCompletions]);

  // 2) fetch lumps+completions => store in state
  async function fetchAllLumpsAndCompletions() {
    // a) dailyTimeRecords
    const dailyArr = await fetchCollectionDocs("dailyTimeRecords", { userId, planId });
    setDailyTimeRecords(dailyArr);

    // b) readingSubActivity
    const rActs = await fetchCollectionDocs("readingSubActivity", { userId, planId }, { orderByField: "dateStr" });
    setReadingActs(rActs);

    // c) quizTimeSubActivity
    const qActs = await fetchCollectionDocs("quizTimeSubActivity", { userId, planId }, { orderByField: "dateStr" });
    setQuizActs(qActs);

    // d) reviseTimeSubActivity
    const rvActs = await fetchCollectionDocs("reviseTimeSubActivity", { userId, planId }, { orderByField: "dateStr" });
    setReviseActs(rvActs);

    // e) reading_demo
    const readComps = await fetchCollectionDocs("reading_demo", { userId, planId }, { orderByField: "timestamp" });
    setReadingCompletions(readComps);

    // f) quizzes_demo
    const quizComps = await fetchCollectionDocs("quizzes_demo", { userId, planId }, { orderByField: "timestamp" });
    setQuizCompletions(quizComps);

    // g) revisions_demo
    const revComps = await fetchCollectionDocs("revisions_demo", { userId, planId }, { orderByField: "timestamp" });
    setRevisionCompletions(revComps);

    // unify dateStr
    const dateSet = new Set();
    dailyArr.forEach((dr) => dateSet.add(dr.dateStr));
    rActs.forEach((ra) => dateSet.add(ra.dateStr));
    qActs.forEach((qa) => dateSet.add(qa.dateStr));
    rvActs.forEach((rv) => dateSet.add(rv.dateStr));

    readComps.forEach((rc) => {
      const ds = rc.dateStr || fromTimestampToDateStr(rc.timestamp);
      rc.dateStr = ds;
      dateSet.add(ds);
    });
    quizComps.forEach((qc) => {
      const ds = qc.dateStr || fromTimestampToDateStr(qc.timestamp);
      qc.dateStr = ds;
      dateSet.add(ds);
    });
    revComps.forEach((rvc) => {
      const ds = rvc.dateStr || fromTimestampToDateStr(rvc.timestamp);
      rvc.dateStr = ds;
      dateSet.add(ds);
    });

    const finalDates = Array.from(dateSet).sort();
    setDateOptions(finalDates);
    if (finalDates.length > 0) {
      setSelectedDate(finalDates[0]);
    }
  }

  async function fetchCollectionDocs(collectionName, filters, opts = {}) {
    // filters => { userId, planId, (optional: bookId) }
    // build query
    let colRef = collection(db, collectionName);
    let qRef = query(colRef, where("userId", "==", filters.userId), where("planId", "==", filters.planId));
    if (filters.bookId) {
      qRef = query(qRef, where("bookId", "==", filters.bookId));
    }
    if (opts.orderByField) {
      qRef = query(qRef, orderBy(opts.orderByField, "asc"));
    }
    const snap = await getDocs(qRef);
    const arr = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        docId: docSnap.id,
        ...d,
      };
    });
    return arr;
  }

  function fromTimestampToDateStr(ts) {
    const dObj = toJsDateObj(ts);
    if (!dObj) return "UnknownDate";
    const y = dObj.getFullYear();
    const m = String(dObj.getMonth() + 1).padStart(2, "0");
    const day = String(dObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  // b) fetchChapters => subchapters
  async function fetchChaptersAndSubs() {
    if (!bookId) return [];
    const chapQ = query(collection(db, "chapters_demo"), where("bookId", "==", bookId));
    const chapSnap = await getDocs(chapQ);
    const result = [];
    for (const cDoc of chapSnap.docs) {
      const cData = cDoc.data();
      const cObj = {
        id: cDoc.id,
        title: cData.title || cData.name || `Chapter-${cDoc.id}`,
        subchapters: [],
      };
      // subchapters
      const subQ = query(collection(db, "subchapters_demo"), where("chapterId", "==", cDoc.id));
      const subSnap = await getDocs(subQ);
      const subArr = [];
      for (const sDoc of subSnap.docs) {
        const sData = sDoc.data();
        subArr.push({
          id: sDoc.id,
          name: sData.title || sData.name || `SubCh ${sDoc.id}`,
        });
      }
      subArr.sort((a, b) => parseNumericPrefix(a.name) - parseNumericPrefix(b.name));
      cObj.subchapters = subArr;
      result.push(cObj);
    }
    // sort chapters
    result.sort((a, b) => parseNumericPrefix(a.title) - parseNumericPrefix(b.title));
    return result;
  }

  // c) aggregator => subCh + stage => quizDataMap
  async function fetchQuizDataFor(subChId, quizStage) {
    try {
      // skip if we already have it
      if (quizDataMap[subChId]?.[quizStage]) return;
      // quiz attempts
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: {
          userId,
          planId,
          subchapterId: subChId,
          quizType: quizStage,
        },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // revision attempts
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: {
          userId,
          planId,
          subchapterId: subChId,
          revisionType: quizStage,
        },
      });
      const revArr = revRes?.data?.revisions || [];

      // concepts
      const conceptRes = await axios.get("http://localhost:3001/api/getSubchapterConcepts", {
        params: { subchapterId: subChId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      // concept stats => all attempts
      const allAttemptsConceptStats = buildAllAttemptsConceptStats(quizArr, conceptArr);

      // aggregator => quizTime + reviseTime => total seconds => to minutes
      const quizSec   = await fetchCumulativeQuizTime(subChId, quizStage);
      const reviseSec = await fetchCumulativeReviseTime(subChId, quizStage);
      const totalMinutes = (quizSec + reviseSec) / 60.0;

      setQuizDataMap((prev) => {
        const copy = { ...prev };
        if (!copy[subChId]) copy[subChId] = { maxConceptsSoFar: 0 };
        copy[subChId][quizStage] = {
          quizAttempts: quizArr,
          revisionAttempts: revArr,
          subchapterConcepts: conceptArr,
          allAttemptsConceptStats,
          timeSpentMinutes: totalMinutes,
        };
        const cLen = conceptArr.length;
        if (cLen > copy[subChId].maxConceptsSoFar) {
          copy[subChId].maxConceptsSoFar = cLen;
        }
        return copy;
      });
    } catch (err) {
      console.error("ProgressView => fetchQuizDataFor error:", err);
    }
  }
  async function fetchCumulativeQuizTime(subChId, quizStage) {
    try {
      const url = `http://localhost:3001/api/cumulativeQuizTime?userId=${userId}&planId=${planId}&subChapterId=${subChId}&quizStage=${quizStage}`;
      const res = await axios.get(url);
      return res.data.totalSeconds || 0;
    } catch (err) {
      console.error("fetchCumulativeQuizTime =>", err);
      return 0;
    }
  }
  async function fetchCumulativeReviseTime(subChId, quizStage) {
    try {
      const url = `http://localhost:3001/api/cumulativeReviseTime?userId=${userId}&planId=${planId}&subChapterId=${subChId}&quizStage=${quizStage}`;
      const res = await axios.get(url);
      return res.data.totalSeconds || 0;
    } catch (err) {
      console.error("fetchCumulativeReviseTime =>", err);
      return 0;
    }
  }

  // buildReadingStats from lumps + completions
  function buildReadingStatsFromReadingData(readArr, readCompArr) {
    // simplest approach => subCh => sum lumps => if we find a completion => done
    // you can reuse the logic from "buildReadingStats" if you want
    const map = {};
    // lumps => sum
    for (const r of readArr) {
      const scId = r.subChapterId || "";
      if (!map[scId]) {
        map[scId] = { totalTimeSpentMinutes: 0, completionDate: null };
      }
      map[scId].totalTimeSpentMinutes += (r.totalSeconds || 0) / 60.0;
    }
    // completions => pick the earliest date => set completion
    for (const rc of readCompArr) {
      const scId = rc.subChapterId || "";
      if (!map[scId]) {
        map[scId] = { totalTimeSpentMinutes: 0, completionDate: null };
      }
      // set completionDate => if we find a readingEndTime or timestamp
      const dateObj = toJsDateObj(rc.timestamp);
      if (dateObj) {
        // pick earliest or latest
        // let's pick earliest => e.g. if user read it multiple times
        if (!map[scId].completionDate || dateObj < map[scId].completionDate) {
          map[scId].completionDate = dateObj;
        }
      }
    }
    return map;
  }

  // -------------- expansions
  function toggleChapter(chId) {
    setChapterExpanded((prev) => {
      const copy = { ...prev };
      copy[chId] = !copy[chId];
      return copy;
    });
  }

  // -------------- "Task Info" modal
  function handleOpenTaskInfo(subChId) {
    setTaskInfoSubChId(subChId);
    setTaskInfoOpen(true);
  }
  function handleCloseTaskInfo() {
    setTaskInfoOpen(false);
    setTaskInfoSubChId("");
  }
  function renderTaskInfoContent() {
    if (!taskInfoSubChId) return <p>No subchapter selected.</p>;

    // gather reading
    const readObj = readingStats[taskInfoSubChId] || null;
    const rStatus = getReadingStatus(readObj);

    const rememberData = quizDataMap[taskInfoSubChId]?.remember;
    const rememberStatus = getQuizStageStatus(rememberData);
    const understandData = quizDataMap[taskInfoSubChId]?.understand;
    const understandStatus = getQuizStageStatus(understandData);
    const applyData = quizDataMap[taskInfoSubChId]?.apply;
    const applyStatus = getQuizStageStatus(applyData);
    const analyzeData = quizDataMap[taskInfoSubChId]?.analyze;
    const analyzeStatus = getQuizStageStatus(analyzeData);

    // locked
    const rememberLocked = (rStatus.overall !== "done");
    const understandLocked = (rememberStatus.overall !== "done");
    const applyLocked = (understandStatus.overall !== "done");
    const analyzeLocked = (applyStatus.overall !== "done");

    // next tasks
    const readingTask = getReadingTaskInfo(rStatus);
    const rememberTask = getQuizStageTaskInfo(rememberData, rememberStatus);
    const understandTask= getQuizStageTaskInfo(understandData, understandStatus);
    const applyTask    = getQuizStageTaskInfo(applyData, applyStatus);
    const analyzeTask  = getQuizStageTaskInfo(analyzeData, analyzeStatus);

    // active
    let readingActive      = false;
    let rememberActive     = false;
    let understandActive   = false;
    let applyActive        = false;
    let analyzeActive      = false;

    if (rStatus.overall !== "done") {
      readingActive = true;
    } else if (rememberStatus.overall !== "done" && !rememberLocked) {
      rememberActive = true;
    } else if (understandStatus.overall !== "done" && !understandLocked) {
      understandActive = true;
    } else if (applyStatus.overall !== "done" && !applyLocked) {
      applyActive = true;
    } else if (analyzeStatus.overall !== "done" && !analyzeLocked) {
      analyzeActive = true;
    }

    const rows = [
      {
        stageLabel: "Reading",
        locked: false,
        status: rStatus.overall,
        nextTaskLabel: readingTask.taskLabel,
        hasTask: readingTask.hasTask,
        isActive: readingActive,
      },
      {
        stageLabel: "Remember",
        locked: rememberLocked,
        status: rememberStatus.overall,
        nextTaskLabel: rememberTask.taskLabel,
        hasTask: rememberTask.hasTask,
        isActive: rememberActive,
      },
      {
        stageLabel: "Understand",
        locked: understandLocked,
        status: understandStatus.overall,
        nextTaskLabel: understandTask.taskLabel,
        hasTask: understandTask.hasTask,
        isActive: understandActive,
      },
      {
        stageLabel: "Apply",
        locked: applyLocked,
        status: applyStatus.overall,
        nextTaskLabel: applyTask.taskLabel,
        hasTask: applyTask.hasTask,
        isActive: applyActive,
      },
      {
        stageLabel: "Analyze",
        locked: analyzeLocked,
        status: analyzeStatus.overall,
        nextTaskLabel: analyzeTask.taskLabel,
        hasTask: analyzeTask.hasTask,
        isActive: analyzeActive,
      },
    ];

    return (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={tdStyle}>Stage</th>
            <th style={tdStyle}>Locked?</th>
            <th style={tdStyle}>Status</th>
            <th style={tdStyle}>Next Task</th>
            <th style={tdStyle}>Active?</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stageLabel}>
              <td style={tdStyle}>{row.stageLabel}</td>
              <td style={tdStyle}>{row.locked ? "Yes" : "No"}</td>
              <td style={tdStyle}>{row.status}</td>
              <td style={tdStyle}>{row.hasTask ? row.nextTaskLabel : "No Task Needed"}</td>
              <td style={tdStyle}>{row.isActive ? "ACTIVE" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
  const tdStyle = {
    border: "1px solid #ccc",
    padding: "6px 8px",
  };

  // -------------- History Modal
  function handleOpenHistory(subChId, stage) {
    setHistorySubChId(subChId);
    setHistoryStage(stage);
    setHistoryOpen(true);
  }
  function handleCloseHistory() {
    setHistoryOpen(false);
    setHistorySubChId("");
    setHistoryStage("");
  }
  function renderHistoryModalContent() {
    // gather the aggregator data for (subChId, stage)
    if (!historySubChId || !historyStage) return <p>No stage selected.</p>;
    const data = quizDataMap[historySubChId]?.[historyStage];
    if (!data) {
      return <p>No data found for subCh={historySubChId}, stage={historyStage}.</p>;
    }

    // We'll show attempts, concept stats, etc.
    const quizArr = data.quizAttempts || [];
    const revArr  = data.revisionAttempts || [];
    quizArr.sort((a,b)=> (a.attemptNumber||0)-(b.attemptNumber||0));
    revArr.sort((a,b)=> (a.revisionNumber||0)-(b.revisionNumber||0));

    return (
      <div style={{ color: "#fff" }}>
        <h4>Quiz Attempts</h4>
        {quizArr.length===0? <p>No quiz attempts yet.</p>:(
          quizArr.map((q) => (
            <div key={q.attemptNumber} style={{ marginBottom: "0.5rem" }}>
              Attempt #{q.attemptNumber}, Score={q.score||"?"}
            </div>
          ))
        )}

        <h4>Revision Attempts</h4>
        {revArr.length===0? <p>No revision attempts yet.</p>:(
          revArr.map((r) => (
            <div key={r.revisionNumber} style={{ marginBottom: "0.5rem" }}>
              Revision #{r.revisionNumber}, type={r.revisionType}
            </div>
          ))
        )}

        <h4>Concepts</h4>
        <p>We have {data.subchapterConcepts?.length||0} concepts. 
          Mastery: {getQuizStageStatus(data).masteryPct.toFixed(0)}%</p>
      </div>
    );
  }

  // -------------- Filter lumps by date
  function lumpsForSelectedDate() {
    if (!selectedDate) return null;
    const dr = dailyTimeRecords.find((x) => x.dateStr===selectedDate) || null;
    const rA = readingActs.filter((x)=> x.dateStr===selectedDate);
    const qA = quizActs.filter((x)=> x.dateStr===selectedDate);
    const rvA= reviseActs.filter((x)=> x.dateStr===selectedDate);

    const rC = readingCompletions.filter((x)=> x.dateStr===selectedDate);
    const qC = quizCompletions.filter((x)=> x.dateStr===selectedDate);
    const rvC= revisionCompletions.filter((x)=> x.dateStr===selectedDate);

    return {dr,rA,qA,rvA,rC,qC,rvC};
  }

  // -------------- RENDER
  return (
    <div style={stylesBig.container}>
      <h2 style={stylesBig.title}>
        Overall Progress & Subchapter Aggregator
      </h2>

      {(!db || !userId || !planId) && (
        <p style={{ color: "red" }}>Missing db/userId/planId props.</p>
      )}

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && chapters.length===0 && (
        <p>No chapters found for bookId='{bookId}'.</p>
      )}

      {/* 1) Possibly show a date dropdown for lumps (like PlanUsageHistory) */}
      {dateOptions.length>0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "8px" }}>Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e)=> setSelectedDate(e.target.value)}
            style={{ padding:"4px", borderRadius:"4px", border:"1px solid #ccc" }}
          >
            {dateOptions.map((d)=>(
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      )}

      {/* 2) If a date is selected => show lumps/completions for that date */}
      {selectedDate && (
        <div style={stylesBig.lumpsBox}>
          <h4>Lumps/Completions for {selectedDate}</h4>
          {renderLumpsForSelectedDate()}
        </div>
      )}

      {/* 3) Aggregator table => chapters/subchapters with Reading + remember/understand/apply/analyze */}
      {chapters.map((ch) => {
        const expanded = chapterExpanded[ch.id] || false;
        return (
          <div key={ch.id} style={stylesBig.chapterBox}>
            <div
              style={stylesBig.chapterHeader}
              onClick={()=>toggleChapter(ch.id)}
            >
              <h3 style={{ margin:0 }}>
                {expanded ? "▾" : "▸"} {ch.title}
              </h3>
            </div>
            {expanded && (
              <div style={{ padding:"0.5rem" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      <th style={stylesBig.th}>Subchapter</th>
                      <th style={stylesBig.th}>Concepts</th>
                      <th style={stylesBig.th}>Reading</th>
                      <th style={stylesBig.th}>Remember</th>
                      <th style={stylesBig.th}>Understand</th>
                      <th style={stylesBig.th}>Apply</th>
                      <th style={stylesBig.th}>Analyze</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ch.subchapters.map((sub) => {
                      const subChId = sub.id;
                      const rObj = readingStats[subChId] || null;
                      const rStatus = getReadingStatus(rObj);

                      const subMap = quizDataMap[subChId] || {};
                      const rememberData   = subMap.remember;
                      const rememberStatus = getQuizStageStatus(rememberData);
                      const understandData = subMap.understand;
                      const understandStatus= getQuizStageStatus(understandData);
                      const applyData = subMap.apply;
                      const applyStatus = getQuizStageStatus(applyData);
                      const analyzeData = subMap.analyze;
                      const analyzeStatus = getQuizStageStatus(analyzeData);

                      const totalConcepts = subMap.maxConceptsSoFar || 0;

                      // locked logic
                      const rememberLocked = (rStatus.overall !== "done");
                      const understandLocked= (rememberStatus.overall !== "done");
                      const applyLocked = (understandStatus.overall !== "done");
                      const analyzeLocked= (applyStatus.overall !== "done");

                      return (
                        <tr key={subChId}>
                          <td style={stylesBig.tdName}>
                            <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                              <div>{sub.name}</div>
                              <button
                                style={stylesBig.infoBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenTaskInfo(subChId);
                                }}
                              >
                                i
                              </button>
                            </div>
                          </td>
                          <td style={stylesBig.tdCell}>{totalConcepts}</td>
                          {/* reading */}
                          <td style={{ ...stylesBig.tdCell, ...rStatus.style }}>
                            {renderReadingCell(rStatus)}
                          </td>
                          {/* remember */}
                          <td style={renderQuizCellStyle(rememberLocked, rememberStatus)}>
                            {renderStageCell(subChId, "remember", rememberLocked, rememberStatus)}
                          </td>
                          {/* understand */}
                          <td style={renderQuizCellStyle(understandLocked, understandStatus)}>
                            {renderStageCell(subChId, "understand", understandLocked, understandStatus)}
                          </td>
                          {/* apply */}
                          <td style={renderQuizCellStyle(applyLocked, applyStatus)}>
                            {renderStageCell(subChId, "apply", applyLocked, applyStatus)}
                          </td>
                          {/* analyze */}
                          <td style={renderQuizCellStyle(analyzeLocked, analyzeStatus)}>
                            {renderStageCell(subChId, "analyze", analyzeLocked, analyzeStatus)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Task Info modal */}
      <Dialog
        open={taskInfoOpen}
        onClose={handleCloseTaskInfo}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Subchapter Task Info – {taskInfoSubChId}</DialogTitle>
        <DialogContent dividers style={{ backgroundColor:"#222", color:"#fff" }}>
          {renderTaskInfoContent()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskInfo} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* History modal */}
      <Dialog
        open={historyOpen}
        onClose={handleCloseHistory}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle style={{ backgroundColor:"#222", color:"#fff" }}>
          Stage History for {historySubChId} - {historyStage}
        </DialogTitle>
        <DialogContent dividers style={{ backgroundColor:"#222", color:"#fff" }}>
          {renderHistoryModalContent()}
        </DialogContent>
        <DialogActions style={{ backgroundColor:"#222" }}>
          <Button onClick={handleCloseHistory} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  // ============ lumps for selected date
  function renderLumpsForSelectedDate() {
    if (!selectedDate) return null;
    const dr = dailyTimeRecords.find((x)=>x.dateStr===selectedDate) || null;
    const readA = readingActs.filter((x)=>x.dateStr===selectedDate);
    const quizA = quizActs.filter((x)=>x.dateStr===selectedDate);
    const revA  = reviseActs.filter((x)=>x.dateStr===selectedDate);

    const readC = readingCompletions.filter((x)=>x.dateStr===selectedDate);
    const quizC = quizCompletions.filter((x)=>x.dateStr===selectedDate);
    const revC  = revisionCompletions.filter((x)=>x.dateStr===selectedDate);

    const totalSec = dr?.totalSeconds || 0;
    return (
      <div style={{ padding:"0.5rem", backgroundColor:"#f1f1f1" }}>
        <p style={{ margin:0 }}>
          <strong>dailyTimeRecords:</strong> totalSeconds={totalSec}
        </p>
        <p style={{ margin:"4px 0" }}>
          <strong>readingSubActivity:</strong> {readA.length} record(s).
        </p>
        <p style={{ margin:"4px 0" }}>
          <strong>quizTimeSubActivity:</strong> {quizA.length} record(s).
        </p>
        <p style={{ margin:"4px 0" }}>
          <strong>reviseTimeSubActivity:</strong> {revA.length} record(s).
        </p>
        <p style={{ margin:"4px 0" }}>
          <strong>reading_demo:</strong> {readC.length} completions.
        </p>
        <p style={{ margin:"4px 0" }}>
          <strong>quizzes_demo:</strong> {quizC.length} completions.
        </p>
        <p style={{ margin:"4px 0" }}>
          <strong>revisions_demo:</strong> {revC.length} completions.
        </p>
      </div>
    );
  }

  // ============ reading cell
  function renderReadingCell(rStatus) {
    if (rStatus.overall==="not-started") {
      return <div>Not Started<br/>{rStatus.timeSpentStr}</div>;
    } else if (rStatus.overall==="in-progress") {
      return <div>In Progress<br/>{rStatus.timeSpentStr}</div>;
    }
    return <div>Done<br/>{rStatus.timeSpentStr}</div>;
  }

  // ============ quiz cell style
  function renderQuizCellStyle(isLocked, stStatus) {
    if (isLocked) {
      return { ...stylesBig.tdCell, backgroundColor:"#ddd" };
    }
    if (stStatus.overall==="done") {
      return { ...stylesBig.tdCell, backgroundColor:"#ccffcc" };
    } else if (stStatus.overall==="in-progress") {
      return { ...stylesBig.tdCell, backgroundColor:"#fff8b3" };
    }
    return { ...stylesBig.tdCell, backgroundColor:"#ffcccc" };
  }

  function renderStageCell(subChId, stage, locked, stStatus) {
    if (locked) {
      return <span style={{ fontWeight:"bold", opacity:0.6 }}>🔒 Locked</span>;
    }
    // else => show mastery + time + button => "View"
    return (
      <div>
        <div style={{ fontWeight:"bold" }}>{stStatus.masteryPct.toFixed(0)}%</div>
        <div style={{ fontSize:"0.8rem" }}>{stStatus.timeStr}</div>
        <button
          style={stylesBig.viewBtn}
          onClick={() => handleOpenHistory(subChId, stage)}
        >
          View
        </button>
      </div>
    );
  }
}

// ==============================================
// STYLES
// ==============================================
const stylesBig = {
  container: {
    backgroundColor:"#fff",
    padding:"16px",
    borderRadius:"6px",
    maxWidth:"1200px",
    margin:"20px auto",
    fontFamily:"sans-serif",
    color:"#000",
  },
  title: {
    marginTop:0,
    marginBottom:"1rem",
    textAlign:"center",
  },
  lumpsBox:{
    marginBottom:"1.5rem",
  },
  chapterBox:{
    border:"1px solid #ccc",
    borderRadius:"4px",
    marginBottom:"8px",
    backgroundColor:"#f9f9f9",
  },
  chapterHeader:{
    cursor:"pointer",
    padding:"8px 12px",
    backgroundColor:"#eee",
    display:"flex",
    alignItems:"center",
  },
  th:{
    border:"1px solid #ccc",
    backgroundColor:"#ddd",
    padding:"6px 8px",
    textAlign:"left",
  },
  tdName:{
    border:"1px solid #ccc",
    padding:"6px 8px",
    width:"22%",
    whiteSpace:"nowrap",
  },
  tdCell:{
    border:"1px solid #ccc",
    padding:"6px 8px",
    textAlign:"center",
    width:"13%",
  },
  infoBtn:{
    backgroundColor:"#444",
    color:"#fff",
    border:"none",
    borderRadius:"4px",
    padding:"2px 6px",
    cursor:"pointer",
    fontSize:"0.85rem",
  },
  viewBtn:{
    marginTop:"4px",
    backgroundColor:"#555",
    color:"#fff",
    border:"none",
    borderRadius:"4px",
    padding:"3px 6px",
    cursor:"pointer",
    fontSize:"0.85rem",
  },
};

//
// End of single-file example
//