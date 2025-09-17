import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

/**
 * PlanLog
 * -------
 * Fetches the plan doc from "adaptive_demo" by planId and
 * displays the "logDetails" field so the user can see
 * how the plan was generated step-by-step.
 */
export default function PlanLog({
  db,
  userId = "",
  planId = "",
  readingStats = {},
  bookId = "",
}) {
  const [logDetails, setLogDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchPlanLog() {
      if (!planId) {
        setErrorMsg("No planId provided.");
        setLoading(false);
        return;
      }

      try {
        // 1) Reference the plan doc in 'adaptive_demo'
        const planDocRef = doc(db, "adaptive_demo", planId);
        // 2) Get the doc snapshot
        const planSnap = await getDoc(planDocRef);
        // 3) Check existence and parse 'logDetails'
        if (!planSnap.exists()) {
          setErrorMsg(`No plan found in "adaptive_demo" for planId: ${planId}`);
        } else {
          const data = planSnap.data();
          if (Array.isArray(data.logDetails)) {
            setLogDetails(data.logDetails);
          } else {
            setErrorMsg("No 'logDetails' field present in this plan doc.");
          }
        }
      } catch (err) {
        console.error("Error fetching plan log:", err);
        setErrorMsg("Error fetching plan log details.");
      }

      setLoading(false);
    }

    fetchPlanLog();
  }, [db, planId]);

  if (loading) {
    return <p style={styles.infoText}>Loading plan log details...</p>;
  }

  if (errorMsg) {
    return <p style={{ ...styles.infoText, color: "red" }}>{errorMsg}</p>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Plan Log</h3>
      {logDetails.length === 0 ? (
        <p style={styles.infoText}>No log details found.</p>
      ) : (
        <ol>
          {logDetails.map((logItem, index) => (
            <li key={index} style={styles.logItem}>
              {logItem}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// -------------------- Styles --------------------
const styles = {
  container: {
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "1rem",
    marginTop: "1rem",
  },
  header: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.15rem",
    fontWeight: "bold",
    borderBottom: "1px solid #ccc",
    paddingBottom: "4px",
  },
  infoText: {
    fontSize: "0.95rem",
    margin: "0.4rem 0",
  },
  logItem: {
    fontSize: "0.9rem",
    margin: "0.3rem 0",
    lineHeight: "1.4",
  },
};;