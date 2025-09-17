// File: QuizConfigCreator.jsx
import React, { useState } from "react";
import { db } from "../../../../firebase"; // adjust path if needed
import { doc, setDoc } from "firebase/firestore";

export default function QuizConfigCreator() {
  // We'll let the user specify the doc ID,
  // e.g. "quizGeneralApply" or "quizGeneralAnalyze"
  const [docId, setDocId] = useState("quizGeneralApply");

  // We provide a default JSON (all question types = 0, except multipleChoice=3)
  const [rawJson, setRawJson] = useState(`{
  "compareContrast": 0,
  "fillInBlank": 0,
  "multipleChoice": 3,
  "openEnded": 0,
  "rankingOrSorting": 0,
  "scenario": 0,
  "shortAnswer": 0,
  "trueFalse": 0
}`);

  const [status, setStatus] = useState("");

  async function handleSubmit() {
    try {
      const parsed = JSON.parse(rawJson);
      // Write to Firestore => quizConfigs/<docId>
      await setDoc(doc(db, "quizConfigs", docId), parsed, { merge: true });

      setStatus(`Successfully wrote quizConfigs/${docId}.`);
    } catch (error) {
      console.error("Error writing quiz config:", error);
      setStatus(`Error: ${error.message}`);
    }
  }

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Create Quiz Config</h2>
      <p>
        This tool lets you create/edit a single <code>quizConfigs</code> document in Firestore,
        which defines how many of each question type you want for that specific
        &quot;exam+stage&quot; combo (for example, <code>quizGeneralApply</code>).
      </p>

      {/* Document ID input */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Document ID:</label>
        <br />
        <input
          type="text"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          placeholder="e.g. quizGeneralApply"
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      {/* JSON text area */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Question-Type Counts (JSON):</label>
        <br />
        <textarea
          rows={10}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      {/* Save button */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleSubmit}>Save to Firestore</button>
      </div>

      {/* Status */}
      {status && <p style={{ color: status.startsWith("Error") ? "red" : "lightgreen" }}>{status}</p>}
    </div>
  );
}