
// src/components/DetailedBookViewer/DynamicTutorModal.jsx

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * A modal that opens a ChatGPT-like interface:
 *  - On initial load, we send a "system" message with subChapterContent,
 *    so GPT can act as a tutor about this subchapter.
 *  - We don't show this system message in the UI; only the assistant's
 *    and user's messages are displayed.
 */
function DynamicTutorModal({
  isOpen,
  onClose,
  subChapterName,
  subChapterContent
}) {
  // 1) If modal isn't open, render nothing.
  if (!isOpen) return null;

  // We'll mount the portal into #portal-root
  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  // 2) API Key from env (adjust as needed for your setup)
  const apiKey = import.meta.env.VITE_OPENAI_KEY;

  // 3) Chat state
  // Each message is: { role: "user" | "assistant" | "system", content: string }
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 4) On open, automatically send a "system" message that includes the subchapter content
  //    so GPT can respond with its first "assistant" message.
  useEffect(() => {
    if (!isOpen) return;

    // Clear old chat if the modal is reopened
    setMessages([]);
    setUserInput("");
    setError(null);

    // Kick off the session
    startTutorSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Start the tutor session by sending a system message.
  const startTutorSession = async () => {
    if (!apiKey) {
      setError("No OpenAI API key found in environment!");
      return;
    }
    setLoading(true);

    try {
      // System message (invisible to the user) sets the tutor's instructions & subchapter content
      const initialMessages = [
        {
          role: "system",
          content: `
You are a dynamic, proactive tutor. You have the following learning material "${subChapterName}":

"${subChapterContent}"

**Your objectives:**
1. Do NOT rely on the user’s questions or directions. Instead, guide the session on your own.
2. Break the material into logical “bite-sized” segments or steps.
3. For each segment:
   - Provide a clear, concise explanation in simple language.
   - Include at least one relevant example or analogy (if helpful).
   - Ask the learner a short question to check their understanding.
   - Wait for the user’s response. If they do not respond, proceed after a short pause with the next segment, while still inviting them to ask questions if needed.
4. Continue until all key points from the subchapter have been covered.
5. Conclude with a brief summary or recap of the entire subchapter.

**Important guidelines:**
- Use a friendly, encouraging tone.
- Keep explanations straightforward and avoid unnecessary jargon.
- If the user ever asks a question, answer thoroughly but then resume your structured teaching flow afterward.
- At the end, provide a concise summary of the main points.

Begin by briefly introducing the topic, then proceed step by step as instructed.
          `.trim()
        }
      ];

      // Call the OpenAI Chat API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // or gpt-4 if available
          messages: initialMessages,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";

      // Save the entire conversation so far:
      // - system message (for context in future calls, not displayed)
      // - assistant's reply (this is displayed to the user)
      setMessages([
        ...initialMessages,
        { role: "assistant", content: reply.trim() }
      ]);

    } catch (err) {
      console.error("Error initiating tutor session:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5) Handle the user sending a new message
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    if (!apiKey) {
      setError("No OpenAI API key found in environment!");
      return;
    }

    setLoading(true);
    setError(null);

    // Append the user's new message to the conversation
    const newUserMessage = { role: "user", content: userInput };
    const newMessages = [...messages, newUserMessage];

    try {
      // Send the updated conversation to OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: newMessages,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";

      // Update state with the user message + assistant reply
      setMessages([
        ...newMessages,
        { role: "assistant", content: reply.trim() }
      ]);

      // Clear the input
      setUserInput("");

    } catch (err) {
      console.error("Error sending user message:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6) Basic styles
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
    justifyContent: "center"
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "6px",
    padding: "20px",
    width: "700px",
    maxWidth: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    position: "relative"
  };

  const closeModalButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold"
  };

  const chatContainerStyle = {
    border: "1px solid #ddd",
    padding: "10px",
    marginBottom: "10px",
    maxHeight: "50vh",
    overflowY: "auto"
  };

  const userInputContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  };

  const inputStyle = {
    flexGrow: 1,
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc"
  };

  const sendButtonStyle = {
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#203A43",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  };

  // 7) Render the modal
  return ReactDOM.createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button style={closeModalButtonStyle} onClick={onClose}>
          &times;
        </button>

        <h2>Dynamic Tutor for: {subChapterName}</h2>
        {error && (
          <p style={{ color: "red" }}>
            <strong>Error:</strong> {error}
          </p>
        )}
        {loading && <p style={{ color: "blue" }}>Thinking...</p>}

        <div style={chatContainerStyle}>
          {/* Filter out system messages so they won't display to the user */}
          {messages
            .filter((msg) => msg.role !== "system")
            .map((msg, i) => {
              const isUser = msg.role === "user";
              const isAssistant = msg.role === "assistant";

              // Basic styling for each message
              const messageStyle = {
                padding: "6px 10px",
                margin: "4px 0",
                borderRadius: "4px",
                backgroundColor: isUser ? "#cff4fc" : "#f8d7da",
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "80%",
                whiteSpace: "pre-wrap"
              };

              // Label user vs assistant
              let prefix = "";
              if (isUser) prefix = "You: ";
              if (isAssistant) prefix = "Tutor: ";

              return (
                <div key={i} style={messageStyle}>
                  <strong>{prefix}</strong>
                  {msg.content}
                </div>
              );
            })}
        </div>

        {/* User input area */}
        <div style={userInputContainerStyle}>
          <input
            type="text"
            style={inputStyle}
            placeholder="Ask the tutor..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={loading}
          />
          <button
            style={sendButtonStyle}
            onClick={handleSendMessage}
            disabled={loading || !userInput.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
}

export default DynamicTutorModal;