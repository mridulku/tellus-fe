import React, { useState } from "react";
import axios from "axios";

function SubChaptersUploader() {
  // The multiline text for the JSON input
  const [jsonInput, setJsonInput] = useState("");
  // A message to show success/error
  const [message, setMessage] = useState("");

  // The URL of your backend route
  // e.g. "https://<your-codespace>-3001.app.github.dev/api/subChapters"
//  const backendURL = "https://bookish-guide-pjpjjpjgwxxgc7x5j-3001.app.github.dev/api/subChapters";
 //   const backendURL = "http://localhost:3001/api/subChapters";


    const backendURL = `${import.meta.env.VITE_BACKEND_URL}/api/subChapters`;

  // Handler for the textarea changes
  const handleChange = (e) => {
    setJsonInput(e.target.value);
  };

  // Handler for the "Submit JSON" button
  const handleSubmit = async () => {
    try {
      if (!jsonInput.trim()) {
        setMessage("Please paste the JSON data first.");
        return;
      }

      // Attempt to parse the JSON
      let parsedData = JSON.parse(jsonInput);

      // The parsedData should be an array of objects
      if (!Array.isArray(parsedData)) {
        setMessage("JSON must be an array of objects.");
        return;
      }

      // POST the array to our backend route
      const response = await axios.post(backendURL, { data: parsedData });

      if (response.data.success) {
        setMessage(`Successfully stored ${response.data.count} items in Firestore!`);
      } else {
        setMessage(`Backend reported an error: ${response.data.error}`);
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
      <h1>SubChapters Uploader</h1>
      <p>Paste the JSON array below and click "Submit".</p>

      <textarea
        rows="10"
        cols="80"
        value={jsonInput}
        onChange={handleChange}
        placeholder='Paste your JSON array here'
      />

      <br />
      <button onClick={handleSubmit} style={{ marginTop: "10px" }}>
        Submit JSON
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}

export default SubChaptersUploader;