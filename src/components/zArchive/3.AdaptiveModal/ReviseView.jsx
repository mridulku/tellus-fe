// ReviseView.jsx

import React from "react";

/**
 * ReviseView
 *
 * This component takes the full available space
 * in the main content area. It displays a dark background,
 * a header, the subchapter ID, and some sample "flashcards."
 *
 * You can iterate further by adding real flashcard data,
 * flipping effects, etc.
 */
export default function ReviseView({ subChapterId }) {
  return (
    <div style={outerContainer}>
      {/* Header area */}
      <div style={headerSection}>
        <h2 style={{ margin: 0 }}>Revision / Flashcards</h2>
        <p style={{ marginTop: "4px", fontSize: "0.9rem" }}>
          Subchapter ID: <strong>{subChapterId || "N/A"}</strong>
        </p>
      </div>

      {/* Flashcards grid */}
      <div style={flashcardGrid}>
        {/* Sample card #1 */}
        <div style={flashcardStyle}>
          <div style={flashcardTitle}>Term: “Lorem #1”</div>
          <div style={flashcardContent}>Definition or Explanation #1</div>
        </div>

        {/* Sample card #2 */}
        <div style={flashcardStyle}>
          <div style={flashcardTitle}>Term: “Lorem #2”</div>
          <div style={flashcardContent}>Definition or Explanation #2</div>
        </div>

        {/* Sample card #3 */}
        <div style={flashcardStyle}>
          <div style={flashcardTitle}>Term: “Lorem #3”</div>
          <div style={flashcardContent}>Definition or Explanation #3</div>
        </div>

        {/* ...Add more as needed... */}
      </div>
    </div>
  );
}

// ------------------- Styles -------------------

const outerContainer = {
  // Fill the entire parent space
  width: "100%",
  height: "100%",
  backgroundColor: "#000",    // Black background
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  padding: "20px",
};

const headerSection = {
  marginBottom: "16px",
};

const flashcardGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  // If you want them to wrap differently, or to scroll, adjust these
  // For a strictly vertical list, you can omit flexWrap
};

const flashcardStyle = {
  backgroundColor: "#222",
  borderRadius: "6px",
  padding: "12px",
  minWidth: "160px",
  maxWidth: "200px",
  flex: "0 0 auto",    // or "1 1 200px" if you want them to auto-size
};

const flashcardTitle = {
  fontWeight: "bold",
  marginBottom: "8px",
};

const flashcardContent = {
  fontSize: "0.9rem",
  lineHeight: "1.4",
};