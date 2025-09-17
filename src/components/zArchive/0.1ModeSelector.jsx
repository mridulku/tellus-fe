// src/components/DetailedBookViewer/ModeSelector.jsx
import React from "react";

function ModeSelector({ viewMode, setViewMode }) {
  const containerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",  // allows wrapping if screen width is small
  };

  const buttonStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: active ? "#FFD700" : "transparent",
    color: active ? "#000" : "#fff",
    transition: "background-color 0.3s",
  });

  return (
    <div style={containerStyle}>
      <button
        style={buttonStyle(viewMode === "overview")}
        onClick={() => setViewMode("overview")}
      >
        Overview
      </button>

      <button
        style={buttonStyle(viewMode === "adaptive")}
        onClick={() => setViewMode("adaptive")}
      >
        Adaptive
      </button>

      <button
        style={buttonStyle(viewMode === "library")}
        onClick={() => setViewMode("library")}
      >
        Library
      </button>

      <button
        style={buttonStyle(viewMode === "profile")}
        onClick={() => setViewMode("profile")}
      >
        Profile
      </button>
    </div>
  );
}

export default ModeSelector;