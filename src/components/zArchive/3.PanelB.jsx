// src/components/DetailedBookViewer/PanelB.jsx

import React, { useState } from "react";

function PanelB() {
  // Chat state
  const [messages, setMessages] = useState([
    { role: "system", text: "Hello! This is a dummy chat interface. Type anything below." },
  ]);
  const [userInput, setUserInput] = useState("");

  // Add a new message
  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  // Handle sending
  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    // 1) Add user's message
    addMessage("user", trimmed);
    setUserInput("");

    // 2) Dummy system response
    setTimeout(() => {
      addMessage("system", "I am a dummy response!");
    }, 600);
  };

  return (
    <div style={panelContainer} id="panelB">
      <h3 style={headingStyle}>Chat Interface</h3>

      <div style={chatBox}>
        {messages.map((msg, idx) => {
          const isSystem = msg.role === "system";
          return (
            <div
              key={idx}
              style={{
                ...bubbleStyle,
                alignSelf: isSystem ? "flex-start" : "flex-end",
                backgroundColor: isSystem
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,132,255,0.7)",
              }}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      <form style={formStyle} onSubmit={handleSend}>
        <input
          type="text"
          style={inputStyle}
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" style={sendButton}>
          Send
        </button>
      </form>
    </div>
  );
}

// ---------- Styles -----------
const panelContainer = {
  // Make it consistent with your other “semi-transparent” panels
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "sans-serif",
  maxHeight: "100%",    // so it doesn't overflow
  display: "flex",
  flexDirection: "column",
};

const headingStyle = {
  marginTop: 0,
  marginBottom: "10px",
  fontSize: "1.1rem",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  paddingBottom: "5px",
};

const chatBox = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  overflowY: "auto",
  flex: 1, // expand to fill available vertical space
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "6px",
  padding: "10px",
  marginBottom: "10px",
};

const bubbleStyle = {
  maxWidth: "70%",
  padding: "8px 12px",
  borderRadius: "6px",
  color: "#fff",
  margin: "4px 0",
  wordWrap: "break-word",
};

const formStyle = {
  display: "flex",
  gap: "8px",
};

const inputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "none",
  outline: "none",
};

const sendButton = {
  backgroundColor: "rgba(0,132,255,0.7)",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

export default PanelB;