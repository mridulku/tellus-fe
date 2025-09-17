// File: AggregatorPanel.jsx
import React, { useState, useEffect } from "react";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";

/**
 * AggregatorPanel
 * ---------------
 * Combines the functionality of:
 *  - AggregatorResultView (showing reading/remember/understand/apply/analyze statuses & next tasks)
 *  - AggregatorProgressView (progress bars & overall progress)
 *
 * Also includes a "Generate Aggregator Doc" button to trigger the cloud function
 * that creates aggregator data in Firestore.
 */
export default function AggregatorPanel({
  db,
  userId,
  planId,
  bookId,
  colorScheme = {},
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // aggregator data => aggregatorResult from aggregator_v2
  const [aggregatorData, setAggregatorData] = useState(null);

  // 1) On mount (and whenever we re-generate aggregator doc), fetch aggregator doc
  useEffect(() => {
    if (!db || !userId || !planId || !bookId) return;
    fetchLatestAggregatorDoc();
  }, [db, userId, planId, bookId]);

  // 2) Function to fetch aggregator doc => aggregator_v2
  async function fetchLatestAggregatorDoc() {
    try {
      setLoading(true);
      setError("");

      // query aggregator_v2 by userId, planId, bookId => latest (orderBy createdAt desc, limit(1))
      const q = query(
        collection(db, "aggregator_v2"),
        where("userId", "==", userId),
        where("planId", "==", planId),
        where("bookId", "==", bookId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setAggregatorData(null);
      } else {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        setAggregatorData(data.aggregatorResult || {});
      }
    } catch (err) {
      console.error("fetchLatestAggregatorDoc error:", err);
      setError(err.message || "Failed to fetch aggregator doc.");
    } finally {
      setLoading(false);
    }
  }

  // 3) “Generate Aggregator” => calls your Cloud Function
  async function handleGenerateAggregator() {
    try {
      setLoading(true);
      setError("");

      // POST to your function. Use fetch or axios, your choice:
      const response = await fetch(
        "https://us-central1-comm-app-ff74b.cloudfunctions.net/generateUserProgressAggregator2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, planId, bookId }),
        }
      );
      if (!response.ok) {
        throw new Error(`Cloud Function error: ${response.status}`);
      }

      // After creation, re-fetch aggregator doc from aggregator_v2
      await fetchLatestAggregatorDoc();
    } catch (err) {
      console.error("handleGenerateAggregator error:", err);
      setError(err.message || "Failed to generate aggregator doc.");
    } finally {
      setLoading(false);
    }
  }

  // 4) Rendering aggregator “Result” table + “Progress” bars

  // aggregatorData => { subChId: { reading, readingNextTask, remember, rememberNextTask, ... } }
  // We'll build subchapter rows from aggregatorData if it exists
  const subChKeys = aggregatorData ? Object.keys(aggregatorData) : [];

  // For progress, we check how many of the 5 stages are done => each = 20%
  function isStageDone(stageValue) {
    if (!stageValue) return false;
    const val = stageValue.toString().toLowerCase();
    // adapt to your real logic
    if (val.includes("done")) return true;
    if (val.includes("complete")) return true;
    if (val.includes("pass")) return true;
    return false;
  }

  let overallSumPercent = 0;

  const rows = subChKeys.map((subChId) => {
    const row = aggregatorData[subChId] || {};
    let doneCount = 0;
    if (isStageDone(row.reading)) doneCount++;
    if (isStageDone(row.remember)) doneCount++;
    if (isStageDone(row.understand)) doneCount++;
    if (isStageDone(row.apply)) doneCount++;
    if (isStageDone(row.analyze)) doneCount++;

    const progressPercentage = (doneCount / 5) * 100;
    overallSumPercent += progressPercentage;

    return {
      subChId,
      reading: row.reading,
      readingNextTask: row.readingNextTask,
      remember: row.remember,
      rememberNextTask: row.rememberNextTask,
      understand: row.understand,
      understandNextTask: row.understandNextTask,
      apply: row.apply,
      applyNextTask: row.applyNextTask,
      analyze: row.analyze,
      analyzeNextTask: row.analyzeNextTask,
      activeStage: row.activeStage,
      progressPercentage,
    };
  });

  const subchapterCount = rows.length;
  const overallProgress = subchapterCount > 0 ? overallSumPercent / subchapterCount : 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Aggregator Panel</h2>

      <div style={{ marginBottom: "1rem" }}>
        <Button
          onClick={handleGenerateAggregator}
          variant="contained"
          sx={{
            backgroundColor: colorScheme.heading || "#FFD700",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#e5c100",
            },
          }}
        >
          Generate Aggregator
        </Button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (!aggregatorData || subChKeys.length === 0) && (
        <p>No aggregator data found. Try generating!</p>
      )}

      {/* If aggregator data is available, show tables */}
      {subChKeys.length > 0 && (
        <>
          {/* 1) The "Result" table (similar to AggregatorResultView) */}
          <h3 style={styles.subTitle}>Aggregator Result</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Subchapter</th>
                  <th style={styles.th}>Reading</th>
                  <th style={styles.th}>Reading Next Task</th>
                  <th style={styles.th}>Remember</th>
                  <th style={styles.th}>Remember Next Task</th>
                  <th style={styles.th}>Understand</th>
                  <th style={styles.th}>Understand Next Task</th>
                  <th style={styles.th}>Apply</th>
                  <th style={styles.th}>Apply Next Task</th>
                  <th style={styles.th}>Analyze</th>
                  <th style={styles.th}>Analyze Next Task</th>
                  <th style={styles.th}>Active Stage</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subChId}>
                    <td style={styles.td}>{r.subChId}</td>
                    <td style={styles.td}>{r.reading}</td>
                    <td style={styles.td}>{r.readingNextTask}</td>
                    <td style={styles.td}>{r.remember}</td>
                    <td style={styles.td}>{r.rememberNextTask}</td>
                    <td style={styles.td}>{r.understand}</td>
                    <td style={styles.td}>{r.understandNextTask}</td>
                    <td style={styles.td}>{r.apply}</td>
                    <td style={styles.td}>{r.applyNextTask}</td>
                    <td style={styles.td}>{r.analyze}</td>
                    <td style={styles.td}>{r.analyzeNextTask}</td>
                    <td style={styles.td}>{r.activeStage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 2) Progress table (similar to AggregatorProgressView) */}
          <h3 style={styles.subTitle}>Aggregator Progress</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Subchapter</th>
                  <th style={styles.th}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.subChId}>
                    <td style={styles.td}>{r.subChId}</td>
                    <td style={styles.td}>
                      <div style={styles.progressBarContainer}>
                        <div style={styles.progressTrack}>
                          <div
                            style={{
                              ...styles.progressFill,
                              width: `${r.progressPercentage}%`,
                            }}
                          />
                        </div>
                        <span style={styles.progressLabel}>
                          {r.progressPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3) Overall progress */}
          <div style={styles.overallProgress}>
            <h4>Overall Progress</h4>
            <div style={styles.progressBarContainer}>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${overallProgress}%`,
                  }}
                />
              </div>
              <span style={styles.progressLabel}>{overallProgress.toFixed(1)}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ----------------- STYLES -----------------
import { Button } from "@mui/material"; // if needed above; make sure you have it
const styles = {
  container: {
    padding: "1rem",
  },
  header: {
    fontSize: "1.2rem",
    marginBottom: "0.5rem",
    borderBottom: "1px solid #999",
    paddingBottom: "4px",
  },
  subTitle: {
    marginTop: "1rem",
    fontSize: "1rem",
    borderBottom: "1px solid #ccc",
    paddingBottom: "4px",
  },
  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "8px",
  },
  table: {
    borderCollapse: "collapse",
    minWidth: "1200px",
  },
  th: {
    border: "1px solid #ccc",
    backgroundColor: "#eee",
    padding: "8px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  td: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  progressBarContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  progressTrack: {
    flex: 1,
    height: "16px",
    backgroundColor: "#ddd",
    borderRadius: "8px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4caf50",
    borderRadius: "8px 0 0 8px",
  },
  progressLabel: {
    minWidth: "50px",
    textAlign: "right",
    fontWeight: "bold",
  },
  overallProgress: {
    marginTop: "1rem",
  },
};