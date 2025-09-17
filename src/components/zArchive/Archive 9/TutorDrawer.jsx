import React, { useState, useEffect } from "react";

export default function TutorDrawer({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Greet user upon opening
    const greet = {
      role: "assistant",
      content: "Hello, I'm your dynamic tutor. How can I help?",
    };
    setMessages([greet]);
  }, []);

  const drawerWidth = 400;
  const overlayStyle = {
    position: "fixed",
    top: 0,
    right: 0,
    width: `${drawerWidth}px`,
    height: "100%",
    background: "#fff",
    color: "#000",
    zIndex: 999,
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px",
    borderBottom: "1px solid #ccc",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
  };

  const chatStyle = {
    flex: 1,
    padding: "10px",
    overflowY: "auto",
  };

  const inputContainerStyle = {
    padding: "10px",
    borderTop: "1px solid #ccc",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    marginBottom: "5px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    padding: "8px 12px",
    background: "#203A43",
    color: "#fff",
    border: "none",
    cursor: "pointer",
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    // Mock a tutor reply
    const tutorReply = {
      role: "assistant",
      content: `Here's a tutor response to: "${input}". (Mock)`,
    };
    setMessages((prev) => [...prev, userMsg, tutorReply]);

    setInput("");
  };

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <h3>Dynamic Tutor</h3>
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>
      </div>
      <div style={chatStyle}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <strong>{msg.role === "user" ? "You" : "Tutor"}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div style={inputContainerStyle}>
        <input
          style={inputStyle}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Say something..."
        />
        <button style={buttonStyle} onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}