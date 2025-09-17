// MainContent.jsx

import React from "react";
import ReadingView from "./ReadingView";
import QuizView from "./QuizView";
import ReviseView from "./ReviseView";

/**
 * MainContent
 * -----------
 * Renders the right-side component based on the selectedActivity's type
 * (READ, QUIZ, REVISE, etc.).
 *
 * Props:
 *   - currentItem: object with { type, subChapterId, level?, ... }
 *        (You may have more fields like .bookId, .chapterId, etc.)
 *   - userId: optional user ID if needed
 *   - backendURL: your API base
 *   - onRefreshData: callback after certain actions
 */
export default function MainContent({
  currentItem,
  userId,
  level,
  backendURL,
  onRefreshData,
}) {
  // 1) If no activity selected, show a prompt
  if (!currentItem) {
    return (
      <div style={placeholderStyle}>
        <h2>Welcome, {userId || "User"}!</h2>
        <p>Select an activity from the left panel.</p>
      </div>
    );
  }

  // 2) We expect something like { type, subChapterId, ... }
  //    "type" is how we decide which view to render.
  const { type, subChapterId } = currentItem;
  const activityType = type ? type.toLowerCase() : "";

  switch (activityType) {
    case "read":
    case "reading":
      return (
        <ReadingView
          subChapterId={subChapterId}
          userId={userId}
          backendURL={backendURL}
          onRefreshData={onRefreshData}
          level={currentItem.level}
        />
      );

    case "quiz":
      // You might pass subChapterId or quiz data to QuizView
      return (
        <QuizView
          subChapterId={currentItem.subChapterId}
          userId={userId}
          level={currentItem.level}
        />
      );

    case "revise":
    case "revision":
      return (
        <ReviseView
          subChapterId={subChapterId}
          userId={userId}
          level={currentItem.level}
        />
      );

    default:
      // 3) Fallback for unknown types
      return (
        <div style={placeholderStyle}>
          <h2>Unknown Activity: {type}</h2>
          <p>Subchapter ID: {subChapterId || "N/A"}</p>
          <p>This is a generic fallback component.</p>
        </div>
      );
  }
}

// ~~~~~~~~ STYLES ~~~~~~~~
const placeholderStyle = {
  padding: "20px",
  color: "#fff",
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "8px",
};