// HomeSidebar.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * HomeSidebar - Matching the style of OverviewSidebar
 *
 * 4-level nested plan:
 *   1) Session (Day X) – expanded by default
 *   2) Book (Book: X) – expanded by default
 *   3) Chapter (Chapter: X) – expanded by default
 *   4) Sub-Chapter (Sub-Chapter: X) – collapsed by default
 *
 * Props:
 *  - planId: string (the Firestore doc ID)
 *  - backendURL: string (default "http://localhost:3001")
 *  - onHomeSelect: function(activity) => void
 *  - onOpenPlayer: function(planId, activity, fetchUrl) => void
 *  - colorScheme: optional styling overrides to unify with OverviewSidebar
 */
export default function HomeSidebar({
  planId,
  backendURL = "http://localhost:3001",
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  colorScheme = {},
}) {
  const [plan, setPlan] = useState(null);

  // Expand/collapse states
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]);

  // 1) Fetch the plan
  useEffect(() => {
    if (!planId) return;
    async function fetchPlanData() {
      try {
        const res = await axios.get(`${backendURL}/api/adaptive-plan`, {
          params: { planId },
        });
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          console.error("No planDoc in response:", res.data);
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      }
    }
    fetchPlanData();
  }, [planId, backendURL]);

  // 2) Auto-expand sessions/books/chapters. Sub-chapters remain collapsed.
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
    // sub-chapters remain collapsed
  }, [plan]);

  // ---------------- Theming & Styles (matching OverviewSidebar) ----------------
  const containerStyle = {
    width: "300px",
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFFFFF",
    overflowY: "auto",
    padding: "20px",
    borderRight: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    fontSize: "0.85rem",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1rem",
    color: colorScheme.heading || "#BB86FC", // same accent as Overview
  };

  // Shared header tile style for sessions/books/chapters/sub-chapters
  const baseHeaderStyle = {
    width: "100%",
    cursor: "pointer",
    padding: "8px 10px",
    marginBottom: "6px",
    backgroundColor: "#2F2F2F",
    border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    borderRadius: "4px",
    color: colorScheme.textColor || "#FFFFFF",
    transition: "background-color 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  // Activity row style
  const activityStyle = {
    width: "100%",
    marginBottom: "6px",
    padding: "6px 10px",
    borderRadius: "4px",
    border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    backgroundColor: "#3D3D3D",
    color: colorScheme.textColor || "#FFFFFF",
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

  // ---------------- Render / Return ----------------
  if (!plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Home Plan</h2>
        <div>Loading plan data...</div>
      </div>
    );
  }

  const { sessions = [] } = plan;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Home Plan</h2>
      {sessions.map((sess) => {
        const { sessionLabel, activities = [] } = sess;
        const sessionKey = `S-${sessionLabel}`;
        const isSessionExpanded = expandedSessions.includes(sessionKey);
        const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
        const sessionText = `Day ${sessionLabel} — ${totalTime} min`;

        return (
          <div key={sessionLabel}>
            {/* Session header */}
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

            {/* Books inside this session if expanded */}
            {isSessionExpanded && renderBooksInSession(activities, sessionLabel)}
          </div>
        );
      })}
    </div>
  );

  // --------------- TOGGLE HANDLERS ---------------
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

  // -------------- 1) Group Activities by Book --------------
  function renderBooksInSession(activities, sessionLabel) {
    const bookMap = new Map();
    for (const act of activities) {
      const bKey = act.bookId;
      if (!bookMap.has(bKey)) {
        bookMap.set(bKey, {
          bookId: bKey,
          bookName: act.bookName || `Book (${bKey})`,
          items: [],
        });
      }
      bookMap.get(bKey).items.push(act);
    }

    const bookGroups = Array.from(bookMap.values());
    return bookGroups.map((bk) => {
      const bookKey = `S-${sessionLabel}-B-${bk.bookId}`;
      const isBookExpanded = expandedBooks.includes(bookKey);
      const totalBookTime = bk.items.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const bookText = `Book: ${bk.bookName} — ${totalBookTime} min`;

      return (
        <div key={bookKey}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleBook(bookKey)}
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

          {isBookExpanded && renderChaptersInBook(bk.items, sessionLabel, bk.bookId)}
        </div>
      );
    });
  }

  // -------------- 2) Group Activities by Chapter --------------
  function renderChaptersInBook(activities, sessionLabel, bookId) {
    const chapterMap = new Map();
    for (const act of activities) {
      const cKey = act.chapterId;
      if (!chapterMap.has(cKey)) {
        chapterMap.set(cKey, {
          chapterId: cKey,
          chapterName: act.chapterName || `Chapter (${cKey})`,
          items: [],
        });
      }
      chapterMap.get(cKey).items.push(act);
    }

    const chapterGroups = Array.from(chapterMap.values());
    return chapterGroups.map((ch) => {
      const chapterKey = `S-${sessionLabel}-B-${bookId}-C-${ch.chapterId}`;
      const isChapterExpanded = expandedChapters.includes(chapterKey);
      const totalChapterTime = ch.items.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const chapterText = `Chapter: ${ch.chapterName} — ${totalChapterTime} min`;

      return (
        <div key={chapterKey}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleChapter(chapterKey)}
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
            renderSubChapters(ch.items, sessionLabel, bookId, ch.chapterId)}
        </div>
      );
    });
  }

  // -------------- 3) Group Activities by Sub-Chapter --------------
  function renderSubChapters(activities, sessionLabel, bookId, chapterId) {
    const subMap = new Map();
    for (const act of activities) {
      const sKey = act.subChapterId;
      if (!subMap.has(sKey)) {
        subMap.set(sKey, {
          subChapterId: sKey,
          subChapterName: act.subChapterName || `Sub-Chapter (${sKey})`,
          items: [],
        });
      }
      subMap.get(sKey).items.push(act);
    }

    const subGroups = Array.from(subMap.values());
    return subGroups.map((sb) => {
      const subKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}-SUB-${sb.subChapterId}`;
      const isSubExpanded = expandedSubs.includes(subKey);
      const totalSubTime = sb.items.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const subText = `Sub-Chapter: ${sb.subChapterName} — ${totalSubTime} min`;

      return (
        <div key={subKey}>
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
              {sb.items.map((act, idx) => renderActivity(act, idx))}
            </div>
          )}
        </div>
      );
    });
  }

  // -------------- 4) Render Each Activity --------------
  function renderActivity(act, idx) {
    const key = `activity-${act.bookId}-${act.chapterId}-${act.subChapterId}-${idx}`;
    const label = `${act.type}: ${act.subChapterName || act.subChapterId} (${
      act.timeNeeded || 0
    } min)`;

    return (
      <div
        key={key}
        style={activityStyle}
        title={label}
        onClick={() => onHomeSelect(act)} // click anywhere => onHomeSelect
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            ...truncatedTextStyle,
          }}
        >
          <span style={{ fontWeight: "bold", marginRight: "6px" }}>{act.type}:</span>
          <span>{act.subChapterName || act.subChapterId}</span>
          <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>
            {act.timeNeeded || 0} min
          </span>
        </div>

        {/* Right side: "Play" button => cinematic modal */}
        <button
          style={{
            backgroundColor: colorScheme.heading || "#BB86FC",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation(); // don’t also trigger onHomeSelect
            onOpenPlayer(planId, act, "/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}