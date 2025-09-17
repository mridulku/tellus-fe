// src/components/DetailedBookViewer/1.OverviewSidebar.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * OverviewSidebar
 *
 * 4-level nested plan (similar to HomeSidebar):
 *   1) Session (Day X) — expanded by default
 *   2) Book (Book: X) — expanded by default
 *   3) Chapter (Chapter: X) — expanded by default
 *   4) Sub-Chapter (Sub-Chapter: X) — collapsed by default
 *
 * Props:
 *  - planIds: array of strings (the Firestore doc IDs) - can be 1 or many
 *  - onOverviewSelect: function(activity) => void
 *  - onOpenPlayer: function(planId, activity, fetchUrl) => void
 *  - colorScheme: optional styling overrides { panelBg, textColor, borderColor, heading }
 */
export default function OverviewSidebar({
  planIds = [],                // <--- Now an array of plan IDs
  onOverviewSelect = () => {},
  onOpenPlayer = () => {},
  colorScheme = {},
}) {
  // Track which planId from the array is currently selected
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // Fetched plan data
  const [plan, setPlan] = useState(null);

  // Expanded/collapsed states
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]); // sub-chapters collapsed by default

  /**
   * Whenever planIds changes, pick the first one as the default selection (if any).
   */
  useEffect(() => {
    if (planIds.length > 0) {
      setSelectedPlanId(planIds[0]);
    } else {
      setSelectedPlanId("");
      setPlan(null);
    }
  }, [planIds]);

  /**
   * Fetch plan data for the currently selected planId.
   */
  useEffect(() => {
    if (!selectedPlanId) {
      setPlan(null);
      return;
    }

    async function fetchPlanData() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`,
          {
            params: { planId: selectedPlanId },
          }
        );
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          console.error("No planDoc in response:", res.data);
          setPlan(null);
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
        setPlan(null);
      }
    }
    fetchPlanData();
  }, [selectedPlanId]);

  /**
   * Once plan is fetched, auto-expand sessions/books/chapters (same as original).
   */
  useEffect(() => {
    if (!plan) return;

    const { sessions = [] } = plan;
    const sessionKeys = [];
    const bookKeys = [];
    const chapterKeys = [];

    for (const sess of sessions) {
      const { sessionLabel, activities = [] } = sess;
      const sKey = `S-${sessionLabel}`;
      sessionKeys.push(sKey);

      // Group by book
      const bookMap = new Map();
      for (const act of activities) {
        if (!bookMap.has(act.bookId)) {
          bookMap.set(act.bookId, []);
        }
        bookMap.get(act.bookId).push(act);
      }

      for (const [bookId, bookActs] of bookMap.entries()) {
        const bKey = `S-${sessionLabel}-B-${bookId}`;
        bookKeys.push(bKey);

        // Group by chapter
        const chapterMap = new Map();
        for (const a of bookActs) {
          if (!chapterMap.has(a.chapterId)) {
            chapterMap.set(a.chapterId, []);
          }
          chapterMap.get(a.chapterId).push(a);
        }
        for (const [chapterId] of chapterMap.entries()) {
          const cKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}`;
          chapterKeys.push(cKey);
        }
      }
    }

    setExpandedSessions(sessionKeys);
    setExpandedBooks(bookKeys);
    setExpandedChapters(chapterKeys);
    setExpandedSubs([]); // reset sub-chapters
  }, [plan]);

  // ---------- THEMING & STYLES (Unchanged) ----------
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFD700",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1rem",
    color: colorScheme.heading || "#FFD700",
  };

  const baseHeaderStyle = {
    width: "100%",
    cursor: "pointer",
    padding: "8px 10px",
    marginBottom: "6px",
    backgroundColor: "#2F2F2F",
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    borderRadius: "4px",
    color: colorScheme.textColor || "#FFD700",
    transition: "background-color 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const activityStyle = {
    width: "100%",
    marginBottom: "6px",
    padding: "6px 10px",
    borderRadius: "4px",
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    backgroundColor: "#3D3D3D",
    color: colorScheme.textColor || "#FFD700",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const truncatedTextStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "180px",
  };

  // ================= MAIN RENDER =================
  // 1) If no Plan IDs at all, just show a message
  if (planIds.length === 0) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Overview Plan</h2>
        <div>No Plan IDs provided.</div>
      </div>
    );
  }

  // 2) If we have planIds, show the dropdown at the top
  //    and handle the loading or "no selection" scenario.
  if (!selectedPlanId) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Overview Plan</h2>

        {/* Dropdown: single or multiple, still displayed */}
        <div>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {planIds.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "1rem" }}>No Plan ID selected.</div>
      </div>
    );
  }

  // 3) If we have a selectedPlanId but no plan data yet => loading
  if (!plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Overview Plan</h2>

        {/* Dropdown at the top, same as above */}
        <div>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {planIds.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "1rem" }}>Loading plan data...</div>
      </div>
    );
  }

  // 4) Finally, we have a plan. Render the dropdown + entire plan structure
  const { sessions = [] } = plan;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Overview Plan</h2>

      {/* Always show the dropdown, even if there's only 1 ID */}
      <div>
        <select
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
        >
          {planIds.map((pid) => (
            <option key={pid} value={pid}>
              {pid}
            </option>
          ))}
        </select>
      </div>

      {/* Then show the sessions/books/chapters as before */}
      {sessions.map((sess) => {
        const { sessionLabel, activities = [] } = sess;
        const sessionKey = `S-${sessionLabel}`;
        const isSessionExpanded = expandedSessions.includes(sessionKey);

        // Calculate total time in this session
        const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
        const sessionText = `Day ${sessionLabel} — ${totalTime} min`;

        return (
          <div key={sessionLabel}>
            <div
              style={baseHeaderStyle}
              onClick={() => toggleSession(sessionKey)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#505050";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#2F2F2F";
              }}
              title={sessionText}
            >
              <span style={truncatedTextStyle}>
                {isSessionExpanded ? "▾" : "▸"} {sessionText}
              </span>
            </div>

            {isSessionExpanded && renderBooksInSession(activities, sessionLabel)}
          </div>
        );
      })}
    </div>
  );

  // ----------------- TOGGLE HANDLERS -----------------
  function toggleSession(key) {
    setExpandedSessions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleBook(key) {
    setExpandedBooks((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleChapter(key) {
    setExpandedChapters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleSub(key) {
    setExpandedSubs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // ----------------- RENDER HELPERS -----------------
  function renderBooksInSession(activities, sessionLabel) {
    const bookMap = new Map();
    for (const act of activities) {
      if (!bookMap.has(act.bookId)) {
        bookMap.set(act.bookId, []);
      }
      bookMap.get(act.bookId).push(act);
    }

    return Array.from(bookMap.entries()).map(([bookId, bookActs]) => {
      const bKey = `S-${sessionLabel}-B-${bookId}`;
      const isBookExpanded = expandedBooks.includes(bKey);

      // Summation of time in this book group
      const totalBookTime = bookActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const bookName = bookActs[0]?.bookName || `Book (${bookId})`;
      const bookText = `Book: ${bookName} — ${totalBookTime} min`;

      return (
        <div key={bookId}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleBook(bKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#505050";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2F2F2F";
            }}
            title={bookText}
          >
            <span style={truncatedTextStyle}>
              {isBookExpanded ? "▾" : "▸"} {bookText}
            </span>
          </div>

          {isBookExpanded && renderChaptersInBook(bookActs, sessionLabel, bookId)}
        </div>
      );
    });
  }

  function renderChaptersInBook(activities, sessionLabel, bookId) {
    const chapterMap = new Map();
    for (const act of activities) {
      if (!chapterMap.has(act.chapterId)) {
        chapterMap.set(act.chapterId, []);
      }
      chapterMap.get(act.chapterId).push(act);
    }

    return Array.from(chapterMap.entries()).map(([chapterId, chapterActs]) => {
      const cKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}`;
      const isChapterExpanded = expandedChapters.includes(cKey);

      const totalChapterTime = chapterActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const chapterName = chapterActs[0]?.chapterName || `Chapter (${chapterId})`;
      const chapterText = `Chapter: ${chapterName} — ${totalChapterTime} min`;

      return (
        <div key={chapterId}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleChapter(cKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#505050";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2F2F2F";
            }}
            title={chapterText}
          >
            <span style={truncatedTextStyle}>
              {isChapterExpanded ? "▾" : "▸"} {chapterText}
            </span>
          </div>

          {isChapterExpanded &&
            renderSubChapters(chapterActs, sessionLabel, bookId, chapterId)}
        </div>
      );
    });
  }

  function renderSubChapters(activities, sessionLabel, bookId, chapterId) {
    const subMap = new Map();
    for (const act of activities) {
      if (!subMap.has(act.subChapterId)) {
        subMap.set(act.subChapterId, []);
      }
      subMap.get(act.subChapterId).push(act);
    }

    return Array.from(subMap.entries()).map(([subId, subActs]) => {
      const subKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}-SUB-${subId}`;
      const isSubExpanded = expandedSubs.includes(subKey);

      const totalSubTime = subActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const subName = subActs[0]?.subChapterName || `Sub-Chapter (${subId})`;
      const subText = `Sub-Chapter: ${subName} — ${totalSubTime} min`;

      return (
        <div key={subId}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleSub(subKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#505050";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2F2F2F";
            }}
            title={subText}
          >
            <span style={truncatedTextStyle}>
              {isSubExpanded ? "▾" : "▸"} {subText}
            </span>
          </div>

          {isSubExpanded && (
            <div>
              {subActs.map((act, idx) => renderActivity(act, idx))}
            </div>
          )}
        </div>
      );
    });
  }

  function renderActivity(act, idx) {
    const key = `activity-${act.bookId}-${act.chapterId}-${act.subChapterId}-${idx}`;
    const label = `${act.type}: ${act.subChapterName || act.subChapterId} (${
      act.timeNeeded || 0
    } min)`;

    return (
      <div key={key} style={activityStyle} title={label}>
        {/* Left side: onOverviewSelect */}
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            ...truncatedTextStyle,
          }}
          onClick={() => onOverviewSelect(act)}
        >
          <span style={{ fontWeight: "bold", marginRight: "6px" }}>{act.type}:</span>
          <span>{act.subChapterName || act.subChapterId}</span>
          <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>
            {act.timeNeeded || 0} min
          </span>
        </div>

        {/* Right side: "Play" button */}
        <button
          style={{
            backgroundColor: colorScheme.heading || "#FFD700",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlayer(selectedPlanId, act, "/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}