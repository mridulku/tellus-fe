import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import HistoryView from "../../../../5.StudyModal/0.components/Main/Base/HistoryView";

/** The quiz stages, in the forced order: remember → understand → apply → analyze */
const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

/** For numeric sorting in chapter/subchapter titles, e.g. "1.2 Some Title" */
function parseNumericPrefix(title = "") {
  const match = title.trim().match(/^(\d+(\.\d+){0,2})/);
  if (match) {
    return parseFloat(match[1]); 
  }
  return Infinity;
}

/** Format time: if <1 minute => Xs, else X.Y min */
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

/**
 * LibraryView2
 * ------------
 * - Subchapter
 * - Total Concepts
 * - Reading (with lock logic = always “unlocked,” but color-coded for done/in-progress/not-started)
 * - Remember
 * - Understand
 * - Apply
 * - Analyze
 *
 * We enforce the chain: Reading → Remember → Understand → Apply → Analyze
 */
export default function LibraryView2({
  db,
  userId,
  planId,
  bookId = "",
  readingStats = {}, // ex: { subChId: { totalTimeSpentMinutes, completionDate: Date } }
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [chapters, setChapters] = useState([]);

  /**
   * quizDataMap[subChId] = {
   *   maxConceptsSoFar: number,
   *   remember: { ...dataForThatStage },
   *   understand: { ... },
   *   apply: { ... },
   *   analyze: { ... }
   * }
   *
   * dataForThatStage => {
   *   quizAttempts, revisionAttempts, subchapterConcepts, allAttemptsConceptStats,
   *   timeSpentMinutes: number
   * }
   */
  const [quizDataMap, setQuizDataMap] = useState({});

  // For local <HistoryView> modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubChId, setModalSubChId] = useState("");
  const [modalStage, setModalStage] = useState("");

  // ----------------------------------------------
  // On mount => fetch chapters => subchapters => quiz data
  // ----------------------------------------------
  useEffect(() => {
    if (!db || !bookId || !userId || !planId) return;

    setLoading(true);
    setError("");

    fetchChaptersWithSubchapters(bookId)
      .then((chapArr) => {
        setChapters(chapArr);

        // gather all subchapter IDs
        const allSubChIds = [];
        chapArr.forEach((c) => {
          c.subchapters.forEach((s) => allSubChIds.push(s.id));
        });

        // For each subCh => fetch for each QUIZ_STAGE
        const tasks = [];
        for (let scId of allSubChIds) {
          for (let stage of QUIZ_STAGES) {
            tasks.push(fetchQuizData(scId, stage));
          }
        }
        return Promise.all(tasks);
      })
      .catch((err) => {
        console.error("LibraryView => fetchChapters error:", err);
        setError(err.message || "Failed to fetch chapters/subchapters.");
      })
      .finally(() => {
        setLoading(false);
      });
  // eslint-disable-next-line
  }, [db, bookId, userId, planId]);

  // ----------------------------------------------
  // fetchChaptersWithSubchapters
  // ----------------------------------------------
  async function fetchChaptersWithSubchapters(bookId) {
    const chaptersArr = [];

    // 1) chapters
    const chapQ = query(collection(db, "chapters_demo"), where("bookId", "==", bookId));
    const chapSnap = await getDocs(chapQ);
    for (const cDoc of chapSnap.docs) {
      const cData = cDoc.data();
      chaptersArr.push({
        id: cDoc.id,
        title: cData.title || cData.name || `Chapter ${cDoc.id}`,
        subchapters: [],
      });
    }

    // 2) subchapters
    for (let chapObj of chaptersArr) {
      const subQ = query(collection(db, "subchapters_demo"), where("chapterId", "==", chapObj.id));
      const subSnap = await getDocs(subQ);
      const subs = [];
      for (const sDoc of subSnap.docs) {
        const sData = sDoc.data();
        subs.push({
          id: sDoc.id,
          name: sData.title || sData.name || `SubCh ${sDoc.id}`,
        });
      }
      subs.sort((a, b) => parseNumericPrefix(a.name) - parseNumericPrefix(b.name));
      chapObj.subchapters = subs;
    }

    // 3) sort chapters
    chaptersArr.sort((a, b) => parseNumericPrefix(a.title) - parseNumericPrefix(b.title));
    return chaptersArr;
  }

  // ----------------------------------------------
  // fetchQuizData(subChId, stage)
  // => calls aggregator + build concept stats
  // ----------------------------------------------
  async function fetchQuizData(subChId, quizStage) {
    try {
      if (quizDataMap[subChId]?.[quizStage]) {
        // already loaded
        return;
      }

      // 1) getQuiz attempts
      const quizRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getQuiz`, {
        params: {
          userId,
          planId,
          subchapterId: subChId,
          quizType: quizStage,
        },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // 2) getRevisions
      const revRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getRevisions`, {
        params: {
          userId,
          planId,
          subchapterId: subChId,
          revisionType: quizStage,
        },
      });
      const revArr = revRes?.data?.revisions || [];

      // 3) subchapterConcepts
      const conceptRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getSubchapterConcepts`, {
        params: { subchapterId: subChId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      // 4) build concept stats
      const allAttemptsConceptStats = buildAllAttemptsConceptStats(quizArr, conceptArr);

      // 5) aggregator endpoints => quiz + revise => total
      const quizSeconds   = await fetchCumulativeQuizTime(subChId, quizStage);
      const reviseSeconds = await fetchCumulativeReviseTime(subChId, quizStage);
      const totalMinutes = (quizSeconds + reviseSeconds) / 60.0;

      // store
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
      console.error("LibraryView => fetchQuizData error:", err);
    }
  }

  // aggregator
  async function fetchCumulativeQuizTime(subChId, quizStage) {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/cumulativeQuizTime?userId=${userId}&planId=${planId}&subChapterId=${subChId}&quizStage=${quizStage}`;
      const res = await axios.get(url);
      return res.data.totalSeconds || 0;
    } catch (err) {
      console.error("fetchCumulativeQuizTime error =>", err);
      return 0;
    }
  }
  async function fetchCumulativeReviseTime(subChId, quizStage) {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/cumulativeReviseTime?userId=${userId}&planId=${planId}&subChapterId=${subChId}&quizStage=${quizStage}`;
      const res = await axios.get(url);
      return res.data.totalSeconds || 0;
    } catch (err) {
      console.error("fetchCumulativeReviseTime error =>", err);
      return 0;
    }
  }

  // concept stats
  function buildAllAttemptsConceptStats(quizArr, conceptArr) {
    if (!quizArr.length || !conceptArr.length) return [];
    return quizArr.map((attempt) => {
      const stats = buildConceptStats(attempt.quizSubmission || [], conceptArr);
      return {
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        conceptStats: stats,
      };
    });
  }
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
    // unify with conceptArr
    const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
    if (countMap["UnknownConcept"]) {
      conceptNamesSet.add("UnknownConcept");
    }

    const statsArray = [];
    conceptNamesSet.forEach((cName) => {
      const rec = countMap[cName] || { correct: 0, total: 0 };
      const ratio = rec.total > 0 ? (rec.correct / rec.total) : 0;
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

  // local modal
  const [modalContent, setModalContent] = useState(null);
  function handleOpenModal(subChId, stage) {
    setModalSubChId(subChId);
    setModalStage(stage);
    setModalOpen(true);
  }
  function handleCloseModal() {
    setModalOpen(false);
    setModalSubChId("");
    setModalStage("");
  }
  function getModalData() {
    if (!modalSubChId || !modalStage) return null;
    return quizDataMap[modalSubChId]?.[modalStage] || null;
  }
  function renderModalContent() {
    const data = getModalData();
    if (!data) {
      return <p style={{ color: "#999" }}>No data or still loading.</p>;
    }
    return (
      <HistoryView
        quizStage={modalStage}
        totalStages={QUIZ_STAGES}
        quizAttempts={data.quizAttempts || []}
        revisionAttempts={data.revisionAttempts || []}
        subchapterConcepts={data.subchapterConcepts || []}
        allAttemptsConceptStats={data.allAttemptsConceptStats || []}
      />
    );
  }

  // ----------------------------------------------
  // RENDER
  // ----------------------------------------------
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Library View 2 - Stage Logic</h2>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {chapters.length === 0 && !loading && !error && (
        <p>No chapters found for bookId={bookId}.</p>
      )}

      {chapters.map((ch) => (
        <ChapterTable
          key={ch.id}
          chapter={ch}
          readingStats={readingStats}
          quizDataMap={quizDataMap}
          onOpenModal={handleOpenModal}
        />
      ))}

      {/* Local modal => history */}
      {modalOpen && (
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          fullWidth
          maxWidth="lg"
          PaperProps={{ style: { backgroundColor: "#222", color: "#fff" } }}
        >
          <DialogTitle>
            {modalStage.toUpperCase()} – Subchapter: {modalSubChId}
          </DialogTitle>
          <DialogContent dividers>
            {renderModalContent()}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} variant="contained" color="secondary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

/** 
 * ChapterTable => columns:
 *   Subchapter | Total Concepts | Reading | Remember | Understand | Apply | Analyze
 *
 * Lock logic: 
 *   1) Reading is never locked, but color-coded by done/in-progress/not-started
 *   2) remember locked unless Reading "done"
 *   3) understand locked unless remember "done"
 *   4) apply locked unless understand "done"
 *   5) analyze locked unless apply "done"
 */
function ChapterTable({ chapter, readingStats, quizDataMap, onOpenModal }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={styles.chapterBox}>
      <div style={styles.chapterHeader} onClick={() => setExpanded(!expanded)}>
        <h3 style={{ margin: 0 }}>
          {expanded ? "▾" : "▸"} {chapter.title}
        </h3>
      </div>
      {expanded && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Subchapter</th>
                <th style={styles.th}>Total Concepts</th>
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Remember</th>
                <th style={styles.th}>Understand</th>
                <th style={styles.th}>Apply</th>
                <th style={styles.th}>Analyze</th>
              </tr>
            </thead>
            <tbody>
              {chapter.subchapters.map((sub) => {
                const subChId = sub.id;
                // 1) reading status
                const rStatus = getReadingStatus(readingStats[subChId]);

                // 2) quiz stage statuses
                const rememberData = quizDataMap[subChId]?.remember;
                const rememberStatus = getQuizStageStatus(rememberData);
                const understandData = quizDataMap[subChId]?.understand;
                const understandStatus = getQuizStageStatus(understandData);
                const applyData = quizDataMap[subChId]?.apply;
                const applyStatus = getQuizStageStatus(applyData);
                const analyzeData = quizDataMap[subChId]?.analyze;
                const analyzeStatus = getQuizStageStatus(analyzeData);

                // total concepts from subMap
                const subMap = quizDataMap[subChId];
                const totalConcepts = subMap?.maxConceptsSoFar || 0;

                // lock logic
                // reading => never locked
                // remember => locked unless reading done
                const rememberLocked = (rStatus.overall !== "done");
                // understand => locked unless remember done
                const understandLocked = (rememberStatus.overall !== "done");
                // apply => locked unless understand done
                const applyLocked = (understandStatus.overall !== "done");
                // analyze => locked unless apply done
                const analyzeLocked = (applyStatus.overall !== "done");

                return (
                  <tr key={subChId}>
                    <td style={styles.tdName}>{sub.name}</td>
                    <td style={styles.tdCell}>
                      {totalConcepts}
                    </td>

                    {/* Reading */}
                    <td style={{ ...styles.tdCell, ...rStatus.style }}>
                      {renderReadingCell(rStatus)}
                    </td>

                    {/* Remember */}
                    <td style={renderStageCellStyle(rememberLocked, rememberStatus)}>
                      {renderQuizStageCell(subChId, "remember", rememberLocked, rememberStatus)}
                    </td>

                    {/* Understand */}
                    <td style={renderStageCellStyle(understandLocked, understandStatus)}>
                      {renderQuizStageCell(subChId, "understand", understandLocked, understandStatus)}
                    </td>

                    {/* Apply */}
                    <td style={renderStageCellStyle(applyLocked, applyStatus)}>
                      {renderQuizStageCell(subChId, "apply", applyLocked, applyStatus)}
                    </td>

                    {/* Analyze */}
                    <td style={renderStageCellStyle(analyzeLocked, analyzeStatus)}>
                      {renderQuizStageCell(subChId, "analyze", analyzeLocked, analyzeStatus)}
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

  // ---------------------------
  // Reading => done/in-progress/not-started
  // ---------------------------
  function getReadingStatus(readObj) {
    // If no readObj => not started
    if (!readObj) {
      return {
        overall: "not-started",
        style: { backgroundColor: "#ffcccc" }, // pale red
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
        style: { backgroundColor: "#ccffcc" }, // green
        completionDateStr: dateStr,
        timeSpentStr: timeStr,
      };
    } else if ((totalTimeSpentMinutes || 0) > 0) {
      // in progress
      return {
        overall: "in-progress",
        style: { backgroundColor: "#fff8b3" }, // yellow
        completionDateStr: dateStr,
        timeSpentStr: timeStr,
      };
    }
    // else => not started
    return {
      overall: "not-started",
      style: { backgroundColor: "#ffcccc" },
      completionDateStr: "",
      timeSpentStr: "0 min",
    };
  }

  function renderReadingCell(rStatus) {
    if (rStatus.overall === "not-started") {
      return (
        <div>
          <div style={{ fontWeight: "bold" }}>Not Started</div>
          <div style={{ fontSize: "0.8rem" }}>{rStatus.timeSpentStr}</div>
        </div>
      );
    } else if (rStatus.overall === "in-progress") {
      return (
        <div>
          <div style={{ fontWeight: "bold" }}>In Progress</div>
          <div style={{ fontSize: "0.8rem" }}>{rStatus.timeSpentStr}</div>
        </div>
      );
    } else {
      // done
      return (
        <div>
          <div style={{ fontWeight: "bold" }}>Done</div>
          <div style={{ fontSize: "0.8rem" }}>{rStatus.timeSpentStr}</div>
        </div>
      );
    }
  }

  // ---------------------------
  // Quiz stage => done/in-progress/not-started
  // => mastery% color
  // => done if 100% mastery
  // => in-progress if >0% but <100%
  // => not-started if 0% + 0 timeSpent
  // ---------------------------
  function getQuizStageStatus(stageData) {
    if (!stageData) {
      return {
        overall: "not-started",
        masteryPct: 0,
        timeStr: "0 min",
      };
    }
    const totalConcepts = stageData.subchapterConcepts?.length || 0;
    const passCount = computePassCount(stageData.allAttemptsConceptStats);
    const masteryPct = totalConcepts === 0 ? 0 : (passCount / totalConcepts) * 100;
    const timeStr = formatTimeSpent(stageData.timeSpentMinutes || 0);

    if (masteryPct >= 100) {
      return {
        overall: "done",
        masteryPct,
        timeStr,
      };
    } else if (masteryPct > 0 || (stageData.timeSpentMinutes || 0) > 0) {
      return {
        overall: "in-progress",
        masteryPct,
        timeStr,
      };
    }
    return {
      overall: "not-started",
      masteryPct,
      timeStr,
    };
  }

  // unique PASS concepts across all attempts
  function computePassCount(allAttemptsConceptStats) {
    if (!allAttemptsConceptStats?.length) {
      return 0;
    }
    const passedSet = new Set();
    for (let attempt of allAttemptsConceptStats) {
      for (let cs of (attempt.conceptStats || [])) {
        if (cs.passOrFail === "PASS") {
          passedSet.add(cs.conceptName);
        }
      }
    }
    return passedSet.size;
  }

  // lock => just show a lock icon
  // else color-coded cell based on overall
  function renderStageCellStyle(isLocked, stageStatus) {
    if (isLocked) {
      return {
        ...styles.tdCell,
        backgroundColor: "#ddd",
      };
    }
    // color code by overall
    if (stageStatus.overall === "done") {
      return {
        ...styles.tdCell,
        backgroundColor: "#ccffcc", // green
      };
    } else if (stageStatus.overall === "in-progress") {
      return {
        ...styles.tdCell,
        backgroundColor: "#fff8b3", // yellow
      };
    }
    // not-started => pale red
    return {
      ...styles.tdCell,
      backgroundColor: "#ffcccc",
    };
  }

  function renderQuizStageCell(subChId, stage, locked, stageStatus) {
    if (locked) {
      return (
        <span style={{ fontWeight: "bold", opacity: 0.6 }}>
          🔒 Locked
        </span>
      );
    }
    // else => show mastery + time + "View"
    return (
      <div>
        <div style={{ fontWeight: "bold" }}>
          {stageStatus.masteryPct.toFixed(0)}%
        </div>
        <div style={{ fontSize: "0.8rem" }}>
          {stageStatus.timeStr}
        </div>
        <button
          style={styles.viewBtn}
          onClick={() => onOpenModal(subChId, stage)}
        >
          View
        </button>
      </div>
    );
  }
}

// ===================== STYLES =====================
const styles = {
  container: {
    backgroundColor: "#fafafa",
    padding: "8px",
    borderRadius: "4px",
  },
  heading: {
    marginTop: 0,
    marginBottom: "1rem",
    color: "#333",
  },
  chapterBox: {
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginBottom: "8px",
    backgroundColor: "#fff",
  },
  chapterHeader: {
    cursor: "pointer",
    padding: "0.5rem 1rem",
    backgroundColor: "#eee",
    borderRadius: "4px 4px 0 0",
    display: "flex",
    alignItems: "center",
  },
  tableWrapper: {
    overflowX: "auto",
    padding: "0.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  th: {
    border: "1px solid #ccc",
    backgroundColor: "#ddd",
    padding: "8px",
    textAlign: "left",
  },
  tdName: {
    border: "1px solid #ccc",
    padding: "8px",
    fontWeight: "bold",
    width: "20%",
  },
  tdCell: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
    color: "#666",
    width: "13%",
  },
  viewBtn: {
    marginTop: "4px",
    backgroundColor: "#555",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "3px 6px",
    cursor: "pointer",
  },
};