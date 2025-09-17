// src/components/DetailedBookViewer/AdaptivePlanGenerator.jsx
import React, { useState } from "react";
import axios from "axios";

function AdaptivePlanGenerator({ userId, colorScheme = {} }) {
  // 3) Form fields for generating a plan
  const [targetDate, setTargetDate] = useState("2025-07-20"); // required by default
  const [maxDays, setMaxDays] = useState("");
  const [wpm, setWpm] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState("");
  const [quizTime, setQuizTime] = useState("");
  const [reviseTime, setReviseTime] = useState("");
  const [masteryLevel, setMasteryLevel] = useState("");

  // Fields for selecting books/chapters/subchapters
  const [bookIdsString, setBookIdsString] = useState("");
  const [chapterIdsString, setChapterIdsString] = useState("");
  const [subchapterIdsString, setSubchapterIdsString] = useState("");

  // URL to your Cloud Function or backend endpoint
  const generatePlanURL = "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app";

  const handleGeneratePlan = async () => {
    if (!userId) {
      alert("No user logged in.");
      return;
    }

    // Build the request body (JSON)
    const requestBody = { userId };

    // 1) Required targetDate
    if (targetDate) {
      requestBody.targetDate = targetDate;
    } else {
      alert("Target date is required!");
      return;
    }

    // 2) Optional overrides
    if (maxDays) requestBody.maxDays = Number(maxDays);
    if (wpm) requestBody.wpm = Number(wpm);
    if (dailyReadingTime) requestBody.dailyReadingTime = Number(dailyReadingTime);
    if (quizTime) requestBody.quizTime = Number(quizTime);
    if (reviseTime) requestBody.reviseTime = Number(reviseTime);

    // 3) Mastery Level
    if (masteryLevel.trim()) {
      requestBody.level = masteryLevel.trim();
    }

    // 4) Optional Book/Chapter/Subchapter IDs
    if (bookIdsString.trim()) {
      const arrayOfBookIds = bookIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      requestBody.selectedBooks = arrayOfBookIds;
    }
    if (chapterIdsString.trim()) {
      const arrayOfChapterIds = chapterIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      requestBody.selectedChapters = arrayOfChapterIds;
    }
    if (subchapterIdsString.trim()) {
      const arrayOfSubchapterIds = subchapterIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      requestBody.selectedSubChapters = arrayOfSubchapterIds;
    }

    // Now send POST to the Cloud Function
    try {
      const res = await axios.post(generatePlanURL, requestBody, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Generate Plan response:", res.data);

      if (res.status === 200) {
        alert("Plan generated successfully!");
      } else {
        alert("Something went wrong generating the plan.");
      }
    } catch (err) {
      console.error("Error generating plan:", err);
      alert("Failed to generate plan. Check console for details.");
    }
  };

  return (
    <div
      style={{
        backgroundColor: colorScheme.cardBg || "#2F2F2F",
        borderRadius: "8px",
        padding: "20px",
        marginBottom: "20px",
        border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Generate Adaptive Plan</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Target Date (required) */}
        <div>
          <label style={{ marginRight: "8px" }}>Target Date:</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            style={{ padding: "4px" }}
          />
        </div>

        {/* maxDays (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Max Days Override:</label>
          <input
            type="number"
            value={maxDays}
            onChange={(e) => setMaxDays(e.target.value)}
            placeholder="(Leave blank for default)"
            style={{ padding: "4px" }}
          />
        </div>

        {/* wpm (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>WPM Override:</label>
          <input
            type="number"
            value={wpm}
            onChange={(e) => setWpm(e.target.value)}
            placeholder="(Leave blank for Firestore persona)"
            style={{ padding: "4px" }}
          />
        </div>

        {/* dailyReadingTime (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Daily Reading Time Override (mins):</label>
          <input
            type="number"
            value={dailyReadingTime}
            onChange={(e) => setDailyReadingTime(e.target.value)}
            placeholder="(Leave blank for Firestore persona)"
            style={{ padding: "4px" }}
          />
        </div>

        {/* quizTime (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Quiz Time (mins):</label>
          <input
            type="number"
            value={quizTime}
            onChange={(e) => setQuizTime(e.target.value)}
            placeholder="(default 1)"
            style={{ padding: "4px" }}
          />
        </div>

        {/* reviseTime (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Revise Time (mins):</label>
          <input
            type="number"
            value={reviseTime}
            onChange={(e) => setReviseTime(e.target.value)}
            placeholder="(default 1)"
            style={{ padding: "4px" }}
          />
        </div>

        {/* Mastery Level (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Mastery Level:</label>
          <input
            type="text"
            value={masteryLevel}
            onChange={(e) => setMasteryLevel(e.target.value)}
            placeholder="e.g. 'mastery', 'revision'"
            style={{ padding: "4px", width: "80%" }}
          />
        </div>

        {/* Book IDs (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Book IDs (comma-separated):</label>
          <input
            type="text"
            value={bookIdsString}
            onChange={(e) => setBookIdsString(e.target.value)}
            placeholder="e.g. 'abcd123, efgh456'"
            style={{ padding: "4px", width: "80%" }}
          />
        </div>

        {/* Chapter IDs (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Chapter IDs (comma-separated):</label>
          <input
            type="text"
            value={chapterIdsString}
            onChange={(e) => setChapterIdsString(e.target.value)}
            placeholder="e.g. 'ch1, ch2'"
            style={{ padding: "4px", width: "80%" }}
          />
        </div>

        {/* Subchapter IDs (optional) */}
        <div>
          <label style={{ marginRight: "8px" }}>Subchapter IDs (comma-separated):</label>
          <input
            type="text"
            value={subchapterIdsString}
            onChange={(e) => setSubchapterIdsString(e.target.value)}
            placeholder="e.g. 'subA, subB'"
            style={{ padding: "4px", width: "80%" }}
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleGeneratePlan}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: colorScheme.accent || "#BB86FC",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
            width: "fit-content",
          }}
        >
          Generate Plan
        </button>
      </div>
    </div>
  );
}

export default AdaptivePlanGenerator;