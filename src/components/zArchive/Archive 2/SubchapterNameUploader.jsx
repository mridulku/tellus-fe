import React, { useState } from "react";
import axios from "axios";

function SubchapterNameUploader() {
  const [jsonInput, setJsonInput] = useState("");
  const [message, setMessage] = useState("");

  // Where your Express route lives:
  // const backendURL = "http://localhost:3001/api/subchaptername";

//  const backendURL = `${import.meta.env.VITE_BACKEND_URL}/api/subchaptername`;

  const backendURL = `${import.meta.env.VITE_BACKEND_URL}/api/subchaptername`;

  // Called when the user clicks "Submit"
  const handleSubmit = async () => {
    try {
      if (!jsonInput.trim()) {
        setMessage("Please paste JSON data first.");
        return;
      }

      // Attempt to parse the JSON
      const parsedData = JSON.parse(jsonInput);

      if (!Array.isArray(parsedData)) {
        setMessage("JSON must be an array of objects.");
        return;
      }

      // Example sub-chapter object might look like:
      // {
      //   "bookName": "The Book",
      //   "chapterName": "Chapter 1",
      //   "subChapterName": "Section 1.1",
      //   "subChapterSerial": 1,
      //   "startPage": 12,
      //   "endPage": 14
      // }

      // Post to your Express route
      const response = await axios.post(backendURL, {
        data: parsedData,
      });

      if (response.data.success) {
        setMessage(`Successfully uploaded ${response.data.count} sub-chapters!`);
      } else {
        setMessage(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Error submitting JSON:", error);
      if (error.name === "SyntaxError") {
        setMessage("Invalid JSON format. Please fix and try again.");
      } else {
        setMessage("An error occurred. Check console for details.");
      }
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Subchapter Name Uploader</h2>
      <p>Paste the JSON array of sub-chapters below, then click “Submit.”</p>

      <textarea
        rows="10"
        cols="80"
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        placeholder='[{"bookName":"The Book","chapterName":"Chapter 1","subChapterName":"Section 1.1",...}]'
        style={{ display: "block", marginBottom: "10px" }}
      />

      <button onClick={handleSubmit} style={{ padding: "8px 16px" }}>
        Submit
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}

export default SubchapterNameUploader;