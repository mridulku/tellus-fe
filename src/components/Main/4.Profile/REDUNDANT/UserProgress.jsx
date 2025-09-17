// src/components/UserProgressComprehensive.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { db } from "../../../firebase"; // Adjust to your actual path
import {
  collection,
  getDocs,
} from "firebase/firestore";

/**
 * Stages. Adapt as needed if you want more or fewer stages.
 */
const STAGES = ["remember", "understand", "apply", "analyze"];

/**
 * parseNumericPrefix => for sorting "1. Intro", "2.1 Something", etc.
 */
function parseNumericPrefix(str = "") {
  const match = str.trim().match(/^(\d+(\.\d+)*)(\s|\.)?/);
  if (!match) return Number.MAX_VALUE;
  return parseFloat(match[1]);
}

function sortByNumericAware(items, nameKey = "name") {
  return items.sort((a, b) => {
    const aVal = parseNumericPrefix(a[nameKey] || "");
    const bVal = parseNumericPrefix(b[nameKey] || "");
    return aVal - bVal;
  });
}

/**
 * We'll define a fallback for empty/missing examId as "(none)"
 */
function normalizeExamId(examId) {
  if (!examId || examId.trim() === "") {
    return "(none)";
  }
  return examId;
}

/**
 * UserProgressComprehensive
 * - Loads Books/Chapters/SubChapters/Concepts from Firestore
 * - For each sub-ch + stage => calls /api/getQuiz + /api/getRevisions
 * - Aggregates quiz + revision data grouped by "effectiveExamId" (real examId or "(none)") + stage
 * - Renders in a collapsible tree
 */
