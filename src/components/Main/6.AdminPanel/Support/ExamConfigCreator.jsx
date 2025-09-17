import React, { useState } from "react";
import { db } from "../../../../firebase"; // adjust this path
import { doc, setDoc } from "firebase/firestore";

function ExamConfigCreator() {
  // State for the doc ID (e.g. "general", "toefl", etc.)
  const [docId, setDocId] = useState("general");

  // State for the raw JSON input
  const [rawJson, setRawJson] = useState(`{
  "stages": ["none", "remember", "understand", "apply", "analyze"],
  "planTypes": {
    "none-basic": { "startStage": "remember", "finalStage": "understand" },
    "none-moderate": { "startStage": "remember", "finalStage": "apply" },
    "none-advanced": { "startStage": "remember", "finalStage": "analyze" },
    "some-basic": { "startStage": "understand", "finalStage": "understand" },
    "some-moderate": { "startStage": "understand", "finalStage": "apply" },
    "some-advanced": { "startStage": "understand", "finalStage": "analyze" },
    "strong-basic": { "startStage": "apply", "finalStage": "apply" },
    "strong-moderate": { "startStage": "apply", "finalStage": "apply" },
    "strong-advanced": { "startStage": "apply", "finalStage": "analyze" }
  }
}`);

  // For displaying status messages (success/error)
  const [status, setStatus] = useState("");

  // Handle the "Submit" button click
  const handleSubmit = async () => {
    try {
      // 1) Parse the user input as JSON
      const parsedData = JSON.parse(rawJson);

      // 2) Write to Firestore -> examConfigs/<docId>
      await setDoc(doc(db, "examConfigs", docId), parsedData, { merge: true });

      setStatus(`Successfully wrote examConfigs/${docId}.`);
    } catch (error) {
      console.error("Error writing exam config:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Create Exam Config</h2>

      {/* Doc ID Input */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="docIdInput">
          Document ID (e.g. "general", "toefl", "gmat"):
        </label>
        <br />
        <input
          id="docIdInput"
          type="text"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      {/* JSON Text Area */}
      <div style={{ marginBottom: "1rem" }}>
        <label htmlFor="jsonInput">Exam Config JSON:</label>
        <br />
        <textarea
          id="jsonInput"
          rows={10}
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          style={{ width: "100%", marginTop: "0.5rem" }}
        />
      </div>

      {/* Submit Button */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleSubmit}>Save to Firestore</button>
      </div>

      {/* Status Messages */}
      {status && <p>{status}</p>}
    </div>
  );
}

export default ExamConfigCreator;