import React from "react";

export default function SummariesDrawer({ onClose }) {
  const drawerWidth = 400;
  const overlayStyle = {
    position: "fixed",
    top: 0,
    right: 0,
    width: `${drawerWidth}px`,
    height: "100%",
    background: "#fff",
    color: "#000",
    zIndex: 999,
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
  };
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #ccc",
  };
  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
  };
  const contentStyle = {
    padding: "10px",
    overflowY: "auto",
    height: "calc(100% - 60px)",
  };

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <h3>Summaries</h3>
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>
      </div>
      <div style={contentStyle}>
        <p>Here you can show summary prompts, AI-generated short paragraphs, etc.</p>
        <p>(Implement your advanced summary wizard here if you like.)</p>
      </div>
    </div>
  );
}