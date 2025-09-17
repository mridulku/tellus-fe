import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // Adjust as needed
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

import { generateRevisionContent } from "./RevSupport/RevisionContentGenerator";
import { fetchReviseTime, incrementReviseTime } from "../../../../../../store/reviseTimeSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";
import { refreshSubchapter } from "../../../../../../store/aggregatorSlice";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

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

function buildRevisionConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `revise${capExam}${capStage}`;
}

function createHtmlFromGPTData(revisionData) {
  if (!revisionData) return "";
  let html = "";
  if (revisionData.title) {
    html += `<h3>${revisionData.title}</h3>`;
  }
  if (Array.isArray(revisionData.concepts)) {
    revisionData.concepts.forEach((cObj) => {
      html += `<h4>${cObj.conceptName}</h4>`;
       html += `<p>${cObj.explanation}</p>`;
      /* accept a few likely spellings so dev-cycle is smoother */
     const ex = cObj.example
            || cObj.examples
            || cObj.workedExample
            || null;
     if (ex) {
       html += `<blockquote><strong>Example:</strong> ${ex.prompt || ex.question || ""}<br/>
                <em>Solution:</em> ${ex.solution || ex.answer || ""}</blockquote>`;
     }
    });
  }
  return html;
}

/** Exactly like in HistoryView */
function computeConceptStatuses(allAtts) {
  const conceptStatusMap = new Map();
  const conceptSet = new Set();

  const sorted = [...allAtts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  sorted.forEach((attempt) => {
    (attempt.conceptStats || []).forEach((cs) => {
      conceptSet.add(cs.conceptName);
      if (!conceptStatusMap.has(cs.conceptName)) {
        conceptStatusMap.set(cs.conceptName, "NOT_TESTED");
      }
      if (cs.passOrFail === "PASS") {
        conceptStatusMap.set(cs.conceptName, "PASS");
      } else if (cs.passOrFail === "FAIL") {
        // only mark FAIL if it's not already PASS
        if (conceptStatusMap.get(cs.conceptName) !== "PASS") {
          conceptStatusMap.set(cs.conceptName, "FAIL");
        }
      }
    });
  });

  return { conceptSet, conceptStatusMap };
}

/**
 * ReviseView
 * ----------
 * 1) Loads aggregator data => "allAttemptsConceptStats"
 * 2) Shows a small progress bar for mastery
 * 3) On expand, user sees concept-level statuses in color-coded list
 * 4) Also does GPT chunked reading, lumps-of-15 time, etc.
 */
export default function ReviseView({
  userId,
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  revisionNumber = 1,
  onRevisionDone,
  activity,
}) {
  const { activityId } = activity || {};
  const planId = useSelector((state) => state.plan?.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan?.currentIndex);
  const dispatch = useDispatch();

  const docIdRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // GPT pages
  const [revisionHtml, setRevisionHtml] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // lumps-of-15
  const [serverTime, setServerTime] = useState(0);
  const [localLeftover, setLocalLeftover] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  // aggregator states
  const [loadingConceptData, setLoadingConceptData] = useState(true);
  const [masteredCount, setMasteredCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [notTestedCount, setNotTestedCount] = useState(0);
  const [conceptStatuses, setConceptStatuses] = useState([]);

  useEffect(() => {
    if (!userId || !subChapterId) {
      console.log("ReviseView: missing userId/subChapterId => skip aggregator.");
      return;
    }

    const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";
    const dateStr = new Date().toISOString().substring(0, 10);
    const docId = `${userId}_${planId}_${subChapterId}_${quizStage}_rev${revisionNumber}_${dateStr}`;
    docIdRef.current = docId;

    // reset states
    setLoading(true);
    setStatus("Loading revision config...");
    setError("");
    setRevisionHtml("");
    setPages([]);
    setCurrentPageIndex(0);

    setServerTime(0);
    setLocalLeftover(0);
    setLastSnapMs(null);

    setLoadingConceptData(true);
    setMasteredCount(0);
    setInProgressCount(0);
    setNotTestedCount(0);
    setConceptStatuses([]);

    async function doFetchUsage() {
      try {
        const actionRes = await dispatch(fetchReviseTime({ docId }));
        if (fetchReviseTime.fulfilled.match(actionRes)) {
          const existingSec = actionRes.payload || 0;
          setServerTime(existingSec);
          setLocalLeftover(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("fetchReviseTime error:", err);
      }
    }

    async function doGenerateGPT() {
      try {
        const docIdForConfig = buildRevisionConfigDocId(examId, quizStage);
        const revRef = doc(db, "revisionConfigs", docIdForConfig);
        const snap = await getDoc(revRef);
        if (!snap.exists()) {
          setStatus(`No revisionConfig doc found for '${docIdForConfig}'.`);
          setLoading(false);
          return;
        }
        const configData = snap.data();

        setStatus("Generating revision content via GPT...");
        const result = await generateRevisionContent({
          db,
          subChapterId,
          openAiKey,
          revisionConfig: configData,
          userId,
          quizStage,
        });

        if (!result.success) {
          setStatus("Failed to generate revision content.");
          setError(result.error || "Unknown GPT error.");
          setLoading(false);
          return;
        }
        // convert GPT => chunk
        const fullHtml = createHtmlFromGPTData(result.revisionData);
        setRevisionHtml(fullHtml);
        setStatus("Revision content generated.");
      } catch (err) {
        console.error("ReviseView => GPT error:", err);
        setError(err.message || "Error generating GPT content");
      } finally {
        setLoading(false);
      }
    }

    async function fetchAggregatorData() {
      try {
        if (!planId || !subChapterId) return;
        setLoadingConceptData(true);
        const resp = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`, {
          params: { userId, planId, subchapterId: subChapterId },
        });
        if (resp.data) {
          const data = resp.data;
          const stageObj = data.quizStagesData?.[quizStage] || {};
          const allStats = stageObj.allAttemptsConceptStats || [];

          const { conceptSet, conceptStatusMap } = computeConceptStatuses(allStats);
          const totalConcepts = conceptSet.size;
          const passCount = [...conceptStatusMap.values()].filter((v) => v === "PASS").length;
          const failCount = [...conceptStatusMap.values()].filter((v) => v === "FAIL").length;
          const notTested = totalConcepts - passCount - failCount;

          setMasteredCount(passCount);
          setInProgressCount(failCount);
          setNotTestedCount(notTested);

          const statusesArr = [];
          conceptSet.forEach((cName) => {
            const finalStat = conceptStatusMap.get(cName) || "NOT_TESTED";
            statusesArr.push({ conceptName: cName, status: finalStat });
          });
          statusesArr.sort((a, b) => a.conceptName.localeCompare(b.conceptName));
          setConceptStatuses(statusesArr);
        }
      } catch (err) {
        console.error("Error fetching aggregator subchapter data:", err);
      } finally {
        setLoadingConceptData(false);
      }
    }

    doFetchUsage();
    doGenerateGPT();
    fetchAggregatorData();
  }, [
    userId,
    subChapterId,
    examId,
    quizStage,
    revisionNumber,
    planId,
    dispatch,
  ]);

  // chunk revisionHtml
  useEffect(() => {
    if (!revisionHtml) return;
    const chunked = chunkHtmlByParagraphs(revisionHtml, 180);
    setPages(chunked);
    setCurrentPageIndex(0);
  }, [revisionHtml]);

  // local leftover timer
  useEffect(() => {
    const secondTimer = setInterval(() => {
      setLocalLeftover((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(secondTimer);
  }, []);

  // lumps-of-15
  useEffect(() => {
    if (!lastSnapMs) return;
    const heartbeatId = setInterval(async () => {
      if (localLeftover >= 15) {
        const lumps = Math.floor(localLeftover / 15);
        if (lumps > 0) {
          const totalToPost = lumps * 15;
          const incrRes = await dispatch(
            incrementReviseTime({
              docId: docIdRef.current,
              increment: totalToPost,
              activityId,
              userId,
              planId,
              subChapterId,
              quizStage,
              dateStr: new Date().toISOString().substring(0, 10),
              revisionNumber,
            })
          );
          if (incrementReviseTime.fulfilled.match(incrRes)) {
            const newTotal = incrRes.payload || serverTime + totalToPost;
            setServerTime(newTotal);
          }
          const remainder = localLeftover % 15;
          setLocalLeftover(remainder);
          setLastSnapMs(Date.now() - remainder * 1000);
        }
      }
    }, 1000);
    return () => clearInterval(heartbeatId);
  }, [
    lastSnapMs,
    localLeftover,
    dispatch,
    userId,
    planId,
    subChapterId,
    quizStage,
    revisionNumber,
    serverTime,
    activityId,
  ]);

  const displayedTime = serverTime + localLeftover;

  function handleNextPage() {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }
  function handlePrevPage() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }

  async function submitRevisionAttempt() {
    const payload = {
      userId,
      activityId,
      subchapterId: subChapterId,
      revisionType: quizStage,
      revisionNumber,
      planId,
    };
    
await axios.post(
  `${import.meta.env.VITE_BACKEND_URL}/api/submitRevision`,payload);
    console.log("Revision attempt recorded on server!");
    dispatch(refreshSubchapter(subChapterId));
  }

  async function handleTakeQuizNow() {
    try {
      await submitRevisionAttempt();
      onRevisionDone?.();
    } catch (err) {
      console.error("Error submitting revision attempt (Take Quiz Now):", err);
      alert("Failed to record revision attempt.");
    }
  }
  async function handleTakeQuizLater() {
    try {
      const oldIndex = currentIndex;
      if (activityId) {
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, {
          userId,
          planId,
          activityId,
          completed: false,
        });
        console.log(`Activity '${activityId}' marked deferred!`);
      }
      const backendURL = import.meta.env.VITE_BACKEND_URL;
      const fetchUrl = "/api/adaptive-plan";
      const fetchAction = await dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
      await submitRevisionAttempt();
    } catch (err) {
      console.error("Error in handleTakeQuizLater:", err);
      alert("Failed to record revision attempt and/or mark deferred.");
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  if (!pages.length && !loading) {
    return (
      <div style={styles.outerContainer}>
        <p>No revision content to display.</p>
      </div>
    );
  }

  const currentPageHtml = pages[currentPageIndex] || "";

  /* ================== RENDER ================== */
  return (
    <div style={styles.outerContainer}>
      <div style={styles.card}>

        {/* 
          Collapsible mastery summary panel in top-right 
          – pass everything into a subcomponent for clarity
        */}
        <MasterySummaryPanel
          loadingConceptData={loadingConceptData}
          masteredCount={masteredCount}
          inProgressCount={inProgressCount}
          notTestedCount={notTestedCount}
          conceptStatuses={conceptStatuses}
        />

        {/* Header => "Revision" + clock */}
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0 }}>Revision</h2>
          <div style={styles.clockWrapper}>
            <span style={styles.clockIcon}>🕒</span>
            {formatTime(displayedTime)}
          </div>
        </div>

        {/* Body => chunked HTML */}
        <div style={styles.cardBody}>
          {loading && <p>Loading... {status}</p>}
          {!loading && error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && status && !error && (
            <p style={{ color: "lightgreen" }}>{status}</p>
          )}

          <div
            style={styles.pageContent}
            dangerouslySetInnerHTML={{ __html: currentPageHtml }}
          />
        </div>

        {/* Footer => Prev, Next, or 2 "Finish" buttons on last page */}
        <div style={styles.cardFooter}>
          <div style={styles.navButtons}>
            {currentPageIndex > 0 && (
              <button style={styles.button} onClick={handlePrevPage}>
                Previous
              </button>
            )}
            {currentPageIndex < pages.length - 1 && (
              <button style={styles.button} onClick={handleNextPage}>
                Next
              </button>
            )}
            {currentPageIndex === pages.length - 1 && (
              <>
                <button style={styles.button} onClick={handleTakeQuizNow}>
                  Take Quiz Now
                </button>
                <button style={styles.button} onClick={handleTakeQuizLater}>
                  Take Quiz Later
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========== Collapsible Mastery Panel ========== */
function MasterySummaryPanel({
  loadingConceptData,
  masteredCount,
  inProgressCount,
  notTestedCount,
  conceptStatuses,
}) {
  const [expanded, setExpanded] = useState(false);

  // total concepts
  const totalConcepts = masteredCount + inProgressCount + notTestedCount;
  const progressPct = totalConcepts > 0
    ? Math.round((masteredCount / totalConcepts) * 100)
    : 0;

  function toggleExpand() {
    setExpanded((prev) => !prev);
  }

  return (
    <div style={styles.masteryPanel}>
      {/* If aggregator is loading, show 'Loading...' */}
      {loadingConceptData ? (
        <p style={{ fontSize: "0.9rem", margin: 0 }}>Loading concept data...</p>
      ) : (
        <>
          {/* Collapsed view => a progress bar + "X / Y mastered" + toggle arrow */}
          {!expanded && (
            <div style={{ fontSize: "0.9rem" }}>
              <div style={{ marginBottom: 6 }}>
                <strong>{masteredCount}</strong> / {totalConcepts} mastered
                &nbsp;({progressPct}%)
              </div>
              <ProgressBar pct={progressPct} />
            </div>
          )}

          {/* If expanded => show the bullet list */}
          {expanded && (
            <>
              <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
                <strong>Mastered:</strong> {masteredCount} &nbsp;|&nbsp;
                <strong>In Progress:</strong> {inProgressCount} &nbsp;|&nbsp;
                <strong>Not Tested:</strong> {notTestedCount}
              </div>
              <ul style={styles.conceptList}>
                {conceptStatuses.map((obj) => {
                  const { conceptName, status } = obj;
                  let color = "#bbb";
                  if (status === "PASS") color = "#4caf50"; // green
                  else if (status === "FAIL") color = "#f44336"; // red
                  return (
                    <li key={conceptName} style={{ marginBottom: 4 }}>
                      <span style={{ color }}>{conceptName}</span>{" "}
                      <span style={{ color: "#999", fontSize: "0.8rem" }}>
                        ({status})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {/* Expand/collapse button */}
          <div style={{ textAlign: "right", marginTop: 6 }}>
            <button onClick={toggleExpand} style={styles.expandBtn}>
              {expanded ? "▲" : "▼"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ========== Simple horizontal progress bar ========== */
function ProgressBar({ pct }) {
  const containerStyle = {
    width: "100%",
    height: "8px",
    backgroundColor: "#444",
    borderRadius: "4px",
    overflow: "hidden",
  };
  const fillStyle = {
    width: `${pct}%`,
    height: "100%",
    backgroundColor: "#66bb6a",
  };
  return (
    <div style={containerStyle}>
      <div style={fillStyle} />
    </div>
  );
}

/* ========== Styles ========== */
const styles = {
  outerContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
  card: {
    position: "relative",
    width: "80%",
    maxWidth: "700px",
    backgroundColor: "#111",
    borderRadius: "8px",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  /* masteryPanel => top-right corner */
  masteryPanel: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: 4,
    padding: "8px 12px",
    fontSize: "0.9rem",
    maxWidth: "220px",
    minHeight: "44px",
  },
  expandBtn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "2px 6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    lineHeight: 1,
  },

  cardHeader: {
    background: "#222",
    padding: "12px 16px",
    borderBottom: "1px solid #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clockWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#333",
    color: "#ddd",
    padding: "4px 8px",
    borderRadius: 4,
  },
  clockIcon: {
    fontSize: "1rem",
  },
  cardBody: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
  },
  pageContent: {
    fontSize: "1.1rem",
    lineHeight: 1.6,
  },
  cardFooter: {
    borderTop: "1px solid #333",
    padding: "12px 16px",
  },
  navButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
  button: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 4,
    cursor: "pointer",
  },

  conceptList: {
    margin: 0,
    paddingLeft: 16,
    maxHeight: "120px",
    overflowY: "auto",
  },
};