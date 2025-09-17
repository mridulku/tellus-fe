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
 * LibraryView3
 * ------------
 * Extends LibraryView2 with new logic:
 *    1) Still shows subchapters in a table with Reading/Remember/Understand/Apply/Analyze columns.
 *    2) Creates a "Tasks" concept:
 *       - For each stage, figure out the next immediate task if not 100% done (READ, QUIZ1, REVISION1, QUIZ2, REVISION2, ...).
 *       - We figure out which one is "active" based on chain logic (reading done => unlock remember => done => unlock understand => etc.).
 *    3) Adds an info button in the subchapter cell that opens a modal listing all 5 stages plus:
 *       - Next task label for each stage
 *       - Whether it’s currently "active"
 *       - Whether no more tasks are needed (stage is 100% done)
 *
 * This version does NOT limit you to 4 attempts. It can handle an unbounded
 * quiz→revision→quiz→revision chain, stopping only once the user hits 100% mastery.
 */
export default function LibraryView3({
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
   *   remember: {
   *     quizAttempts:        array of quiz attempts,
   *     revisionAttempts:    array of revision attempts,
   *     subchapterConcepts:  array,
   *     allAttemptsConceptStats: array,
   *     timeSpentMinutes: number
   *   },
   *   understand: { ... },
   *   apply:      { ... },
   *   analyze:    { ... }
   * }
   */
  const [quizDataMap, setQuizDataMap] = useState({});

  // For the existing <HistoryView> modal (like LibraryView2)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubChId, setModalSubChId] = useState("");
  const [modalStage, setModalStage] = useState("");

  // "Task Info" modal
  const [taskInfoOpen, setTaskInfoOpen] = useState(false);
  const [taskInfoSubChId, setTaskInfoSubChId] = useState("");

  // ----------------------------------------------
  // 1) On mount => fetch chapters => subchapters => quiz data
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

        // For each subCh => fetch data for each QUIZ_STAGE
        const tasks = [];
        for (let scId of allSubChIds) {
          for (let stage of QUIZ_STAGES) {
            tasks.push(fetchQuizData(scId, stage));
          }
        }
        return Promise.all(tasks);
      })
      .catch((err) => {
        console.error("LibraryView3 => fetchChapters error:", err);
        setError(err.message || "Failed to fetch chapters/subchapters.");
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [db, bookId, userId, planId]);

  // ----------------------------------------------
  // 2) fetchChaptersWithSubchapters
  // ----------------------------------------------
  async function fetchChaptersWithSubchapters(bookIdParam) {
    const chaptersArr = [];

    // a) fetch chapters
    const chapQ = query(collection(db, "chapters_demo"), where("bookId", "==", bookIdParam));
    const chapSnap = await getDocs(chapQ);
    for (const cDoc of chapSnap.docs) {
      const cData = cDoc.data();
      chaptersArr.push({
        id: cDoc.id,
        title: cData.title || cData.name || `Chapter ${cDoc.id}`,
        subchapters: [],
      });
    }

    // b) fetch subchapters
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
      // sort subchapters by numeric prefix
      subs.sort((a, b) => parseNumericPrefix(a.name) - parseNumericPrefix(b.name));
      chapObj.subchapters = subs;
    }

    // c) sort chapters
    chaptersArr.sort((a, b) => parseNumericPrefix(a.title) - parseNumericPrefix(b.title));
    return chaptersArr;
  }

  function computePassCount(allAttemptsConceptStats) {
    if (!allAttemptsConceptStats?.length) return 0;
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
    // else => not started
    return {
      overall: "not-started",
      style: { backgroundColor: "#ffcccc" },
      completionDateStr: "",
      timeSpentStr: "0 min",
    };
  }


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

  // ----------------------------------------------
  // 3) fetchQuizData(subChId, stage)
  //    => calls aggregator + build concept stats
  // ----------------------------------------------
  async function fetchQuizData(subChId, quizStage) {
    try {
      // If we've already loaded data for this subCh & stage => skip
      if (quizDataMap[subChId]?.[quizStage]) {
        return;
      }

      // a) getQuiz attempts
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

      // b) getRevisions
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

      // c) subchapterConcepts
      const conceptRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getSubchapterConcepts`, {
        params: { subchapterId: subChId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      // d) build concept stats
      const allAttemptsConceptStats = buildAllAttemptsConceptStats(quizArr, conceptArr);

      // e) aggregator endpoints => quiz + revise => total
      const quizSeconds   = await fetchCumulativeQuizTime(subChId, quizStage);
      const reviseSeconds = await fetchCumulativeReviseTime(subChId, quizStage);
      const totalMinutes = (quizSeconds + reviseSeconds) / 60.0;

      // f) store in quizDataMap
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

        // track max concept count
        const cLen = conceptArr.length;
        if (cLen > copy[subChId].maxConceptsSoFar) {
          copy[subChId].maxConceptsSoFar = cLen;
        }
        return copy;
      });
    } catch (err) {
      console.error("LibraryView3 => fetchQuizData error:", err);
    }
  }

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

  // --------------- MODALS ---------------
  // 1) Quiz HistoryView modal
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

  // 2) "Task Info" modal
  function handleOpenTaskInfo(subChId) {
    setTaskInfoSubChId(subChId);
    setTaskInfoOpen(true);
  }
  function handleCloseTaskInfo() {
    setTaskInfoOpen(false);
    setTaskInfoSubChId("");
  }

  // --------------- RENDER ---------------
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Library View 3 - Task Generation & Stages (Unlimited Attempts)</h2>

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
          onOpenStageModal={handleOpenModal}
          onOpenTaskInfoModal={handleOpenTaskInfo}
        />
      ))}

      {/* 1) Quiz history modal */}
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

      {/* 2) "Task Info" modal => Reading + Quiz stages chain */}
      {taskInfoOpen && (
        <Dialog
          open={taskInfoOpen}
          onClose={handleCloseTaskInfo}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>Subchapter Task Info – {taskInfoSubChId}</DialogTitle>
          <DialogContent dividers>
            {renderTaskInfoContent(taskInfoSubChId)}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTaskInfo} variant="contained" color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );

  // --------------- RENDER TASK INFO ---------------
  function renderTaskInfoContent(subChId) {
    if (!subChId) return <p>No subchapter selected.</p>;

    // 1) read statuses
    const rStatus = getReadingStatus(readingStats[subChId]);
    const rememberData   = quizDataMap[subChId]?.remember;
    const rememberStatus = getQuizStageStatus(rememberData);
    const understandData = quizDataMap[subChId]?.understand;
    const understandStatus = getQuizStageStatus(understandData);
    const applyData = quizDataMap[subChId]?.apply;
    const applyStatus = getQuizStageStatus(applyData);
    const analyzeData = quizDataMap[subChId]?.analyze;
    const analyzeStatus = getQuizStageStatus(analyzeData);

    // 2) lock logic
    const rememberLocked    = (rStatus.overall !== "done");
    const understandLocked  = (rememberStatus.overall !== "done");
    const applyLocked       = (understandStatus.overall !== "done");
    const analyzeLocked     = (applyStatus.overall !== "done");

    // 3) Next tasks
    const readingTaskInfo    = getReadingTaskInfo(rStatus);
    const rememberTaskInfo   = getQuizStageTaskInfo(rememberData, rememberStatus);
    const understandTaskInfo = getQuizStageTaskInfo(understandData, understandStatus);
    const applyTaskInfo      = getQuizStageTaskInfo(applyData, applyStatus);
    const analyzeTaskInfo    = getQuizStageTaskInfo(analyzeData, analyzeStatus);

    // 4) Which stage is currently "active"?
    let readingIsActive      = false;
    let rememberIsActive     = false;
    let understandIsActive   = false;
    let applyIsActive        = false;
    let analyzeIsActive      = false;

    if (rStatus.overall !== "done") {
      readingIsActive = true;
    } else if (rememberStatus.overall !== "done" && !rememberLocked) {
      rememberIsActive = true;
    } else if (understandStatus.overall !== "done" && !understandLocked) {
      understandIsActive = true;
    } else if (applyStatus.overall !== "done" && !applyLocked) {
      applyIsActive = true;
    } else if (analyzeStatus.overall !== "done" && !analyzeLocked) {
      analyzeIsActive = true;
    }

    const rows = [
      {
        stageLabel: "Reading",
        locked: false, // reading is never locked
        status: rStatus.overall,
        nextTaskLabel: readingTaskInfo.taskLabel,
        hasTask: readingTaskInfo.hasTask,
        isActive: readingIsActive,
      },
      {
        stageLabel: "Remember",
        locked: rememberLocked,
        status: rememberStatus.overall,
        nextTaskLabel: rememberTaskInfo.taskLabel,
        hasTask: rememberTaskInfo.hasTask,
        isActive: rememberIsActive,
      },
      {
        stageLabel: "Understand",
        locked: understandLocked,
        status: understandStatus.overall,
        nextTaskLabel: understandTaskInfo.taskLabel,
        hasTask: understandTaskInfo.hasTask,
        isActive: understandIsActive,
      },
      {
        stageLabel: "Apply",
        locked: applyLocked,
        status: applyStatus.overall,
        nextTaskLabel: applyTaskInfo.taskLabel,
        hasTask: applyTaskInfo.hasTask,
        isActive: applyIsActive,
      },
      {
        stageLabel: "Analyze",
        locked: analyzeLocked,
        status: analyzeStatus.overall,
        nextTaskLabel: analyzeTaskInfo.taskLabel,
        hasTask: analyzeTaskInfo.hasTask,
        isActive: analyzeIsActive,
      },
    ];

    return (
      <table style={styles.taskInfoTable}>
        <thead>
          <tr>
            <th style={styles.tdCell}>Stage</th>
            <th style={styles.tdCell}>Locked?</th>
            <th style={styles.tdCell}>Status</th>
            <th style={styles.tdCell}>Next Task</th>
            <th style={styles.tdCell}>Active?</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stageLabel}>
              <td style={styles.tdCell}>{row.stageLabel}</td>
              <td style={styles.tdCell}>{row.locked ? "Yes" : "No"}</td>
              <td style={styles.tdCell}>{row.status}</td>
              <td style={styles.tdCell}>
                {row.hasTask ? row.nextTaskLabel : "No Task Needed"}
              </td>
              <td style={styles.tdCell}>
                {row.isActive ? <strong>ACTIVE</strong> : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

/**
 * ChapterTable => columns:
 *    Subchapter | (i button) | Total Concepts | Reading | Remember | Understand | Apply | Analyze
 *
 * We add a new "Task Info" button in the subchapter cell. The rest is identical
 * chain logic for locked vs. not locked, color coding, etc.
 */
function ChapterTable({
  chapter,
  readingStats,
  quizDataMap,
  onOpenStageModal,
  onOpenTaskInfoModal,
}) {
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
                const rStatus = getReadingStatus(readingStats[subChId]);

                // quiz statuses
                const rememberData = quizDataMap[subChId]?.remember;
                const rememberStatus = getQuizStageStatus(rememberData);
                const understandData = quizDataMap[subChId]?.understand;
                const understandStatus = getQuizStageStatus(understandData);
                const applyData = quizDataMap[subChId]?.apply;
                const applyStatus = getQuizStageStatus(applyData);
                const analyzeData = quizDataMap[subChId]?.analyze;
                const analyzeStatus = getQuizStageStatus(analyzeData);

                const subMap = quizDataMap[subChId];
                const totalConcepts = subMap?.maxConceptsSoFar || 0;

                // lock logic
                const rememberLocked = (rStatus.overall !== "done");
                const understandLocked = (rememberStatus.overall !== "done");
                const applyLocked      = (understandStatus.overall !== "done");
                const analyzeLocked    = (applyStatus.overall !== "done");

                return (
                  <tr key={subChId}>
                    {/* Subchapter + 'i' button => open tasks modal */}
                    <td style={styles.tdName}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div>{sub.name}</div>
                        <button
                          style={styles.infoBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTaskInfoModal(subChId);
                          }}
                        >
                          i
                        </button>
                      </div>
                    </td>
                    <td style={styles.tdCell}>{totalConcepts}</td>

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

  // =========== Reading Helpers ===========
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
    }
    // done
    return (
      <div>
        <div style={{ fontWeight: "bold" }}>Done</div>
        <div style={{ fontSize: "0.8rem" }}>{rStatus.timeSpentStr}</div>
      </div>
    );
  }

  // =========== Quiz Stage Helpers ===========
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

  function computePassCount(allAttemptsConceptStats) {
    if (!allAttemptsConceptStats?.length) return 0;
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

  function renderStageCellStyle(isLocked, stageStatus) {
    if (isLocked) {
      return { ...styles.tdCell, backgroundColor: "#ddd" };
    }
    if (stageStatus.overall === "done") {
      return { ...styles.tdCell, backgroundColor: "#ccffcc" };
    } else if (stageStatus.overall === "in-progress") {
      return { ...styles.tdCell, backgroundColor: "#fff8b3" };
    }
    // not-started => pale red
    return { ...styles.tdCell, backgroundColor: "#ffcccc" };
  }

  function renderQuizStageCell(subChId, stage, locked, stageStatus) {
    if (locked) {
      return <span style={{ fontWeight: "bold", opacity: 0.6 }}>🔒 Locked</span>;
    }
    // else => show mastery + time + "View"
    return (
      <div>
        <div style={{ fontWeight: "bold" }}>{stageStatus.masteryPct.toFixed(0)}%</div>
        <div style={{ fontSize: "0.8rem" }}>{stageStatus.timeStr}</div>
        <button
          style={styles.viewBtn}
          onClick={() => onOpenStageModal(subChId, stage)}
        >
          View
        </button>
      </div>
    );
  }
}

// =========== Reading & Quiz Task Info Helpers ===========

/**
 * getReadingTaskInfo(rStatus)
 * => { hasTask: boolean, taskLabel: string }
 * If reading "done" => no new task needed
 * else => "READ"
 */
function getReadingTaskInfo(rStatus) {
  if (rStatus.overall === "done") {
    return { hasTask: false, taskLabel: "" };
  }
  return { hasTask: true, taskLabel: "READ" };
}

/**
 * getQuizStageTaskInfo(stageData, stageStatus)
 * => If stageStatus is "done" => no more tasks
 * => Else, figure out the last step (quizN or revisionN) => next step is:
 *      if last was quizN => revisionN
 *      if last was revisionN => quiz(N+1)
 *      if none => quiz1
 *
 * We'll find the last step by sorting attempts by timestamp (fallback to attemptNumber).
 */
function getQuizStageTaskInfo(stageData, stageStatus) {
  // if 100% done => no tasks
  if (!stageData) {
    // No data => not started => next is QUIZ1
    return { hasTask: true, taskLabel: "QUIZ1" };
  }

  if (stageStatus === "done") {
    return { hasTask: false, taskLabel: "" };
  }

  // gather quiz + revision attempts in chronological order
  const quizAttempts = stageData.quizAttempts || [];
  const revisionAttempts = stageData.revisionAttempts || [];
  // build a combined array
  const combined = [];

  // push quiz
  quizAttempts.forEach((q) => {
    combined.push({
      type: "quiz",
      attemptNumber: q.attemptNumber || 1,
      timestamp: q.timestamp || null,
    });
  });
  // push revision
  revisionAttempts.forEach((r) => {
    combined.push({
      type: "revision",
      attemptNumber: r.revisionNumber || 1,
      timestamp: r.timestamp || null,
    });
  });

  // sort by timestamp => fallback to attemptNumber if timestamps missing
  combined.sort((a, b) => {
    // If both have timestamps, compare them
    if (a.timestamp && b.timestamp) {
      // Firestore timestamps or Date objects
      const aTime = toMillis(a.timestamp);
      const bTime = toMillis(b.timestamp);
      return aTime - bTime;
    }
    // if only one has a timestamp
    if (a.timestamp && !b.timestamp) return -1; // a first
    if (!a.timestamp && b.timestamp) return 1;  // b first

    // fallback => compare attemptNumber
    return a.attemptNumber - b.attemptNumber;
  });

  if (combined.length === 0) {
    // no attempts at all => next is quiz1
    return { hasTask: true, taskLabel: "QUIZ1" };
  }

  // find the last item
  const last = combined[combined.length - 1];
  if (last.type === "quiz") {
    // next => revision N
    return { hasTask: true, taskLabel: `REVISION${last.attemptNumber}` };
  }
  // last.type === "revision"
  return { hasTask: true, taskLabel: `QUIZ${last.attemptNumber + 1}` };
}

function toMillis(ts) {
  // If Firestore Timestamp => ts.seconds => to ms
  if (ts && typeof ts.seconds === "number") {
    return ts.seconds * 1000;
  }
  // If Date object
  if (ts instanceof Date) {
    return ts.getTime();
  }
  // if possibly _seconds
  if (ts && ts._seconds) {
    return ts._seconds * 1000;
  }
  return 0; // fallback
}

// ===================== STYLES =====================
const styles = {
  container: {
    backgroundColor: "#fafafa",
    padding: "8px",
    borderRadius: "4px",
    maxWidth: "1200px",
    margin: "0 auto",
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
    fontWeight: "bold",
  },
  tdName: {
    border: "1px solid #ccc",
    padding: "8px",
    fontWeight: "bold",
    width: "18%",
    whiteSpace: "nowrap",
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
  infoBtn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "2px 6px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  taskInfoTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
};