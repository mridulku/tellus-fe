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

/** We recognize these quiz stages in the UI. */
const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

/**
 * parseNumericPrefix
 * ------------------
 * For sorting chapters/subchapters by leading numeric part (e.g. "1.2 Introduction").
 */
function parseNumericPrefix(title = "") {
  const match = title.trim().match(/^(\d+(\.\d+){0,2})/);
  if (match) {
    return parseFloat(match[1]); // e.g. "1.2" => 1.2
  }
  return Infinity;
}

/**
 * formatTimeSpent
 * ---------------
 * If < 1 minute => e.g. "45s"
 * else => e.g. "2.5 min"
 */
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
 * LibraryView
 * -----------
 * Columns displayed:
 *   - Subchapter
 *   - Reading (based on readingStats prop)
 *   - Total Concepts
 *   - remember / understand / analyze / apply
 *
 * For the quiz portion, we do aggregator calls to:
 *   /api/cumulativeQuizTime
 *   /api/cumulativeReviseTime
 *   and store it inside quizDataMap[subChId][stage].timeSpentMinutes
 *
 * For reading, we STILL rely on readingStats[subChId] from the parent.
 */
export default function LibraryView({
  db,
  userId,
  planId,
  bookId = "",
  readingStats = {}, // { subChId: { totalTimeSpentMinutes, completionDate } }
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [chapters, setChapters] = useState([]);

  /**
   * quizDataMap[subChId] = {
   *   maxConceptsSoFar: number,
   *   [stageName]: {
   *     quizAttempts,
   *     revisionAttempts,
   *     subchapterConcepts,
   *     allAttemptsConceptStats,
   *     timeSpentMinutes,  // aggregator quiz + revision time
   *   }
   * }
   */
  const [quizDataMap, setQuizDataMap] = useState({});

  // For local modal => to show <HistoryView>
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubChId, setModalSubChId] = useState("");
  const [modalStage, setModalStage] = useState("");

  // -------------------------------------------------------
  // On mount => fetch chapters + subchapters => fetch quiz data
  // -------------------------------------------------------
  useEffect(() => {
    if (!db || !bookId || !userId || !planId) return;

    setLoading(true);
    setError("");

    fetchChaptersWithSubchapters(bookId)
      .then((chapArr) => {
        setChapters(chapArr);

        // gather all subchapter IDs => fetch quiz data for each stage
        const allSubChIds = [];
        chapArr.forEach((c) => {
          c.subchapters.forEach((s) => allSubChIds.push(s.id));
        });

        // For each subchapter => for each stage => fetch data
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

  /**
   * fetchChaptersWithSubchapters
   * ----------------------------
   * 1) Load "chapters_demo" for this book
   * 2) For each => load "subchapters_demo"
   * 3) Sort them by numeric prefix
   */
  async function fetchChaptersWithSubchapters(bookId) {
    const chaptersArr = [];

    // 1) chapters
    const chapQ = query(
      collection(db, "chapters_demo"),
      where("bookId", "==", bookId)
    );
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
      const subQ = query(
        collection(db, "subchapters_demo"),
        where("chapterId", "==", chapObj.id)
      );
      const subSnap = await getDocs(subQ);
      const subs = [];
      for (const sDoc of subSnap.docs) {
        const sData = sDoc.data();
        subs.push({
          id: sDoc.id,
          name: sData.title || sData.name || `SubCh ${sDoc.id}`,
        });
      }
      // sort subchapters
      subs.sort((a, b) => parseNumericPrefix(a.name) - parseNumericPrefix(b.name));
      chapObj.subchapters = subs;
    }

    // 3) sort chapters
    chaptersArr.sort((a, b) => parseNumericPrefix(a.title) - parseNumericPrefix(b.title));
    return chaptersArr;
  }

  /**
   * fetchQuizData(subChId, quizStage)
   *  - calls aggregator endpoints:
   *     /api/cumulativeQuizTime
   *     /api/cumulativeReviseTime
   *  - also calls getQuiz => getRevisions => getSubchapterConcepts => build concept stats
   */
  async function fetchQuizData(subChId, quizStage) {
    try {
      // If we already have data => skip
      if (quizDataMap[subChId]?.[quizStage]) {
        return;
      }

      // 1) getQuiz
      const quizRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getQuiz`,{
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

      // 5) aggregator calls => quiz + revise
      const quizSeconds   = await fetchCumulativeQuizTime(subChId, quizStage);
      const reviseSeconds = await fetchCumulativeReviseTime(subChId, quizStage);
      const totalSeconds = quizSeconds + reviseSeconds;
      const totalMinutes = totalSeconds / 60.0;

      // store
      setQuizDataMap((prev) => {
        const copy = { ...prev };
        if (!copy[subChId]) {
          copy[subChId] = { maxConceptsSoFar: 0 };
        }

        copy[subChId][quizStage] = {
          quizAttempts: quizArr,
          revisionAttempts: revArr,
          subchapterConcepts: conceptArr,
          allAttemptsConceptStats,
          timeSpentMinutes: totalMinutes,
        };

        // update maxConceptsSoFar
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

  // aggregator endpoints
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
    if (!quizArr.length || !conceptArr.length) {
      return [];
    }
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
      return <p style={{ color: "#999" }}>No data for {modalStage} or still loading.</p>;
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

  // ---------------------------------------
  // RENDER
  // ---------------------------------------
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Library View (Chapters/Subchapters)</h2>

      {loading && <p>Loading library data + aggregator lumps...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {chapters.length === 0 && !loading && !error && (
        <p>No chapters found for bookId={bookId}.</p>
      )}

      {chapters.map((ch) => (
        <ChapterTable
          key={ch.id}
          chapter={ch}
          readingStats={readingStats}   // from parent
          quizDataMap={quizDataMap}    // we store aggregator results here
          onOpenModal={handleOpenModal}
        />
      ))}

      {/* Local Modal => show <HistoryView> if needed */}
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
 * ChapterTable
 * -----------
 * Renders one chapter => table with subchapters & columns:
 *   Subchapter | Reading | Total Concepts | Remember | Understand | Analyze | Apply
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
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Total Concepts</th>
                <th style={styles.th}>Remember</th>
                <th style={styles.th}>Understand</th>
                <th style={styles.th}>Analyze</th>
                <th style={styles.th}>Apply</th>
              </tr>
            </thead>
            <tbody>
              {chapter.subchapters.map((sub) => (
                <tr key={sub.id}>
                  <td style={styles.tdName}>{sub.name}</td>
                  {/* Reading => date + time */}
                  <td style={styles.tdCell}>
                    {renderReadingCell(readingStats[sub.id])}
                  </td>
                  {/* total concepts => from quizDataMap[subId].maxConceptsSoFar */}
                  <td style={styles.tdCell}>
                    {renderTotalConcepts(sub.id)}
                  </td>

                  {/* 4 stages */}
                  <td>{renderStageCell(sub.id, "remember")}</td>
                  <td>{renderStageCell(sub.id, "understand")}</td>
                  <td>{renderStageCell(sub.id, "analyze")}</td>
                  <td>{renderStageCell(sub.id, "apply")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // ---------------------------------------
  // Render reading => from parent's readingStats
  // ---------------------------------------
  function renderReadingCell(readObj) {
    if (!readObj) {
      return <span style={{ color: "#999" }}>Not read</span>;
    }
    const { totalTimeSpentMinutes, completionDate } = readObj;

    // date
    let dateStr = "—";
    if (completionDate instanceof Date) {
      dateStr = completionDate.toLocaleDateString();
    }
    // time
    const timeStr = formatTimeSpent(totalTimeSpentMinutes || 0);

    return (
      <div>
        <div><strong>{dateStr}</strong></div>
        <div style={{ fontSize: "0.8rem", color: "#666" }}>{timeStr}</div>
      </div>
    );
  }

  // ---------------------------------------
  // Show # concepts from subMap.maxConceptsSoFar
  // ---------------------------------------
  function renderTotalConcepts(subChId) {
    const subMap = quizDataMap[subChId];
    if (!subMap) {
      return 0;
    }
    return subMap.maxConceptsSoFar || 0;
  }

  // ---------------------------------------
  // Stage cell => mastery% + timeSpent + "View" button
  // ---------------------------------------
  function renderStageCell(subChId, stage) {
    const subMap = quizDataMap[subChId];
    if (!subMap || !subMap[stage]) {
      return <div style={styles.stageCellBase}>—</div>;
    }
    const data = subMap[stage];

    // compute mastery
    const totalConcepts = subMap.maxConceptsSoFar || 0;
    const passCount = computePassCount(data.allAttemptsConceptStats);
    const masteryPct = (totalConcepts === 0) ? 0 : (passCount / totalConcepts) * 100;

    // timeSpent
    const timeStr = formatTimeSpent(data.timeSpentMinutes || 0);

    // color code by masteryPct
    let bgColor = "#ffcccc"; // pale red => 0%
    if (masteryPct === 100) {
      bgColor = "#ccffcc"; // green
    } else if (masteryPct > 0) {
      bgColor = "#fff8b3"; // partial => yellow
    }

    return (
      <div style={{ ...styles.stageCellBase, backgroundColor: bgColor }}>
        <div style={{ fontWeight: "bold" }}>
          {masteryPct.toFixed(0)}%
        </div>
        <div style={{ fontSize: "0.8rem" }}>
          {timeStr}
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
}

// ---------------------------------------------------------
// Basic Styles
// ---------------------------------------------------------
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
    minWidth: "800px",
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
    width: "16%",
  },
  tdCell: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
    color: "#666",
    width: "12%",
  },
  stageCellBase: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
    width: "12%",
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