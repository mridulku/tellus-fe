// File: PlanView2.jsx
import React, { useState } from "react";
import axios from "axios";

/**
 * parsePlanCreationDate
 * ---------------------
 * Attempts to parse the plan.createdAt from Firestore or string timestamps
 */
function parsePlanCreationDate(createdAt) {
  if (!createdAt) return null;
  let dateObj = null;

  // Firestore Timestamp .toDate()
  if (typeof createdAt.toDate === "function") {
    dateObj = createdAt.toDate();
  } 
  // Firestore Timestamp object
  else if (
    typeof createdAt.seconds === "number" &&
    typeof createdAt.nanoseconds === "number"
  ) {
    dateObj = new Date(createdAt.seconds * 1000);
  } 
  // Another variant
  else if (
    typeof createdAt._seconds === "number" &&
    typeof createdAt._nanoseconds === "number"
  ) {
    dateObj = new Date(createdAt._seconds * 1000);
  } 
  // Already a JS Date
  else if (createdAt instanceof Date) {
    dateObj = createdAt;
  } 
  // Possibly an ISO string
  else if (typeof createdAt === "string") {
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
 * PlanView2
 * ---------
 * - Minimal table showing subChapterName, type, quizStage, aggregator fields, raw JSON
 * - Three buttons => "Defer", "Complete", "Replicate"
 *    - "Defer" => sets completionStatus="deferred"
 *    - "Complete" => sets completionStatus="complete"
 *    - "Replicate" => copies this activity to the next session
 */
export default function PlanView2({ plan, userId = "" }) {
  if (!plan) {
    return <p style={styles.infoText}>No plan data available.</p>;
  }

  // Parse plan meta
  const creationDate = parsePlanCreationDate(plan.createdAt);
  const planId = plan.id || plan.planId || "(No planId)";
  const planName = plan.planName || "(No planName)";
  const sessions = plan.sessions || [];

  // Collapsible state
  const [expandedSessions, setExpandedSessions] = useState([]);
  function toggleSession(label) {
    setExpandedSessions((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  // Expand raw JSON
  const [expandedRawSet, setExpandedRawSet] = useState(new Set());
  function toggleRaw(activityId) {
    setExpandedRawSet((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) newSet.delete(activityId);
      else newSet.add(activityId);
      return newSet;
    });
  }
  function isRawExpanded(activityId) {
    return expandedRawSet.has(activityId);
  }

  /**
   * handleSetCompletionStatus
   * - Shared function for "defer" or "complete"
   */
  async function handleSetCompletionStatus(activityId, newStatus) {
    if (!userId || !planId || !activityId) {
      alert("Missing userId, planId, or activityId!");
      return;
    }

    try {
      // POST /api/setCompletionStatus
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/setCompletionStatus`,{
        userId,
        planId,
        activityId,
        completionStatus: newStatus,
      });
      console.log(`${newStatus} success:`, res.data);

      alert(`Activity marked '${newStatus}' successfully!`);
      // Optionally re-fetch or update local plan data if you want immediate UI update
    } catch (err) {
      console.error(`Error marking activity as '${newStatus}':`, err);
      alert(`Error marking activity as '${newStatus}'. Check console for details.`);
    }
  }

  /**
   * handleReplicate
   * - Calls /api/replicateActivity (same as your older code)
   */
  async function handleReplicate(activityId) {
    if (!userId || !planId || !activityId) {
      alert("Missing userId, planId, or activityId!");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/replicateActivity`,{
        userId,
        planId,
        activityId,
      });
      console.log("Replicate success:", res.data);

      alert("Activity replicated successfully!");
      // Optionally re-fetch or update local plan data
    } catch (err) {
      console.error("Replicate error:", err);
      alert("Error replicating activity. Check console for details.");
    }
  }

  // Render
  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={styles.sectionTitle}>Plan Overview (PlanView2)</h3>

      <p style={styles.infoText}>
        <strong>Plan ID:</strong> {planId}
      </p>
      <p style={styles.infoText}>
        <strong>Plan Name:</strong> {planName}
      </p>
      <p style={styles.infoText}>
        <strong>Created At:</strong>{" "}
        {creationDate ? creationDate.toLocaleString() : "(Unknown)"}
      </p>

      {sessions.length === 0 ? (
        <p style={styles.infoText}>No sessions in the plan.</p>
      ) : (
        sessions.map((sess, index) => {
          const numericLabel = parseInt(sess.sessionLabel, 10) || index + 1;
          const label = sess.sessionLabel || numericLabel.toString();
          const isExpanded = expandedSessions.includes(label);

          return (
            <div key={label} style={styles.sessionContainer}>
              {/* Session header */}
              <div style={styles.sessionHeader} onClick={() => toggleSession(label)}>
                <div style={{ fontWeight: "bold" }}>
                  {isExpanded ? "▾" : "▸"} Day {label}
                </div>
                <div>{(sess.activities || []).length} activities</div>
              </div>

              {/* Session body if expanded */}
              {isExpanded && (
                <div style={styles.sessionContent}>
                  {/* Table header */}
                  <div style={styles.tableHeaderRow}>
                    <div style={{ width: "20%", fontWeight: "bold" }}>Subchapter</div>
                    <div style={{ width: "10%", fontWeight: "bold" }}>Type</div>
                    <div style={{ width: "10%", fontWeight: "bold" }}>Quiz Stage</div>
                    <div style={{ width: "15%", fontWeight: "bold" }}>
                      Aggregator Task
                    </div>
                    <div style={{ width: "15%", fontWeight: "bold" }}>
                      Aggregator Status
                    </div>
                    <div style={{ width: "10%", fontWeight: "bold" }}>Raw</div>
                    {/* ACTIONS => 20% total for 3 buttons */}
                    <div style={{ width: "20%", fontWeight: "bold" }}>Actions</div>
                  </div>

                  {(sess.activities || []).map((act, i) => {
                    const subChapterName = act.subChapterName || "(No name)";
                    const type = act.type || "(No type)";
                    const quizStage = act.quizStage || "—";
                    const aggregatorTask = act.aggregatorTask || "—";
                    const aggregatorStatus = act.aggregatorStatus || "—";
                    const rawExpanded = isRawExpanded(act.activityId);

                    return (
                      <div key={i}>
                        {/* main row */}
                        <div style={styles.tableRow}>
                          <div style={{ width: "20%" }}>{subChapterName}</div>
                          <div style={{ width: "10%" }}>{type}</div>
                          <div style={{ width: "10%" }}>{quizStage}</div>
                          <div style={{ width: "15%" }}>{aggregatorTask}</div>
                          <div style={{ width: "15%" }}>{aggregatorStatus}</div>

                          {/* Raw toggle */}
                          <div style={{ width: "10%", textAlign: "center" }}>
                            <button
                              style={styles.rawBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRaw(act.activityId);
                              }}
                            >
                              {rawExpanded ? "Hide" : "Show"}
                            </button>
                          </div>

                          {/* ACTIONS => Defer, Complete, Replicate */}
                          <div style={{ width: "20%", textAlign: "center" }}>
                            <button
                              style={styles.deferBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCompletionStatus(act.activityId, "deferred");
                              }}
                            >
                              Defer
                            </button>
                            <button
                              style={styles.completeBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCompletionStatus(act.activityId, "complete");
                              }}
                            >
                              Complete
                            </button>
                            <button
                              style={styles.replicateBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReplicate(act.activityId);
                              }}
                            >
                              Replicate
                            </button>
                          </div>
                        </div>

                        {/* show raw if expanded */}
                        {rawExpanded && (
                          <div style={styles.rawRow}>
                            <pre style={styles.rawPre}>
                              {JSON.stringify(act, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

// ------------------- Styles -------------------
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
  rawRow: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ccc",
    padding: "8px",
  },
  rawPre: {
    fontSize: "0.85rem",
    lineHeight: 1.4,
    backgroundColor: "#fff",
    color: "#333",
    padding: "8px",
    margin: 0,
    overflowX: "auto",
  },
  rawBtn: {
    backgroundColor: "#666",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "3px 8px",
  },
  deferBtn: {
    backgroundColor: "#A0A0A0",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "3px 8px",
    marginRight: 4,
  },
  completeBtn: {
    backgroundColor: "#66BB6A", // green
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "3px 8px",
    marginRight: 4,
  },
  replicateBtn: {
    backgroundColor: "#0062cc",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    padding: "3px 8px",
  },
};