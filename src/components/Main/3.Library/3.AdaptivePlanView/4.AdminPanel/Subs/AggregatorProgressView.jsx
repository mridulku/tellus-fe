// File: aggregatorProgressView.jsx

import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

/**
 * AggregatorProgressView
 * ----------------------
 * - Fetches the same aggregator_v2 doc as AggregatorResultView
 * - For each subchapter, calculates a "progress" out of 5 stages (reading, remember, understand, apply, analyze)
 * - Each completed stage = 20% of that subchapter's progress
 * - Renders a table with a progress bar for each subchapter
 * - Also shows an overall (average) progress across all subchapters
 *
 * Props:
 *   - db (Firestore instance)
 *   - userId (string)
 *   - planId (string)
 *   - bookId (string)
 *   - aggregatorDocId (optional string):
 *       If provided, fetch that doc from aggregator_v2
 *       Otherwise, fetch the latest aggregator_v2 doc for (userId, planId, bookId)
 */
export default function AggregatorProgressView({
  db,
  userId,
  planId,
  bookId,
  aggregatorDocId = "",
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aggregatorResult, setAggregatorResult] = useState(null);

  // 1) Fetch aggregator doc (same logic as aggregatorResultView)
  useEffect(() => {
    if (!db || !userId || !planId || !bookId) {
      setError("Missing db, userId, planId, or bookId.");
      setLoading(false);
      return;
    }

    async function fetchAggregatorDoc() {
      try {
        setLoading(true);
        setError("");

        if (aggregatorDocId) {
          // 1) If doc ID is specified, fetch that directly
          const docRef = doc(db, "aggregator_v2", aggregatorDocId);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            setError(`No aggregator doc found with ID="${aggregatorDocId}".`);
            setLoading(false);
            return;
          }
          const data = docSnap.data();
          setAggregatorResult(data.aggregatorResult || {});
        } else {
          // 2) Otherwise, query aggregator_v2 by userId, planId, bookId
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
            setError("No aggregator_v2 document found for these filters.");
            setLoading(false);
            return;
          }
          // take the first doc
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          setAggregatorResult(data.aggregatorResult || {});
        }
      } catch (err) {
        console.error("AggregatorProgressView => fetchAggregatorDoc error:", err);
        setError(err.message || "Failed to fetch aggregator doc.");
      } finally {
        setLoading(false);
      }
    }

    fetchAggregatorDoc();
  }, [db, userId, planId, bookId, aggregatorDocId]);

  if (loading) {
    return <p>Loading aggregator data...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!aggregatorResult || Object.keys(aggregatorResult).length === 0) {
    return <p>No aggregator result found.</p>;
  }

  // 2) We have aggregatorResult => object:
  //    subChId: {
  //      reading,
  //      remember,
  //      understand,
  //      apply,
  //      analyze,
  //      ...
  //    }, ...
  //
  // We'll calculate progress from these 5 keys.

  // Helper: is a stage "done"?
  function isStageDone(stageValue) {
    if (!stageValue) return false;
    const lower = stageValue.toString().toLowerCase();
    // we treat "done" or "completed" or "passed" as done
    // adjust as needed for your aggregator doc
    if (lower.includes("done")) return true;
    if (lower.includes("complete")) return true;
    if (lower.includes("pass")) return true;
    return false;
  }

  // Build an array of { subChId, progress, doneCount }
  const subchapterProgressArray = Object.entries(aggregatorResult).map(
    ([subChId, row]) => {
      // row.reading, row.remember, row.understand, row.apply, row.analyze
      let doneCount = 0;
      if (isStageDone(row.reading)) doneCount++;
      if (isStageDone(row.remember)) doneCount++;
      if (isStageDone(row.understand)) doneCount++;
      if (isStageDone(row.apply)) doneCount++;
      if (isStageDone(row.analyze)) doneCount++;

      const progressPercentage = (doneCount / 5) * 100;

      return {
        subChId,
        doneCount,
        progressPercentage,
      };
    }
  );

  // 3) Overall progress => average progress across all subchapters
  // or sum of progress / subchapterCount
  const totalSubchapters = subchapterProgressArray.length;
  const sumOfPercentages = subchapterProgressArray.reduce(
    (acc, obj) => acc + obj.progressPercentage,
    0
  );
  // Overall average
  const overallProgress = totalSubchapters > 0 ? sumOfPercentages / totalSubchapters : 0;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Aggregator Progress</h3>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Subchapter</th>
              <th style={styles.th}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {subchapterProgressArray.map((item) => (
              <tr key={item.subChId}>
                <td style={styles.td}>{item.subChId}</td>
                <td style={styles.td}>
                  <div style={styles.progressBarContainer}>
                    {/* The background bar */}
                    <div style={styles.progressBarTrack}>
                      {/* The filled portion */}
                      <div
                        style={{
                          ...styles.progressBarFill,
                          width: `${item.progressPercentage}%`,
                        }}
                      />
                    </div>
                    <span style={styles.progressLabel}>
                      {item.progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Overall progress */}
      <div style={styles.overallContainer}>
        <h4 style={{ margin: 0 }}>Overall Progress</h4>
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBarTrack}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${overallProgress}%`,
              }}
            />
          </div>
          <span style={styles.progressLabel}>{overallProgress.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// --------------- STYLES ---------------
const styles = {
  container: {
    marginTop: "1rem",
    padding: "8px",
  },
  title: {
    margin: 0,
    paddingBottom: "4px",
    borderBottom: "1px solid #ccc",
  },
  tableContainer: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "8px",
  },
  table: {
    borderCollapse: "collapse",
    minWidth: "600px",
    width: "100%",
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
  progressBarTrack: {
    flex: 1,
    height: "16px",
    backgroundColor: "#ddd",
    borderRadius: "8px",
    position: "relative",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4caf50", // green fill
    borderRadius: "8px 0 0 8px",
  },
  progressLabel: {
    minWidth: "50px",
    textAlign: "right",
    fontWeight: "bold",
  },
  overallContainer: {
    marginTop: "12px",
  },
};