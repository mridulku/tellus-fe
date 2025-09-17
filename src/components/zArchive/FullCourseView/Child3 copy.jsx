import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Child3 (HomeSidebar logic)
 *
 * Similar to Child2 but uses a "single plan" concept. Now it will:
 * 1) Accept `userId` and `bookId` from the parent.
 * 2) Whenever `bookId` changes (and we have a userId), fetch plan IDs from e.g. `/api/home-plan-id`.
 * 3) Pick the first plan ID returned, set it as `planId`, and fetch the plan doc.
 * 4) Render that single plan (sessions -> books -> chapters -> subs).
 *
 * Props:
 *  - userId (string)
 *  - bookId (string)
 *  - planId (string) (still supported if you want to manually override)
 *  - backendURL (string) (the base for your API calls, default is something like "http://localhost:3001")
 *  - onHomeSelect(activity) => void
 *  - onOpenPlayer(planId, activity, fetchUrl) => void
 *  - colorScheme (object) => styling
 */

export default function Child3({
  userId = null,
  bookId = "",
  planId: propPlanId,  // If a parent wants to forcibly specify a planId
  backendURL = import.meta.env.VITE_BACKEND_URL,
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  colorScheme = {},
}) {
  // --------------------------------------------------------------------
  // 1) Local states
  // --------------------------------------------------------------------
  // The planId we are currently displaying
  const [planId, setPlanId] = useState(propPlanId || "");
  // The actual plan document (with sessions, etc.)
  const [plan, setPlan] = useState(null);

  // Expand/collapse states
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]);

  // --------------------------------------------------------------------
  // 2) If propPlanId changes, update our local planId
  // --------------------------------------------------------------------
  useEffect(() => {
    setPlanId(propPlanId || "");
  }, [propPlanId]);

  // --------------------------------------------------------------------
  // 3) Whenever bookId changes, automatically fetch plan IDs & pick first
  //    from e.g. /api/home-plan-id
  // --------------------------------------------------------------------
  useEffect(() => {
    // If user or book is missing, clear everything
    if (!userId || !bookId) {
      setPlanId("");
      setPlan(null);
      return;
    }

    async function fetchPlanIdsForBook() {
      try {
        // Example: /api/home-plan-id?userId=xxx&bookId=yyy
        const url = `${backendURL}/api/home-plan-id`;
        const res = await axios.get(url, {
          params: { userId, bookId },
        });

        if (res.data && res.data.planIds && res.data.planIds.length > 0) {
          // Just pick the *first* plan ID
          setPlanId(res.data.planIds[0]);
        } else {
          console.warn("[Child3] No planIds found for user/book =>", userId, bookId);
          setPlanId("");
          setPlan(null);
        }
      } catch (err) {
        console.error("[Child3] Error fetching plan IDs =>", err);
        setPlanId("");
        setPlan(null);
      }
    }

    fetchPlanIdsForBook();
  }, [userId, bookId, backendURL]);

  // --------------------------------------------------------------------
  // 4) Whenever planId changes, fetch the plan doc from /api/adaptive-plan?planId=...
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!planId) {
      // If we have no planId to display, clear the plan
      setPlan(null);
      return;
    }

    async function fetchSinglePlan() {
      try {
        const url = `${backendURL}/api/adaptive-plan`;
        const res = await axios.get(url, {
          params: { planId },
        });

        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          console.warn("[Child3] No planDoc in response =>", res.data);
          setPlan(null);
        }
      } catch (err) {
        console.error("[Child3] Error fetching plan =>", err);
        setPlan(null);
      }
    }

    fetchSinglePlan();
  }, [planId, backendURL]);

  // --------------------------------------------------------------------
  // 5) Auto-expand sessions/books/chapters whenever "plan" changes
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!plan) return;

    const { sessions = [] } = plan;
    const sKeys = [];
    const bKeys = [];
    const cKeys = [];

    for (const sess of sessions) {
      const sKey = `S-${sess.sessionLabel}`;
      sKeys.push(sKey);

      // group by book
      const bookMap = new Map();
      for (const act of sess.activities || []) {
        if (!bookMap.has(act.bookId)) {
          bookMap.set(act.bookId, []);
        }
        bookMap.get(act.bookId).push(act);
      }

      for (const [bId, bActs] of bookMap.entries()) {
        const bKey = `S-${sess.sessionLabel}-B-${bId}`;
        bKeys.push(bKey);

        // group by chapter
        const chapterMap = new Map();
        for (const a of bActs) {
          if (!chapterMap.has(a.chapterId)) {
            chapterMap.set(a.chapterId, []);
          }
          chapterMap.get(a.chapterId).push(a);
        }
        for (const cId of chapterMap.keys()) {
          const cKey = `S-${sess.sessionLabel}-B-${bId}-C-${cId}`;
          cKeys.push(cKey);
        }
      }
    }

    setExpandedSessions(sKeys);
    setExpandedBooks(bKeys);
    setExpandedChapters(cKeys);
    setExpandedSubs([]);
  }, [plan]);

  // --------------------------------------------------------------------
  // 6) Styles (unchanged from your snippet)
  // --------------------------------------------------------------------
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFFFFF",
    padding: "20px",
    borderRight: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    overflowY: "auto",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1rem",
    color: colorScheme.heading || "#BB86FC",
  };

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

  // --------------------------------------------------------------------
  // 7) Render
  // --------------------------------------------------------------------
  // If we have no planId and no plan => likely no doc or user/book
  if (!planId && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Home Plan</h2>
        <p>
          No plan selected (bookId="{bookId}") or data not found. 
          <br />
          Try selecting a book in Child1.
        </p>
      </div>
    );
  }

  // If we have a planId but plan is still loading => show "Loading..."
  if (planId && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Home Plan</h2>
        <p>Loading plan data for planId="{planId}"...</p>
      </div>
    );
  }

  // If plan is loaded
  if (plan) {
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
              <div
                style={baseHeaderStyle}
                onClick={() => toggleSession(sessionKey)}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#505050")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2F2F2F")}
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
  }

  // Fallback
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Home Plan</h2>
      <p>No plan available.</p>
    </div>
  );

  // --------------------------------------------------------------------
  // Toggle Handlers
  // --------------------------------------------------------------------
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

  // --------------------------------------------------------------------
  // Render Helpers
  // --------------------------------------------------------------------
  function renderBooksInSession(activities, sessionLabel) {
    const bookMap = new Map();
    for (const act of activities) {
      if (!bookMap.has(act.bookId)) {
        bookMap.set(act.bookId, []);
      }
      bookMap.get(act.bookId).push(act);
    }

    return Array.from(bookMap.entries()).map(([bId, bActs]) => {
      const bKey = `S-${sessionLabel}-B-${bId}`;
      const isBookExpanded = expandedBooks.includes(bKey);

      const totalBookTime = bActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const bookName = bActs[0]?.bookName || `Book (${bId})`;
      const bookText = `Book: ${bookName} — ${totalBookTime} min`;

      return (
        <div key={bId} style={{ marginLeft: "1rem" }}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleBook(bKey)}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#505050")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2F2F2F")}
            title={bookText}
          >
            <span style={truncatedTextStyle}>
              {isBookExpanded ? "▾" : "▸"} {bookText}
            </span>
          </div>

          {isBookExpanded && renderChaptersInBook(bActs, sessionLabel, bId)}
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

    return Array.from(chapterMap.entries()).map(([cId, cActs]) => {
      const cKey = `S-${sessionLabel}-B-${bookId}-C-${cId}`;
      const isChapterExpanded = expandedChapters.includes(cKey);

      const totalChapterTime = cActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const chapterName = cActs[0]?.chapterName || `Chapter (${cId})`;
      const chapterText = `Chapter: ${chapterName} — ${totalChapterTime} min`;

      return (
        <div key={cId} style={{ marginLeft: "1.5rem" }}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleChapter(cKey)}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#505050")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2F2F2F")}
            title={chapterText}
          >
            <span style={truncatedTextStyle}>
              {isChapterExpanded ? "▾" : "▸"} {chapterText}
            </span>
          </div>

          {isChapterExpanded && renderSubChapters(cActs, sessionLabel, bookId, cId)}
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
        <div key={subId} style={{ marginLeft: "2rem" }}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleSub(subKey)}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#505050")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2F2F2F")}
            title={subText}
          >
            <span style={truncatedTextStyle}>
              {isSubExpanded ? "▾" : "▸"} {subText}
            </span>
          </div>

          {isSubExpanded && (
            <div style={{ marginLeft: "2.5rem" }}>
              {subActs.map((act, idx) => renderActivity(act, idx))}
            </div>
          )}
        </div>
      );
    });
  }

  function renderActivity(act, idx) {
    const key = `activity-${act.bookId}-${act.chapterId}-${act.subChapterId}-${idx}`;
    const label = `${act.type}: ${act.subChapterName || act.subChapterId} (${act.timeNeeded || 0} min)`;

    return (
      <div key={key} style={activityStyle} title={label}>
        {/* onHomeSelect => click the row */}
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            ...truncatedTextStyle,
          }}
          onClick={() => onHomeSelect(act)}
        >
          <span style={{ fontWeight: "bold", marginRight: "6px" }}>{act.type}:</span>
          <span>{act.subChapterName || act.subChapterId}</span>
          <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>
            {act.timeNeeded || 0} min
          </span>
        </div>

        {/* "Play" button => cinematic player */}
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
            e.stopPropagation();
            onOpenPlayer(planId, act, "/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}