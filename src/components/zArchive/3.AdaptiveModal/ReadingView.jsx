// ReadingView.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper: Format seconds -> "MM:SS"
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ReadingView
 *
 * Fetches subchapter data by subChapterId, then displays partial reading logic
 * (start/stop reading, text-size, truncated vs. expanded).
 *
 * Props:
 *   - subChapterId: string (ID from your plan activity)
 *   - userId: string (optional)
 *   - backendURL: string (API base URL)
 *   - onRefreshData: callback if you want to refresh external data after state changes
 */
export default function ReadingView({
  subChapterId,
  userId,
  level,
  backendURL = import.meta.env.VITE_BACKEND_URL,
  onRefreshData,
}) {
  // ==================== State ====================
  const [subChapter, setSubChapter] = useState(null);
  const [localProficiency, setLocalProficiency] = useState("empty");
  const [isExpanded, setIsExpanded] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  // Reading session times
  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  // ==================== A) Fetch subchapter ====================
  useEffect(() => {
    if (!subChapterId) return;

    async function fetchSubChapter() {
      try {
        const res = await axios.get(`${backendURL}/api/subchapters/${subChapterId}`);
        const data = res.data;
        if (!data) return;

        setSubChapter(data);

        // If it has a proficiency, set local state
        setLocalProficiency(data.proficiency || "empty");

        // If there's existing start/end times, apply them
        if (data.readStartTime) {
          setLocalStartMs(new Date(data.readStartTime).getTime());
        }
        if (data.readEndTime) {
          setLocalEndMs(new Date(data.readEndTime).getTime());
        }
      } catch (err) {
        console.error("Error fetching subchapter details:", err);
      }
    }

    fetchSubChapter();
  }, [subChapterId, backendURL]);

  // ==================== B) Reading Timer ====================
  useEffect(() => {
    if (localProficiency === "reading" && localStartMs && !localEndMs) {
      const tick = () => {
        const now = Date.now();
        const diff = now - localStartMs;
        setReadingSeconds(diff > 0 ? Math.floor(diff / 1000) : 0);
      };
      tick();
      const timerId = setInterval(tick, 1000);
      return () => clearInterval(timerId);
    } else {
      setReadingSeconds(0);
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // Compute final reading time if user has "read"
  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // ==================== Early Returns ====================
  if (!subChapter) {
    return (
      <div style={outerContainer}>
        <p>Loading subchapter {subChapterId} ...</p>
      </div>
    );
  }

  // ==================== Display Logic ====================
  const { subChapterName, summary = "", wordCount } = subChapter;
  const maxChars = 200;
  const truncatedText =
    summary.length > maxChars ? summary.slice(0, maxChars) + " ..." : summary;

  let displayedText;
  if (localProficiency === "empty") {
    // Not started => truncated
    displayedText = truncatedText;
  } else if (localProficiency === "reading") {
    // Currently reading => full
    displayedText = summary;
  } else {
    // "read" or "proficient"
    displayedText = isExpanded ? summary : truncatedText;
  }

  // Reading time display
  let readingTimeDisplay = "";
  if (localProficiency === "reading" && localStartMs && !localEndMs) {
    readingTimeDisplay = `Reading Time: ${formatTime(readingSeconds)}`;
  } else if (localProficiency === "read" && finalReadingTime) {
    readingTimeDisplay = `Total Reading: ${finalReadingTime}`;
  }

  // ==================== Handlers ====================
  async function postUserActivity(eventType) {
    try {
      await axios.post(`${backendURL}/api/user-activities`, {
        userId,
        subChapterId,
        eventType,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error posting user activity:", err);
    }
  }

  async function handleStartReading() {
    setLocalProficiency("reading");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalStartMs(nowMs);
    setLocalEndMs(null);

    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId,
        startReading: true,
      });
      await postUserActivity("startReading");
      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error starting reading:", error);
      setLocalProficiency("empty");
      setIsExpanded(false);
      setLocalStartMs(null);
    }
  }

  async function handleStopReading() {
    setLocalProficiency("read");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalEndMs(nowMs);

    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId,
        endReading: true,
      });
      await postUserActivity("stopReading");
      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error stopping reading:", error);
      setLocalProficiency("reading");
      setIsExpanded(true);
      setLocalEndMs(null);
    }
  }

  function toggleExpand() {
    setIsExpanded((prev) => !prev);
  }

  // If "read"/"proficient", we can show an expand/collapse button
  const canExpand = localProficiency === "read" || localProficiency === "proficient";

  // Base font size (user can adjust via A- / A+)
  const baseFontSize = 16 + fontSizeLevel * 2;

  return (
    <div style={outerContainer}>
      {/* Header */}
      <div style={headerSection}>
        <h2 style={{ margin: 0 }}>{subChapterName || "Subchapter Title"}</h2>
        <div style={headerInfoRow}>
          {wordCount != null && (
            <div style={headerInfoItem}>
              <strong>Words:</strong> {wordCount}
            </div>
          )}
          {wordCount != null && (
            <div style={headerInfoItem}>
              <strong>Est Time:</strong> {Math.ceil(wordCount / 200)} min
            </div>
          )}
          {readingTimeDisplay && (
            <div style={headerInfoItem}>
              <strong>{readingTimeDisplay}</strong>
            </div>
          )}
        </div>
        {/* Font size controls */}
        <div style={fontSizeButtons}>
          <button style={btnStyle} onClick={() => setFontSizeLevel((p) => p - 1)}>
            A-
          </button>
          <button style={btnStyle} onClick={() => setFontSizeLevel((p) => p + 1)}>
            A+
          </button>
        </div>
      </div>

      {/* Main reading content (scrollable if long) */}
      <div style={{ ...readingContentArea, fontSize: `${baseFontSize}px` }}>
        {displayedText}
      </div>

      {/* Action buttons at bottom */}
      <div style={footerActions}>
        {renderActionButtons(localProficiency)}
        {canExpand && (
          <button style={btnStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );

  function renderActionButtons(prof) {
    switch (prof) {
      case "empty":
        return (
          <button style={btnStyle} onClick={handleStartReading}>
            Start Reading
          </button>
        );
      case "reading":
        return (
          <button style={btnStyle} onClick={handleStopReading}>
            Stop Reading
          </button>
        );
      case "read":
        return (
          <div style={headerInfoItem}>
            <em>Reading Complete</em>
          </div>
        );
      case "proficient":
        return (
          <div style={headerInfoItem}>
            <em>You are Proficient!</em>
          </div>
        );
      default:
        return null;
    }
  }
}

// ----------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------

/** Outer container: fills the entire right-side area, black background, white text. */
const outerContainer = {
  width: "100%",
  height: "100%",
  backgroundColor: "#000",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  padding: "20px",
};

/** The top header area: subchapter name, word count, reading time, font-size controls, etc. */
const headerSection = {
  marginBottom: "16px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
};

/** Row of info items (word count, reading time, etc.) */
const headerInfoRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

/** Each small piece of info in the row */
const headerInfoItem = {
  fontSize: "0.85rem",
  fontStyle: "italic",
};

/** Container for the A- / A+ buttons */
const fontSizeButtons = {
  display: "flex",
  gap: "6px",
};

/** The main reading content area. We allow scrolling if the text is long. */
const readingContentArea = {
  flex: 1,
  overflowY: "auto",
  lineHeight: 1.5,
  marginBottom: "10px",
  whiteSpace: "pre-line",
};

/** Footer row with reading actions (start reading, stop reading, expand, etc.) */
const footerActions = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

/** A simple dark button style. */
const btnStyle = {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: "0.85rem",
};