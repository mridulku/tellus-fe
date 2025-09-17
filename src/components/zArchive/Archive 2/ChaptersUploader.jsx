import React, { useState } from "react";
import axios from "axios";

function ChaptersUploader() {
  // Text area state
  const [jsonInput, setJsonInput] = useState("");
  // Message to show success or error info
  const [message, setMessage] = useState("");



  //  const backendURL = "https://bookish-guide-pjpjjpjgwxxgc7x5j-3001.app.github.dev/api/chapters";


//  const backendURL = import.meta.env.VITE_BACKEND_URL;

  //  const backendURL = "http://localhost:3001"; // or your domain





//  const backendURL = "http://localhost:3001/api/chapters";

  const backendURL = `${import.meta.env.VITE_BACKEND_URL}/api/chapters`;

  // Track changes in the text area
  const handleChange = (e) => {
    setJsonInput(e.target.value);
  };

  // Handle the submit button
  const handleSubmit = async () => {
    try {
      if (!jsonInput.trim()) {
        setMessage("Please paste JSON data first.");
        return;
      }

      // Parse the JSON
      const parsedData = JSON.parse(jsonInput);

      // Must be an array
      if (!Array.isArray(parsedData)) {
        setMessage("JSON must be an array of objects.");
        return;
      }

      // Send to our backend route
      const response = await axios.post(backendURL, { data: parsedData });

      if (response.data.success) {
        setMessage(`Successfully uploaded ${response.data.count} chapters!`);
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
      <h2>Chapters Uploader</h2>
      <p>Paste JSON array of chapters here, then click “Submit.”</p>

      <textarea
        rows="10"
        cols="80"
        value={jsonInput}
        onChange={handleChange}
        placeholder='E.g. [{"book_name":"Book A","chapter":"Chapter 1","start_page":1,"end_page":10,"chapter_serial":1}, ...]'
      />

      <br />
      <button onClick={handleSubmit} style={{ marginTop: "10px" }}>
        Submit JSON
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}
    </div>
  );
}

export default ChaptersUploader;