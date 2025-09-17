// File: VerticalTabWithRevisionDemo.jsx
import React, { useState } from "react";

/**
 * A demo that showcases a left-side vertical "tab" bar
 * and a main area that displays either:
 *  - The "Activity" (Revision card)
 *  - The "History" panel (timeline, etc.)
 *
 * The styling is reminiscent of your screenshot: 
 * black background, dark card, title with a clock, etc.
 */
export default function StageManagerPlayground() {
  const [activeTab, setActiveTab] = useState("activity");

  return (
    <div style={styles.pageContainer}>
      {/* LEFT VERTICAL TAB BAR */}
      <div style={styles.leftTabBar}>
        <button
          style={activeTab === "activity" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
        <button
          style={activeTab === "history" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainArea}>
        {activeTab === "activity" && <RevisionCard />}
        {activeTab === "history" && <HistoryPanel />}
      </div>
    </div>
  );
}

/**
 * RevisionCard
 * ------------
 * Mimics the style from your screenshot: 
 * Title bar with "Revision" + a clock, 
 * dark card body with revision content.
 */
function RevisionCard() {
  return (
    <div style={styles.revisionCard}>
      {/* HEADER */}
      <div style={styles.cardHeader}>
        <h3 style={{ margin: 0 }}>Revision</h3>
        <div style={styles.clockWrapper}>
          <span style={styles.clockIcon}>🕒</span>
          6:17
        </div>
      </div>

      {/* BODY */}
      <div style={styles.cardBody}>
        <p style={{ color: "lightgreen" }}>Revision content generated.</p>

        <h4>Revision Focus</h4>
        <div style={styles.contentBlock}>
          <h5>Academic Tone</h5>
          <ul>
            <li>Focus on maintaining a formal and objective tone in academic writing.</li>
          </ul>
        </div>

        <div style={styles.contentBlock}>
          <h5>Reading Skills Tested</h5>
          <ul>
            <li>
              Ensure comprehension of complex texts, identifying main ideas, supporting details,
              and author's purpose.
            </li>
          </ul>
        </div>

        <div style={styles.contentBlock}>
          <h5>Timing Importance</h5>
          <ul>
            <li>Practice time management to answer all questions within the allotted time frame.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * HistoryPanel
 * ------------
 * A placeholder panel to mimic the timeline or concept breakdown.
 * In your actual code, you'd show the attempt history, timeline, concept stats, etc.
 */
function HistoryPanel() {
  return (
    <div style={styles.historyPanel}>
      <h3>History & Performance</h3>
      <p>This is where you'd show your timeline, attempts, concept breakdown, etc.</p>
      <ul style={{ color: "#fff" }}>
        <li>Q1 (60%) &rarr; Revision #1 &rarr; Q2 (95%)</li>
        <li>Concept mastery: 2 Pass, 1 Fail</li>
      </ul>
    </div>
  );
}

// ------------------------ STYLES ------------------------
const styles = {
  pageContainer: {
    display: "flex",
    width: "100%",
    height: "100vh", // or whatever container size
    backgroundColor: "#000", // black background to match your screenshot
    color: "#fff",
    fontFamily: "Arial, sans-serif",
  },
  leftTabBar: {
    width: "200px",
    backgroundColor: "#111",
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    boxSizing: "border-box",
    borderRight: "1px solid #333",
  },
  tabButton: {
    backgroundColor: "#222",
    color: "#ccc",
    border: "none",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "8px",
    cursor: "pointer",
    textAlign: "left",
  },
  tabButtonActive: {
    backgroundColor: "#555",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "8px",
    cursor: "pointer",
    textAlign: "left",
  },
  mainArea: {
    flex: 1,
    padding: "16px",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  revisionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: "8px",
    border: "1px solid #333",
    overflow: "hidden",
    maxWidth: "600px",
    margin: "0 auto",
  },
  cardHeader: {
    backgroundColor: "#2a2a2a",
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #333",
  },
  clockWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#333",
    color: "#ddd",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  clockIcon: {
    fontSize: "1rem",
  },
  cardBody: {
    padding: "16px",
    color: "#ddd",
  },
  contentBlock: {
    marginTop: "1rem",
  },
  historyPanel: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "16px",
    maxWidth: "600px",
    margin: "0 auto",
  },
};