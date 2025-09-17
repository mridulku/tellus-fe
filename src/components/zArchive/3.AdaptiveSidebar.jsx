import React, { useEffect, useState } from "react";
import axios from "axios";

// 1) We'll define our base URL for the Express API
const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/**
 * AdaptivePlanSidebar
 *  - Fetches a plan from the endpoint: GET /api/adaptive-plan?planId=<planId>
 *  - Renders sessions + activities with basic styling
 */
function AdaptiveSidebar({
  planId,      // Firestore doc ID or unique identifier for the plan
  booksData,   // Optional: existing subchapter data to map subChapterIds to names
}) {
  const [plan, setPlan] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState([]);

  // 2) Fetch the plan from Express-based backend
  useEffect(() => {
    if (!planId) return;

    async function fetchPlan() {
      try {
        // Example: GET /api/adaptive-plan?planId=<planId>
        const res = await axios.get(`${backendURL}/api/adaptive-plan`, {
          params: { planId },
        });
        // The API response should have something like { planDoc: {...} }
        const { planDoc } = res.data;
        setPlan(planDoc);
      } catch (err) {
        console.error("Error fetching plan:", err);
      }
    }

    fetchPlan();
  }, [planId]);

  // 3) Styling
  const containerStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "1.2rem",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: "5px",
    color: "#fff",
  };

  const sessionHeaderStyle = {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "6px",
    transition: "background-color 0.3s",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: "10px",
  };

  // 4) If plan not loaded yet, show a placeholder
  if (!plan) {
    return (
      <div style={containerStyle}>
        <div style={headingStyle}>Adaptive Plan</div>
        <div style={{ color: "#fff" }}>Loading plan data...</div>
      </div>
    );
  }

  // 5) Destructure sessions from plan
  const { sessions = [] } = plan;

  // 6) Render each session (day)
  return (
    <div style={containerStyle}>
      <div style={headingStyle}>Adaptive Plan</div>
      {sessions.map((session) => {
        const { sessionLabel, activities } = session;
        const isExpanded = expandedSessions.includes(sessionLabel);

        // Calculate total time for the day
        const totalTime = activities.reduce((acc, act) => acc + (act.timeNeeded || 0), 0);

        return (
          <div key={sessionLabel}>
            {/* Session Header (click to expand/collapse) */}
            <div
              style={sessionHeaderStyle}
              onClick={() => toggleSession(sessionLabel)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
              }}
            >
              <span style={{ marginRight: "8px" }}>{isExpanded ? "-" : "+"}</span>
              Day {sessionLabel} — Total: {totalTime} min
            </div>

            {/* If expanded, render activities */}
            {isExpanded && renderSessionActivities(activities)}
          </div>
        );
      })}
    </div>
  );

  // ---------- Helpers ----------
  function toggleSession(label) {
    setExpandedSessions((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  function renderSessionActivities(activities) {
    return activities.map((activity, idx) => {
      const { subChapterId, type, timeNeeded } = activity;

      // If you have "booksData" containing subchapter info, find the name
      const subChapterName = findSubChapterName(subChapterId, booksData) || "Unknown Subchapter";

      const styleByType = getActivityStyle(type);

      return (
        <div
          key={`${subChapterId}-${type}-${idx}`}
          style={{
            marginLeft: "20px",
            marginBottom: "4px",
            padding: "6px",
            borderRadius: "4px",
            backgroundColor: styleByType.bgColor,
            color: "#000",
          }}
        >
          {/* e.g. "READ: Introduction (5 min)" */}
          <strong>{type}</strong>: {subChapterName} ({timeNeeded || 0} min)
        </div>
      );
    });
  }
}

/**
 * Lookup the subchapter name from booksData, if you want to display a friendly name.
 */
function findSubChapterName(subChapterId, booksData) {
  if (!booksData) return null;

  for (const book of booksData) {
    if (!book.chapters) continue;
    for (const chapter of book.chapters) {
      if (!chapter.subChapters) continue;
      for (const sc of chapter.subChapters) {
        if (sc.subChapterId === subChapterId) {
          return sc.subChapterName;
        }
      }
    }
  }
  return null;
}

/**
 * Basic style logic for each activity type.
 */
function getActivityStyle(type) {
  switch (type) {
    case "READ":
      return { bgColor: "lightblue" };
    case "QUIZ":
      return { bgColor: "lightgreen" };
    case "REVISE":
      return { bgColor: "khaki" };
    default:
      return { bgColor: "#eee" };
  }
}

export default AdaptiveSidebar;