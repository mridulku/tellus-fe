import React, { useEffect, useState } from "react";
import axios from "axios";
import QuizHistoryModal from "./QuizHistoryModal"; // The existing modal
import HistoryView from "../../../../5.StudyModal/0.components/Main/Base/HistoryView"; 
// If you want to show the same view inline



/**
 * parsePlanCreationDate
 * ---------------------
 * Tries to parse the plan.createdAt in multiple Firestore/time formats
 */
function parsePlanCreationDate(createdAt) {
  if (!createdAt) return null;
  let dateObj = null;

  if (typeof createdAt.toDate === "function") {
    dateObj = createdAt.toDate();
  } else if (
    typeof createdAt.seconds === "number" &&
    typeof createdAt.nanoseconds === "number"
  ) {
    dateObj = new Date(createdAt.seconds * 1000);
  } else if (
    typeof createdAt._seconds === "number" &&
    typeof createdAt._nanoseconds === "number"
  ) {
    dateObj = new Date(createdAt._seconds * 1000);
  } else if (createdAt instanceof Date) {
    dateObj = createdAt;
  } else if (typeof createdAt === "string") {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return null;
  }
  return dateObj;
}

/**
 * PlanView
 * --------
 * - Renders each session (Day X) as collapsible.
 * - For QUIZ activities, we do two things:
 *   1) Pre-fetch quiz data for each (subChapterId, quizStage) so we can show it inline if we want.
 *   2) Keep the eye ("i") button to open QuizHistoryModal, as previously.
 *
 * Additional columns:
 *   - aggregatorTask
 *   - aggregatorStatus
 */