export default function UserProgressComprehensive({
  userId,
  colorScheme = {},
  backendURL = import.meta.env.VITE_BACKEND_URL, // or wherever your server runs
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Structural data
  const [books, setBooks] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [subChapters, setSubChapters] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);

  // Collapsible states
  const [expandedBooks, setExpandedBooks] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedSubChapters, setExpandedSubChapters] = useState({});

  /**
   * We'll store quizDataMap and revDataMap like:
   * quizDataMap[subChId][stage][examId] = arrayOfAttempts
   * revDataMap[subChId][stage][examId]  = arrayOfRevisions
   *
   * Where examId might be "(none)" if the doc is missing examId or it's empty.
   */
  const [quizDataMap, setQuizDataMap] = useState({});
  const [revDataMap, setRevDataMap] = useState({});

  // 1) Load structure from Firestore
  useEffect(() => {
    if (!userId) {
      setError("No userId provided. Cannot load user progress.");
      return;
    }
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // A) Books
        const booksSnap = await getDocs(collection(db, "books_demo"));
        let booksArr = booksSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        booksArr = sortByNumericAware(booksArr, "name");

        // B) Chapters
        const chaptersSnap = await getDocs(collection(db, "chapters_demo"));
        let chaptersArr = chaptersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        chaptersArr = sortByNumericAware(chaptersArr, "name");

        // C) Sub-chapters
        const subChSnap = await getDocs(collection(db, "subchapters_demo"));
        let subChArr = subChSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        subChArr = sortByNumericAware(subChArr, "name");

        // D) Sub-chapter concepts
        const sccSnap = await getDocs(collection(db, "subchapter_concepts"));
        let sccArr = sccSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        sccArr = sortByNumericAware(sccArr, "name");

        setBooks(booksArr);
        setChapters(chaptersArr);
        setSubChapters(subChArr);
        setSubchapterConcepts(sccArr);

        // 2) Now fetch quiz+revision data for each sub-ch & each stage
        await fetchAllQuizAndRevisions(subChArr);
      } catch (err) {
        console.error("Error loading structure or quiz data:", err);
        setError(err.message || "Error loading data");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  /**
   * fetchAllQuizAndRevisions:
   *   For each sub-chapter => for each stage => call /api/getQuiz & /api/getRevisions
   *   Then group them by examId => either doc.examId or "(none)" if missing
   */
  async function fetchAllQuizAndRevisions(subChArr) {
    const newQuizMap = {};
    const newRevMap = {};
    const promises = [];

    subChArr.forEach((sc) => {
      const scId = sc.id;
      STAGES.forEach((stage) => {
        // 1) /api/getQuiz => quizType=stage
        const quizPromise = axios
          .get(`${backendURL}/api/getQuiz`, {
            params: {
              userId,
              subchapterId: scId,
              quizType: stage,
            },
          })
          .then((resp) => {
            const attempts = resp.data.attempts || [];
            // Group by examId => newQuizMap[scId][stage][examId] = arrayOfAttempts
            attempts.forEach((att) => {
              const docExamId = normalizeExamId(att.examId || "");
              if (!newQuizMap[scId]) newQuizMap[scId] = {};
              if (!newQuizMap[scId][stage]) newQuizMap[scId][stage] = {};
              if (!newQuizMap[scId][stage][docExamId]) {
                newQuizMap[scId][stage][docExamId] = [];
              }
              newQuizMap[scId][stage][docExamId].push(att);
            });
          })
          .catch((err) => {
            console.error(
              `Error getQuiz subCh=${scId}, stage=${stage}:`,
              err.message
            );
            // On error, at least initialize empty structure so UI won't break
            if (!newQuizMap[scId]) newQuizMap[scId] = {};
            if (!newQuizMap[scId][stage]) newQuizMap[scId][stage] = {};
            // No data
          });
        promises.push(quizPromise);

        // 2) /api/getRevisions => revisionType=stage
        const revPromise = axios
          .get(`${backendURL}/api/getRevisions`, {
            params: {
              userId,
              subchapterId: scId,
              revisionType: stage,
            },
          })
          .then((resp) => {
            const revs = resp.data.revisions || [];
            revs.forEach((rev) => {
              // If your "revisions_demo" docs might have examId too, 
              // handle it the same. If not, fallback to "(none)"
              const docExamId = normalizeExamId(rev.examId || "");
              if (!newRevMap[scId]) newRevMap[scId] = {};
              if (!newRevMap[scId][stage]) newRevMap[scId][stage] = {};
              if (!newRevMap[scId][stage][docExamId]) {
                newRevMap[scId][stage][docExamId] = [];
              }
              newRevMap[scId][stage][docExamId].push(rev);
            });
          })
          .catch((err) => {
            console.error(
              `Error getRevisions subCh=${scId}, stage=${stage}:`,
              err.message
            );
            if (!newRevMap[scId]) newRevMap[scId] = {};
            if (!newRevMap[scId][stage]) newRevMap[scId][stage] = {};
          });
        promises.push(revPromise);
      });
    });

    // Wait all
    await Promise.all(promises);

    setQuizDataMap(newQuizMap);
    setRevDataMap(newRevMap);
  }

  // Collapsible toggles
  function toggleBook(bId) {
    setExpandedBooks((prev) => ({ ...prev, [bId]: !prev[bId] }));
  }
  function toggleChapter(cId) {
    setExpandedChapters((prev) => ({ ...prev, [cId]: !prev[cId] }));
  }
  function toggleSubChapter(scId) {
    setExpandedSubChapters((prev) => ({ ...prev, [scId]: !prev[scId] }));
  }

  // Grouping for display
  const chaptersByBook = {};
  chapters.forEach((ch) => {
    const bId = ch.bookId || "no-book";
    if (!chaptersByBook[bId]) chaptersByBook[bId] = [];
    chaptersByBook[bId].push(ch);
  });

  const subChaptersByChapter = {};
  subChapters.forEach((sc) => {
    const cId = sc.chapterId || "no-chapter";
    if (!subChaptersByChapter[cId]) subChaptersByChapter[cId] = [];
    subChaptersByChapter[cId].push(sc);
  });

  const conceptsBySubCh = {};
  subchapterConcepts.forEach((cn) => {
    const sId = cn.subChapterId || "no-subchapter";
    if (!conceptsBySubCh[sId]) conceptsBySubCh[sId] = [];
    conceptsBySubCh[sId].push(cn);
  });

  // Format a Firestore timestamp
  function formatTimestamp(ts) {
    if (!ts) return null;
    // If your Firestore doc has { _seconds }:
    if (ts._seconds) {
      const d = new Date(ts._seconds * 1000);
      return d.toLocaleString();
    }
    // If it's a string date:
    if (typeof ts === "string") {
      return new Date(ts).toLocaleString();
    }
    return null;
  }

  // Render
  return (
    <div
      style={{
        backgroundColor: colorScheme.cardBg || "#2F2F2F",
        color: colorScheme.textColor || "#fff",
        borderRadius: "8px",
        padding: "1rem",
        border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
      }}
    >
      <h2 style={{ marginTop: 0 }}>User Progress - Handling (none) ExamID</h2>

      {loading && <p>Loading structural + quiz data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && books.length === 0 && (
        <p>No books found in Firestore (or no data).</p>
      )}

      {books.map((book) => {
        const bId = book.id;
        const isBookExp = !!expandedBooks[bId];
        const childChapters = chaptersByBook[bId] || [];

        return (
          <div key={bId} style={styles.bookContainer}>
            <div style={styles.bookHeaderRow} onClick={() => toggleBook(bId)}>
              <span style={styles.expandIcon}>{isBookExp ? "[-]" : "[+]"}</span>
              <span style={styles.bookTitle}>
                {book.name || `Untitled Book (${bId})`}
              </span>
            </div>

            {isBookExp && (
              <div style={{ marginLeft: "1.5rem" }}>
                {childChapters.length === 0 && (
                  <p style={styles.noItemText}>No chapters found.</p>
                )}
                {childChapters.map((ch) => {
                  const cId = ch.id;
                  const isChapExp = !!expandedChapters[cId];
                  const childSubChapters = subChaptersByChapter[cId] || [];

                  return (
                    <div key={cId} style={styles.chapterContainer}>
                      <div
                        style={styles.chapterHeaderRow}
                        onClick={() => toggleChapter(cId)}
                      >
                        <span style={styles.expandIcon}>
                          {isChapExp ? "[-]" : "[+]"}
                        </span>
                        <span style={styles.chapterTitle}>
                          {ch.name || `Untitled Chapter (${cId})`}
                        </span>
                      </div>

                      {isChapExp && (
                        <div style={{ marginLeft: "1.5rem" }}>
                          {childSubChapters.length === 0 && (
                            <p style={styles.noItemText}>
                              No sub-chapters found.
                            </p>
                          )}
                          {childSubChapters.map((sc) => {
                            const scId = sc.id;
                            const isSCExp = !!expandedSubChapters[scId];
                            const scConcepts = conceptsBySubCh[scId] || [];

                            return (
                              <div key={scId} style={styles.subChContainer}>
                                <div
                                  style={styles.subChHeaderRow}
                                  onClick={() => toggleSubChapter(scId)}
                                >
                                  <span style={styles.expandIcon}>
                                    {isSCExp ? "[-]" : "[+]"}
                                  </span>
                                  <span style={styles.subChTitle}>
                                    {sc.name || `Untitled SubCh (${scId})`}
                                  </span>
                                </div>

                                {isSCExp && (
                                  <div style={{ marginLeft: "1.5rem" }}>
                                    {/* Sub-ch Concepts */}
                                    {scConcepts.length > 0 && (
                                      <div style={{ marginBottom: "0.5rem" }}>
                                        <b>Concepts:</b>
                                        <ul>
                                          {scConcepts.map((cn) => (
                                            <li key={cn.id}>
                                              {cn.name || `Concept (${cn.id})`}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Summaries: Group by stage -> examId -> attempts */}
                                    {renderStageExamTable(
                                      scId,
                                      quizDataMap,
                                      revDataMap,
                                      formatTimestamp
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * renderStageExamTable:
 *   We have quizDataMap[subChId][stage][examId] = arrayOfAttempts
 *   We have revDataMap[subChId][stage][examId]  = arrayOfRevisions
 *
 *   We'll show a table with columns:
 *      Stage | ExamID | # Attempts | Last Attempt Score | # Revisions | Last Revision
 *   For each (stage in STAGES) => for each examId found in quizDataMap or revDataMap
 */
function renderStageExamTable(
  subChId,
  quizDataMap,
  revDataMap,
  formatTimestampFn
) {
  const stageObjQuiz = quizDataMap[subChId] || {};
  const stageObjRev = revDataMap[subChId] || {};

  // Collect a combined set of examIds for each stage
  // We'll do a bigger table that has multiple rows if you want to show each stage row by row,
  // and inside each row, we might have multiple examIds. Or we do one row per (stage, examId).
  // Let's do one row per (stage, examId).
  const rows = [];

  // For each stage in STAGES, we see what examIds appear in quiz or revision data.
  STAGES.forEach((stage) => {
    const quizExamObj = stageObjQuiz[stage] || {}; // examId => array
    const revExamObj = stageObjRev[stage] || {};   // examId => array

    // Merge examIds from both
    const examIdsSet = new Set([
      ...Object.keys(quizExamObj),
      ...Object.keys(revExamObj),
    ]);
    // If empty => maybe no data for that stage at all

    examIdsSet.forEach((exId) => {
      const attempts = quizExamObj[exId] || [];
      const revs = revExamObj[exId] || [];

      const attemptsCount = attempts.length;
      let lastAttemptScore = "";
      let lastAttemptTime = "";
      if (attemptsCount > 0) {
        // Sort attempts by attemptNumber desc or timestamp desc
        attempts.sort((a, b) => {
          const nA = a.attemptNumber || 0;
          const nB = b.attemptNumber || 0;
          return nB - nA;
        });
        const lastAtt = attempts[0];
        lastAttemptScore = lastAtt.score || "";
        lastAttemptTime = formatTimestampFn(lastAtt.timestamp) || "";
      }

      const revCount = revs.length;
      let lastRevTime = "";
      if (revCount > 0) {
        revs.sort((a, b) => {
          const rA = a.revisionNumber || 0;
          const rB = b.revisionNumber || 0;
          return rB - rA;
        });
        const lastRev = revs[0];
        lastRevTime = formatTimestampFn(lastRev.timestamp) || "";
      }

      rows.push({
        stage,
        examId: exId,
        attemptsCount,
        lastAttemptScore,
        lastAttemptTime,
        revCount,
        lastRevTime,
      });
    });
  });

  if (rows.length === 0) {
    return <p style={styles.noItemText}>No quiz or revision data yet.</p>;
  }

  return (
    <table style={styles.dataTable}>
      <thead>
        <tr>
          <th style={styles.tableHeader}>Stage</th>
          <th style={styles.tableHeader}>Exam ID</th>
          <th style={styles.tableHeader}># Quiz Attempts</th>
          <th style={styles.tableHeader}>Last Quiz Score</th>
          <th style={styles.tableHeader}>Last Quiz Time</th>
          <th style={styles.tableHeader}># Revisions</th>
          <th style={styles.tableHeader}>Last Revision</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={`${r.stage}-${r.examId}-${idx}`}>
            <td style={styles.tableCell}>{r.stage}</td>
            <td style={styles.tableCell}>{r.examId}</td>
            <td style={styles.tableCell}>{r.attemptsCount}</td>
            <td style={styles.tableCell}>{r.lastAttemptScore || "-"}</td>
            <td style={styles.tableCell}>{r.lastAttemptTime || "-"}</td>
            <td style={styles.tableCell}>{r.revCount}</td>
            <td style={styles.tableCell}>{r.lastRevTime || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ----------------------------------
// Inline Styles
// ----------------------------------
const styles = {
  bookContainer: {
    marginBottom: "1rem",
    borderBottom: "1px solid #444",
    paddingBottom: "0.5rem",
  },
  bookHeaderRow: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "0.3rem",
  },
  expandIcon: {
    marginRight: "0.5rem",
    color: "#FFD700",
  },
  bookTitle: {
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  noItemText: {
    fontStyle: "italic",
    color: "#aaa",
    fontSize: "0.85rem",
  },
  chapterContainer: {
    marginBottom: "1rem",
  },
  chapterHeaderRow: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "0.3rem",
  },
  chapterTitle: {
    fontSize: "1rem",
    fontWeight: "bold",
  },
  subChContainer: {
    marginBottom: "0.5rem",
  },
  subChHeaderRow: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    marginBottom: "0.2rem",
  },
  subChTitle: {
    fontSize: "0.95rem",
  },
  dataTable: {
    borderCollapse: "collapse",
    marginTop: "0.5rem",
  },
  tableHeader: {
    borderBottom: "1px solid #666",
    padding: "4px 8px",
    textAlign: "left",
  },
  tableCell: {
    borderBottom: "1px solid #444",
    padding: "4px 8px",
    textAlign: "left",
  },
};