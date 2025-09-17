// src/components/Admin/AdminPanel.jsx
import React, { useState } from "react";

// --- local tools -------------------------------------------------
import SliceUploader from "./Support/SliceUploader";
import SliceViewer   from "./Support/SliceViewer";
import BookExplorer   from "./Support/BookExplorer";
import CSVBookUploader from "./Support/CSVBookUploader";
import OnboardingWizard from "./Support/OnboardingWizard";

import ReadingViewDummy from "./Support/ReadingViewDummy";

import AggregatorBootloader from "./Support/AggregatorBootloader";
import AggregatorDebugPanel from "./Support/AggregatorDebugPanel";

import ConceptExtractionPage from "./Support/ConceptExtractionPage";


// Add more admin tools here later and extend the enum ↓
const TOOLS = {
  uploader: "Slice Uploader",
  viewer:   "Slice Viewer",
    explorer: "Book Explorer",
  csv:      "CSV Book Uploader",
  onboarding: "Onboarding Wizard",
  readingviewdummy: "Reading View Dummy", 
  AggregatorBootloader: "Aggregator Bootloader",
  AggregatorDebugPanel: "Aggregator Debug Panel",
  ConceptExtractionPage: "Concept Extraction Page",
};

function AdminPanel({ userId }) {
  // pick a default tool
  const [activeTool, setActiveTool] = useState("uploader");

  /* ---------------------------   styles   ---------------------- */
  const container = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "24px",
    boxSizing: "border-box",
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
  /* ------------------------------------------------------------- */

  // map keys to actual components
  const renderTool = () => {
    switch (activeTool) {
      case "uploader":
        return <SliceUploader userId={userId} />;
      case "viewer":
        return <SliceViewer   userId={userId} />;
    case "explorer":
            return <BookExplorer   userId={userId} />;
            case "csv":
            return <CSVBookUploader   userId={userId} />;
            case "onboarding":
            return <OnboardingWizard   userId={userId} />;
            case "readingviewdummy":
            return <ReadingViewDummy   userId={userId} />;
            case "AggregatorBootloader":
            return <AggregatorBootloader   userId={userId} />;
            case "AggregatorDebugPanel":
            return <AggregatorDebugPanel   userId={userId} />;
            case "ConceptExtractionPage":
            return <ConceptExtractionPage   userId={userId} />;
      default:
        return null;
    }
  };

  return (
    <div style={container}>
      {/* Top tab bar ------------------------------------------------ */}
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

      {/* Tool viewport -------------------------------------------- */}
      <div style={toolArea}>{renderTool()}</div>
    </div>
  );
}

export default AdminPanel;