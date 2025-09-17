import React, { useState, useEffect } from "react";
import axios from "axios";

// Existing child modals
import QuizModal from "./QuizModal";
import SummaryModal from "./SummaryModal";
import DoubtsModal from "./DoubtsModal";
// New DynamicTutorModal
import DynamicTutorModal from "./DynamicTutorModal";

const openAIKey = import.meta.env.VITE_OPENAI_KEY;

// Helper to format seconds -> "MM:SS"
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SubchapterContent({
  subChapter, // e.g. { subChapterId, proficiency, quizScore, summary, wordCount, subChapterName, readStartTime, readEndTime, ... }
  userId,
  backendURL,
  onRefreshData,
}) {
  if (!subChapter) return null;


  // ----------------------------------------------
  // POST to /api/user-activities
  // ----------------------------------------------
  async function postUserActivity(eventType) {
    try {
      await axios.post(`${backendURL}/api/user-activities`, {
        userId,
        subChapterId: subChapter.subChapterId,
        eventType,
        // Optionally pass a client-side timestamp if you want:
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error posting user activity:", err);
      // Not blocking, just log or show a warning
    }
  }

  // --------------------------------------------------------------------------------
  // 1) Local Proficiency (optimistic UI)
  // --------------------------------------------------------------------------------
  const [localProficiency, setLocalProficiency] = useState(
    subChapter.proficiency || "empty"
  );

  // --------------------------------------------------------------------------------
  // 2) Expanded/Collapsed text
  // --------------------------------------------------------------------------------
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const initialProf = subChapter.proficiency || "empty";
    setLocalProficiency(initialProf);
    setIsExpanded(initialProf === "reading");
  }, [subChapter.subChapterId, subChapter.proficiency]);

  // --------------------------------------------------------------------------------
  // 3) Font size
  // --------------------------------------------------------------------------------
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const increaseFont = () => setFontSizeLevel((prev) => (prev < 2 ? prev + 1 : prev));
  const decreaseFont = () => setFontSizeLevel((prev) => (prev > -2 ? prev - 1 : prev));

  // --------------------------------------------------------------------------------
  // 4) Local Reading Times (start/end)
  // --------------------------------------------------------------------------------
  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);

  // We'll keep track of the ticking seconds while "reading"
  const [readingSeconds, setReadingSeconds] = useState(0);

  // And if they've finished reading, we display a finalReadingTime in MM:SS
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  // --------------------------------------------------------------------------------
  // 5) On mount or subChapter changes: Initialize local times from doc if available
  // --------------------------------------------------------------------------------
  useEffect(() => {
    // Reset
    setReadingSeconds(0);
    setFinalReadingTime(null);

    const prof = subChapter.proficiency || "empty";
    setLocalProficiency(prof);

    // readStartTime & readEndTime from the doc
    let sMs = null;
    if (subChapter.readStartTime) {
      sMs = new Date(subChapter.readStartTime).getTime();
    }
    let eMs = null;
    if (subChapter.readEndTime) {
      eMs = new Date(subChapter.readEndTime).getTime();
    }
    setLocalStartMs(sMs);
    setLocalEndMs(eMs);

    // If "read" & we have both start + end, compute final time
    if (prof === "read" && sMs && eMs && eMs > sMs) {
      const totalSec = Math.floor((eMs - sMs) / 1000);
      setFinalReadingTime(formatTime(totalSec));
    } else if (prof === "reading") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [subChapter]);

  // --------------------------------------------------------------------------------
  // 6) Timer effect for live reading
  // --------------------------------------------------------------------------------
  useEffect(() => {
    if (localProficiency === "reading" && localStartMs && !localEndMs) {
      const tick = () => {
        const now = Date.now();
        const diff = now - localStartMs;
        setReadingSeconds(diff > 0 ? Math.floor(diff / 1000) : 0);
      };
      tick(); // immediate
      const timerId = setInterval(tick, 1000);
      return () => clearInterval(timerId);
    } else {
      // not reading or we have an end time => no live timer
      setReadingSeconds(0);
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // --------------------------------------------------------------------------------
  // 7) If proficiency === "read" and we have start/end, compute final time
  // --------------------------------------------------------------------------------
  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // --------------------------------------------------------------------------------
  // 8) Modals: Quiz, Summary, Doubts, Tutor
  // --------------------------------------------------------------------------------
  const [showQuizModal, setShowQuizModal] = useState(false);
  const openQuizModal = () => setShowQuizModal(true);
  const closeQuizModal = () => setShowQuizModal(false);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const openSummaryModal = () => setShowSummaryModal(true);
  const closeSummaryModal = () => setShowSummaryModal(false);

  const [showDoubtsModal, setShowDoubtsModal] = useState(false);
  const openDoubtsModal = () => setShowDoubtsModal(true);
  const closeDoubtsModal = () => setShowDoubtsModal(false);

  const [showTutorModal, setShowTutorModal] = useState(false);
  const openTutorModal = () => setShowTutorModal(true);
  const closeTutorModal = () => setShowTutorModal(false);

  // --------------------------------------------------------------------------------
  // 9) Reading Handlers (start/stop)
  // --------------------------------------------------------------------------------
  const handleStartReading = async () => {
    setLocalProficiency("reading");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalStartMs(nowMs);
    setLocalEndMs(null);

    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId: subChapter.subChapterId,
        startReading: true,
      });

      // 2) Also post to the new /api/user-activities
      await postUserActivity("startReading");

      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error starting reading:", error);
      alert("Failed to start reading.");

      // revert local states
      setLocalProficiency("empty");
      setIsExpanded(false);
      setLocalStartMs(null);
    }
  };

  const handleStopReading = async () => {
    setLocalProficiency("read");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalEndMs(nowMs);

    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId: subChapter.subChapterId,
        endReading: true,
      });

      // 2) Also post to the new /api/user-activities
      await postUserActivity("stopReading");

      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error stopping reading:", error);
      alert("Failed to stop reading.");

      // revert local states
      setLocalProficiency("reading");
      setIsExpanded(true);
      setLocalEndMs(null);
    }
  };

  // --------------------------------------------------------------------------------
  // 10) Text display logic
  // --------------------------------------------------------------------------------
  const maxChars = 200;
  const rawText = subChapter.summary || "";
  const truncatedText =
    rawText.length > maxChars ? rawText.slice(0, maxChars) + " ..." : rawText;

  let displayedText;
  if (localProficiency === "empty") {
    displayedText = truncatedText;
  } else if (localProficiency === "reading") {
    displayedText = rawText;
  } else {
    displayedText = isExpanded ? rawText : truncatedText;
  }

  const canShowExpandCollapse =
    localProficiency === "read" || localProficiency === "proficient";
  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // --------------------------------------------------------------------------------
  // 11) Timer / Reading Info
  // --------------------------------------------------------------------------------
  let readingTimeDisplay = null;
  if (localProficiency === "reading" && localStartMs && !localEndMs) {
    readingTimeDisplay = `Reading Time: ${formatTime(readingSeconds)}`;
  } else if (localProficiency === "read" && finalReadingTime) {
    readingTimeDisplay = `Total Reading: ${finalReadingTime}`;
  }

  // We'll also show quizScore if it exists and is not null
  const { quizScore } = subChapter; // from the API route
  const quizDisplay = quizScore !== null ? `Quiz Score: ${quizScore}` : null;

  // --------------------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------------------
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const titleBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
  };

  const leftSectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const leftTitleStyle = {
    fontSize: "1.2rem",
    margin: 0,
  };

  const rightInfoContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  };

  const smallInfoTextStyle = {
    fontStyle: "italic",
    fontSize: "0.9rem",
  };

  const fontButtonContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  };

  const primaryButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  const secondaryButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#aaa",
    color: "#000",
    fontWeight: "normal",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  const baseFontSize = 16 + fontSizeLevel * 2;
  const contentStyle = {
    whiteSpace: "pre-line",
    marginBottom: "15px",
    fontSize: `${baseFontSize}px`,
    lineHeight: "1.5",
  };

  const bottomCenterStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
  };

  // --------------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------------
  return (
    <div style={panelStyle}>
      {/* ---------- TOP BAR ---------- */}
      <div style={titleBarStyle}>
        {/* Left side: Subchapter name + Summarize + Ask Doubt + Tutor */}
        <div style={leftSectionStyle}>
          <h2 style={leftTitleStyle}>
            {subChapter.subChapterName || "Subchapter"}
          </h2>

          {/* Summarize button */}
          <button  id="summarizebutton" style={primaryButtonStyle} onClick={openSummaryModal}>
            Summarize
          </button>

          {/* Ask Doubt button */}
          <button  id="startreadingbutton" style={primaryButtonStyle} onClick={openDoubtsModal }>
            Ask Doubt
          </button>

          {/* Dynamic Tutor button */}
          <button  id="dynamictutorbutton" style={primaryButtonStyle} onClick={openTutorModal}>
            Dynamic Tutor
          </button>
        </div>

        {/* Right side: word count + font size + Timer + Quiz Score */}
        <div style={rightInfoContainerStyle}>
          {subChapter.wordCount && (
            <div style={smallInfoTextStyle}>
              <strong>Words:</strong> {subChapter.wordCount} |{" "}
              <strong>Est Time:</strong>{" "}
              {Math.ceil(subChapter.wordCount / 200)} min
            </div>
          )}

          {/* Timer or total reading display */}
          {readingTimeDisplay && (
            <div style={smallInfoTextStyle}>
              <strong>{readingTimeDisplay}</strong>
            </div>
          )}

          {/* Quiz score if exists */}
          {quizDisplay && (
            <div style={smallInfoTextStyle}>
              <strong>{quizDisplay}</strong>
            </div>
          )}

          {/* Font size controls */}
          <div style={fontButtonContainerStyle}>
            <button  id="fontsizebutton" style={primaryButtonStyle} onClick={decreaseFont}>
              A-
            </button>
            <button style={primaryButtonStyle} onClick={increaseFont}>
              A+
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MAIN TEXT ---------- */}
      <div style={contentStyle}>{displayedText}</div>

      {/* ---------- BOTTOM BUTTONS ---------- */}
      <div style={bottomCenterStyle}>
        {renderActionButtons(localProficiency)}

        {canShowExpandCollapse && (
          <button style={secondaryButtonStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse Content" : "Expand Content"}
          </button>
        )}
      </div>

      {/* ========== QUIZ MODAL ========== */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={closeQuizModal}
        subChapterName={subChapter.subChapterName}
        subChapterId={subChapter.subChapterId}
        subChapterContent={subChapter.summary}
        userId={userId}
        backendURL={backendURL}
      />

      {/* ========== SUMMARY MODAL ========== */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={closeSummaryModal}
        subChapterName={subChapter.subChapterName}
        subChapterContent={subChapter.summary}
      />

      {/* ========== DOUBTS MODAL ========== */}
      <DoubtsModal
        isOpen={showDoubtsModal}
        onClose={closeDoubtsModal}
        subChapterName={subChapter.subChapterName}
        subChapterId={subChapter.subChapterId}
        subChapterContent={subChapter.summary}
        userId={userId}
        backendURL={backendURL}
        openAIKey={openAIKey}
      />

      {/* ========== DYNAMIC TUTOR MODAL ========== */}
      <DynamicTutorModal
        isOpen={showTutorModal}
        onClose={closeTutorModal}
        subChapterName={subChapter.subChapterName}
        subChapterContent={subChapter.summary}
        userId={userId}
      />
    </div>
  );

  // --------------------------------------------------------------------------------
  // Renders the correct reading/quiz button
  // --------------------------------------------------------------------------------
  function renderActionButtons(prof) {
    switch (prof) {
      case "empty":
        return (
          <button style={primaryButtonStyle} onClick={handleStartReading} id="startreadingbutton">
            Start Reading
          </button>
        );
      case "reading":
        return (
          <button  id="stopreadingbutton" style={primaryButtonStyle} onClick={handleStopReading}>
            Stop Reading
          </button>
        );
      case "read":
        return (
          <button  id="takequizbutton" style={primaryButtonStyle} onClick={openQuizModal}>
            Take Quiz
          </button>
        );
      case "proficient":
        return (
          <button  id="takeanotherquizbutton" style={primaryButtonStyle} onClick={openQuizModal}>
            Take Another Quiz
          </button>
        );
      default:
        return null;
    }
  }
}

export default SubchapterContent;