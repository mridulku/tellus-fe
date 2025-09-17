// src/components/DetailedBookViewer/SummaryModal.jsx
import React, { useState } from "react";
import ReactDOM from "react-dom";

function SummaryModal({
  isOpen,
  onClose,
  subChapterName,
  subChapterContent
}) {
  // 1) If the modal is not open, render nothing
  if (!isOpen) return null;

  // 2) We'll mount the portal into #portal-root
  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  // 3) The OpenAI API key from environment (adjust name if needed)
  const apiKey = import.meta.env.VITE_OPENAI_KEY;

  // 4) Local states for GPT logic
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summaryOutput, setSummaryOutput] = useState("");

  // 5) Basic styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "6px",
    padding: "20px",
    width: "600px",
    maxWidth: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    position: "relative",
  };

  const closeModalButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
  };

  const promptButtonStyle = {
    padding: "10px 15px",
    marginRight: "10px",
    marginTop: "10px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#203A43",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  // 6) Sample prompts for each button
  const PROMPTS = {
    explainLike5: `Explain the following text in a way a 5-year-old could understand, 
      using very simple language:`,
    bulletPoints: `Summarize the following text in bullet points:`,
    conciseSummary: `Provide a concise one-paragraph summary of the following text:`
  };

  // 7) Handler to call GPT
  const handleGenerateSummary = async (promptKey) => {
    if (!apiKey) {
      setError("No OpenAI API key found in environment!");
      return;
    }
    const chosenPrompt = PROMPTS[promptKey];
    if (!chosenPrompt) {
      setError("Invalid prompt key.");
      return;
    }

    setLoading(true);
    setError(null);
    setSummaryOutput("");

    try {
      // Combine the chosen prompt with the subchapter content
      const fullPrompt = `
        You are a helpful assistant. 
        ${chosenPrompt}

        Text:
        ${subChapterContent}
      `;

      // Hit OpenAI Chat endpoint
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // or "gpt-4" if you have access
          messages: [
            {
              role: "user",
              content: fullPrompt,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";

      setSummaryOutput(reply.trim());
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 8) Render via createPortal
  return ReactDOM.createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button style={closeModalButtonStyle} onClick={onClose}>
          &times;
        </button>

        <h3>Summary for: {subChapterName}</h3>

        {/* Buttons to pick summary style */}
        <div style={{ marginTop: "1rem" }}>
          <button
            style={promptButtonStyle}
            onClick={() => handleGenerateSummary("explainLike5")}
          >
            Explain Like I'm 5
          </button>
          <button
            style={promptButtonStyle}
            onClick={() => handleGenerateSummary("bulletPoints")}
          >
            Bullet Points
          </button>
          <button
            style={promptButtonStyle}
            onClick={() => handleGenerateSummary("conciseSummary")}
          >
            Concise Summary
          </button>
        </div>

        {/* Loading or Error */}
        {loading && (
          <p style={{ marginTop: "1rem", color: "blue" }}>
            Generating summary...
          </p>
        )}
        {error && (
          <p style={{ marginTop: "1rem", color: "red" }}>
            <strong>Error:</strong> {error}
          </p>
        )}

        {/* Summaries from GPT */}
        {summaryOutput && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              border: "1px solid #ccc",
              background: "#fafafa",
              whiteSpace: "pre-wrap",
            }}
          >
            {summaryOutput}
          </div>
        )}

        {/* Original Subchapter Content (optional) */}
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap", color: "#333" }}>
          <strong>Original Content:</strong>
          <div style={{ marginTop: "0.5rem" }}>
            {subChapterContent}
          </div>
        </div>
      </div>
    </div>,
    portalRoot
  );
}

export default SummaryModal;