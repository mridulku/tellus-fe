import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore";

/**
 * AggregatorResultView
 * --------------------
 * - Fetches the aggregator_v2 doc for a given user/plan/book
 * - Renders each subchapter's reading, remember, understand, apply, analyze statuses
 * - ALSO shows nextTask fields + activeStage
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
export default function AggregatorResultView({
  db,
  userId,
  planId,
  bookId,
  aggregatorDocId = "",
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aggregatorResult, setAggregatorResult] = useState(null);

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
        console.error("AggregatorResultView => fetchAggregatorDoc error:", err);
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

  // aggregatorResult => 
  // {
  //   subChId: {
  //     reading,
  //     readingNextTask,
  //     remember,
  //     rememberNextTask,
  //     understand,
  //     understandNextTask,
  //     apply,
  //     applyNextTask,
  //     analyze,
  //     analyzeNextTask,
  //     activeStage
  //   }, ...
  // }

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={styles.title}>Aggregator Result</h3>

      <div style={styles.scrollContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Subchapter ID</th>
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
            {Object.entries(aggregatorResult).map(([subChId, row]) => {
              return (
                <tr key={subChId} style={styles.tr}>
                  <td style={styles.td}>{subChId}</td>
                  <td style={styles.td}>{row.reading}</td>
                  <td style={styles.td}>{row.readingNextTask}</td>
                  <td style={styles.td}>{row.remember}</td>
                  <td style={styles.td}>{row.rememberNextTask}</td>
                  <td style={styles.td}>{row.understand}</td>
                  <td style={styles.td}>{row.understandNextTask}</td>
                  <td style={styles.td}>{row.apply}</td>
                  <td style={styles.td}>{row.applyNextTask}</td>
                  <td style={styles.td}>{row.analyze}</td>
                  <td style={styles.td}>{row.analyzeNextTask}</td>
                  <td style={styles.td}>{row.activeStage}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------
const styles = {
  title: {
    margin: 0,
    padding: 0,
    borderBottom: "1px solid #ccc",
    paddingBottom: "4px",
  },
  scrollContainer: {
    width: "100%",
    overflowX: "auto", // Horizontal scrollbar if columns exceed container width
    border: "1px solid #ccc",
    borderRadius: "4px",
    marginTop: "8px",
  },
  table: {
    borderCollapse: "collapse",
    minWidth: "1200px", // force table to be wide enough to enable scrolling
  },
  th: {
    border: "1px solid #ccc",
    backgroundColor: "#eee",
    padding: "8px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    textAlign: "center",
  },
  tr: {
    borderBottom: "1px solid #ccc",
  },
  td: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
    whiteSpace: "nowrap", // ensures cells don't wrap
  },
};