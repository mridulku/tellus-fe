// File: src/components/NewHome/NewHome.jsx
// (adjust the relative path if your folder structure differs)

import React, { useState } from "react";

// ─── local tools (💡 keep each in   src/components/NewHome/<Name>.jsx) ──
import ConceptMappingView   from "./Support/ConceptMappingView";
import ExamGuidelinesViewer from "./Support/ExamGuidelinesViewer";
import ExamPaperBrowser     from "./Support/ExamPaperBrowser";

/* ------------------------------------------------------------
 * 1. Label map (key → button text) – extend later if you add more
 * ------------------------------------------------------------ */
const TOOLS = {
  concept:  "Concept Mapping",
  guide:    "Exam Guidelines",
  papers:   "Exam Paper Browser",
};

export default function NewHome({ userId }) {
  // default tab
  const [activeTool, setActiveTool] = useState("concept");

  /* ---------------------------  styles  ---------------------- */
  const container = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "24px",
    boxSizing: "border-box",
    color: "#FFF",
  };

  const tabBar = {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
  };

  const tabButton = (selected) => ({
    padding: "8px 16px",
    fontWeight: "bold",
    borderRadius: 6,
    border: "1px solid #444",
    cursor: "pointer",
    background: selected ? "#BB86FC" : "transparent",
    color: selected ? "#000" : "#FFF",
    transition: "background 0.2s, color 0.2s",
  });

  const toolArea = {
    flex: 1,
    overflow: "auto",
    border: "1px solid #333",
    borderRadius: 8,
    padding: "20px",
  };
  /* ----------------------------------------------------------- */

  /* --------------------  tab → component map  ---------------- */
  function renderTool() {
    switch (activeTool) {
      case "concept":
        return <ConceptMappingView   userId={userId} />;
      case "guide":
        return <ExamGuidelinesViewer userId={userId} />;
      case "papers":
        return <ExamPaperBrowser     userId={userId} />;
      default:
        return null;
    }
  }

  /* ----------------------------  UI  ------------------------- */
  return (
    <div style={container}>
      {/* top tab bar */}
      <div style={tabBar}>
        {Object.entries(TOOLS).map(([key, label]) => (
          <button
            key={key}
            style={tabButton(activeTool === key)}
            onClick={() => setActiveTool(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* viewport */}
      <div style={toolArea}>{renderTool()}</div>
    </div>
  );
}