export default function PlanView({
  plan,
  planId = "",
  readingStats = {},
  userId = "",
  colorScheme = {},
}) {
  // 1) If no plan => bail
  if (!plan) {
    return <p style={styles.infoText}>No plan data available.</p>;
  }

  // 2) Parse creation date
  const creationDate = parsePlanCreationDate(plan.createdAt);
  if (!creationDate) {
    return <p style={styles.infoText}>No valid plan creation date found.</p>;
  }

  // Sessions
  const sessions = plan.sessions || [];

  // =================== STATE ===================
  // which days are expanded?
  const [expandedSessions, setExpandedSessions] = useState([]);
  // for inline quiz expansions
  const [expandedQuizzes, setExpandedQuizzes] = useState([]); 
  // for quiz history modal
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [modalSubchapterId, setModalSubchapterId] = useState("");
  const [modalQuizStage, setModalQuizStage] = useState("");

  // The big map that holds all quiz data
  // quizDataMap[subChapterId][quizStage] = { quizAttempts, revisionAttempts, subchapterConcepts, allAttemptsConceptStats }
  const [quizDataMap, setQuizDataMap] = useState({});

  // =================== Collapsible Helpers ===================
  function toggleSession(label) {
    setExpandedSessions((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function toggleQuizRow(subChapterId, quizStage) {
    const rowKey = `${subChapterId}||${quizStage}`;
    setExpandedQuizzes((prev) =>
      prev.includes(rowKey)
        ? prev.filter((x) => x !== rowKey)
        : [...prev, rowKey]
    );
  }

  function isQuizExpanded(subChapterId, quizStage) {
    const rowKey = `${subChapterId}||${quizStage}`;
    return expandedQuizzes.includes(rowKey);
  }

  // =================== Modal Helpers ===================
  function handleShowQuizHistory(act) {
    const subCh = act.subChapterId || "";
    const stage = (act.quizStage || "").toLowerCase();
    setModalSubchapterId(subCh);
    setModalQuizStage(stage);
    setShowQuizModal(true);
  }

  // =================== PRE-FETCH QUIZ DATA ===================
  // We'll do multiple calls, one for each (subChapterId, quizStage) we find in the plan.
  useEffect(() => {
    if (!userId || !planId) {
      return;
    }

    // 1) gather all (subCh, stage) combos
    const combos = new Set();
    for (const sess of sessions) {
      for (const act of (sess.activities || [])) {
        if (act.type === "QUIZ" && act.quizStage) {
          const scId = act.subChapterId || "";
          const stg = (act.quizStage || "").toLowerCase();
          if (scId && stg) {
            combos.add(`${scId}||${stg}`);
          }
        }
      }
    }

    // 2) for each combo => call fetch
    combos.forEach((comboKey) => {
      const [scId, stage] = comboKey.split("||");
      fetchQuizData(scId, stage);
    });
    // eslint-disable-next-line
  }, [userId, planId, sessions]);

  async function fetchQuizData(subChapterId, quizStage) {
    try {
      // If we already have data for that combo => skip
      setQuizDataMap((prev) => {
        if (prev[subChapterId] && prev[subChapterId][quizStage]) {
          return prev; // skip if loaded
        }
        return prev; // else continue
      });

      // 1) getQuiz
      const quizRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getQuiz`, {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
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
          subchapterId: subChapterId,
          revisionType: quizStage,
        },
      });
      const revArr = revRes?.data?.revisions || [];

      // 3) getSubchapterConcepts
      const conceptRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getSubchapterConcepts`, {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      // 4) build concept stats if needed
      const finalStats = buildAllAttemptsConceptStats(quizArr, conceptArr);

      // 5) store in quizDataMap
      setQuizDataMap((prev) => {
        const copy = { ...prev };
        if (!copy[subChapterId]) copy[subChapterId] = {};
        copy[subChapterId][quizStage] = {
          quizAttempts: quizArr,
          revisionAttempts: revArr,
          subchapterConcepts: conceptArr,
          allAttemptsConceptStats: finalStats,
        };
        return copy;
      });
    } catch (err) {
      console.error(
        "PlanView => fetchQuizData error for subCh=",
        subChapterId,
        "stage=",
        quizStage,
        err
      );
    }
  }

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

    const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
    if (countMap["UnknownConcept"]) {
      conceptNamesSet.add("UnknownConcept");
    }

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

  // =================== RENDER ===================
  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={styles.sectionTitle}>Plan Overview</h3>

      <p style={styles.infoText}>
        <strong>Plan Created On:</strong>{" "}
        {creationDate.toLocaleString()}
      </p>
      <p style={styles.infoText}>
        <strong>Plan Name:</strong>{" "}
        {plan.planName || "(No name)"}
      </p>
      <p style={styles.infoText}>
        <strong>Exam ID:</strong>{" "}
        {plan.examId || "N/A"}
      </p>

      {sessions.length === 0 ? (
        <p style={styles.infoText}>No sessions in the plan.</p>
      ) : (
        sessions.map((sess, index) => {
          const numericLabel = parseInt(sess.sessionLabel, 10) || (index + 1);
          const sessionDateObj = new Date(creationDate.getTime() + (numericLabel - 1) * 86400000);
          const sessionDateStr = sessionDateObj.toLocaleDateString();
          const isExpanded = expandedSessions.includes(sess.sessionLabel);

          return (
            <div key={sess.sessionLabel} style={styles.sessionContainer}>
              {/* Session header */}
              <div
                style={styles.sessionHeader}
                onClick={() => toggleSession(sess.sessionLabel)}
              >
                <div style={{ fontWeight: "bold" }}>
                  {isExpanded ? "▾" : "▸"} Day {sess.sessionLabel} – {sessionDateStr}
                </div>
                <div>{(sess.activities || []).length} activities</div>
              </div>

              {isExpanded && (
                <div style={styles.sessionContent}>
                  {/* We wrap the table in a scrollable container */}
                  <div style={styles.scrollWrapper}>
                    {/* Table header */}
                    <div style={styles.tableHeaderRow}>
                      <div style={{ width: "12%", fontWeight: "bold" }}>Type</div>
                      <div style={{ width: "28%", fontWeight: "bold" }}>Subchapter</div>
                      <div style={{ width: "10%", fontWeight: "bold" }}>Planned</div>
                      <div style={{ width: "15%", fontWeight: "bold" }}>Read Done</div>
                      <div style={{ width: "10%", fontWeight: "bold" }}>Read Time</div>
                      <div style={{ width: "10%", fontWeight: "bold" }}>Quiz Stage</div>
                      {/* New columns */}
                      <div style={{ width: "10%", fontWeight: "bold" }}>Aggregator Task</div>
                      <div style={{ width: "10%", fontWeight: "bold" }}>Aggregator Status</div>
                    </div>

                    {(sess.activities || []).map((act, i) => {
                      const isRead = act.type === "READ";
                      const subChId = act.subChapterId || "";
                      const stats = readingStats[subChId] || null;

                      let completionStr = "—";
                      let timeSpentStr = "—";
                      if (isRead && stats) {
                        if (stats.completionDate) {
                          completionStr = stats.completionDate.toLocaleDateString();
                        }
                        if (typeof stats.totalTimeSpentMinutes === "number") {
                          timeSpentStr = stats.totalTimeSpentMinutes.toFixed(1) + " min";
                        }
                      }

                      let quizCellContent = "—";
                      let extraRowContent = null; // for inline expansion

                      if (act.type === "QUIZ" && act.quizStage) {
                        const stage = (act.quizStage || "").toLowerCase();
                        quizCellContent = (
                          <>
                            {act.quizStage}
                            {/* Eye icon => open QuizHistoryModal */}
                            <button
                              style={styles.infoBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShowQuizHistory(act);
                              }}
                            >
                              i
                            </button>
                            {/* Inline expand button */}
                            <button
                              style={styles.expandBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleQuizRow(subChId, stage);
                              }}
                            >
                              {isQuizExpanded(subChId, stage) ? "▲" : "▼"}
                            </button>
                          </>
                        );

                        // If expanded => show HistoryView inline
                        if (isQuizExpanded(subChId, stage)) {
                          const dataForThisQuiz = quizDataMap[subChId]?.[stage] || null;
                          if (dataForThisQuiz) {
                            extraRowContent = (
                              <div
                                style={{
                                  marginTop: "8px",
                                  border: "1px solid #ccc",
                                  padding: "8px"
                                }}
                              >
                                <HistoryView
                                  quizStage={stage}
                                  totalStages={["remember","understand","apply","analyze"]}
                                  quizAttempts={dataForThisQuiz.quizAttempts || []}
                                  revisionAttempts={dataForThisQuiz.revisionAttempts || []}
                                  subchapterConcepts={dataForThisQuiz.subchapterConcepts || []}
                                  allAttemptsConceptStats={dataForThisQuiz.allAttemptsConceptStats || []}
                                />
                              </div>
                            );
                          } else {
                            extraRowContent = (
                              <div style={{ marginTop: "8px", color: "#999" }}>
                                <em>Loading or no data found for quiz stage "{stage}"</em>
                              </div>
                            );
                          }
                        }
                      }

                      // aggregatorTask / aggregatorStatus => only if they exist
                      const aggregatorTask = act.aggregatorTask || "—";
                      const aggregatorStatus = act.aggregatorStatus || "—";

                      return (
                        <div key={i}>
                          {/* The main row for this activity */}
                          <div style={styles.tableRow}>
                            {/* 1) Type */}
                            <div style={{ width: "12%" }}>
                              <strong>{act.type}</strong>
                            </div>
                            {/* 2) Subchapter */}
                            <div style={{ width: "28%", fontStyle: "italic" }}>
                              {act.subChapterName || "Unknown SubCh"}
                            </div>
                            {/* 3) Planned */}
                            <div style={{ width: "10%", textAlign: "right" }}>
                              {act.timeNeeded || 0} min
                            </div>
                            {/* 4) Read Done */}
                            <div style={{ width: "15%", textAlign: "center" }}>
                              {completionStr}
                            </div>
                            {/* 5) Read Time */}
                            <div style={{ width: "10%", textAlign: "right" }}>
                              {timeSpentStr}
                            </div>
                            {/* 6) Quiz Stage */}
                            <div style={{ width: "10%", textAlign: "center" }}>
                              {quizCellContent}
                            </div>
                            {/* 7) Aggregator Task */}
                            <div style={{ width: "10%", textAlign: "center" }}>
                              {aggregatorTask}
                            </div>
                            {/* 8) Aggregator Status */}
                            <div style={{ width: "10%", textAlign: "center" }}>
                              {aggregatorStatus}
                            </div>
                          </div>
                          {/* Possibly show inline expanded content for quiz */}
                          {extraRowContent}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* The quiz history modal => only if showQuizModal=true */}
      {showQuizModal && (
        <QuizHistoryModal
          planId={planId}
          open={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          subChapterId={modalSubchapterId}
          quizStage={modalQuizStage}
          userId={userId}
        />
      )}
    </div>
  );
}

// ===================== Styles =====================
const styles = {
  sectionTitle: {
    margin: "0.5rem 0",
    color: "#333",
    fontSize: "1.05rem",
    fontWeight: 600,
    borderBottom: "1px solid #ccc",
    paddingBottom: "0.3rem",
  },
  infoText: {
    fontSize: "0.95rem",
    color: "#333",
    margin: "0.5rem 0",
  },
  sessionContainer: {
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "4px",
    marginBottom: "8px",
  },
  sessionHeader: {
    cursor: "pointer",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: "4px",
  },
  sessionContent: {
    padding: "8px 12px",
    borderTop: "1px solid #ddd",
  },
  // Wrap the table in a scrollable div
  scrollWrapper: {
    overflowX: "auto",
  },
  tableHeaderRow: {
    display: "flex",
    borderBottom: "2px solid #ccc",
    paddingBottom: "4px",
    marginBottom: "6px",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid #eee",
    padding: "4px 0",
    alignItems: "center",
  },
  infoBtn: {
    marginLeft: 6,
    backgroundColor: "#888",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "2px 6px",
  },
  expandBtn: {
    marginLeft: 4,
    backgroundColor: "#666",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "2px 6px",
  },
};