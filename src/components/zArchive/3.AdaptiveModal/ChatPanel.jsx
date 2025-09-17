// ChatPanel.jsx
import React from "react";
import {
  chatPanelContainerStyle,
  chatHeaderStyle,
  chatBodyStyle,
  chatMessagesStyle,
  chatInputContainerStyle,
  chatInputStyle,
  chatSendButtonStyle,
} from "./styles";

export default function ChatPanel({
  open,
  onToggle,
  messages,
  newMessage,
  setNewMessage,
  onSend,
}) {
  return (
    <div style={{ ...chatPanelContainerStyle, height: open ? "300px" : "40px" }}>
      <div style={chatHeaderStyle} onClick={onToggle}>
        <strong>Chat</strong>
        <span style={{ marginLeft: "10px" }}>{open ? "▼" : "▲"}</span>
      </div>
      {open && (
        <div style={chatBodyStyle}>
          <div style={chatMessagesStyle}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  textAlign: msg.sender === "user" ? "right" : "left",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: msg.sender === "user" ? "#FFD700" : "#444",
                    color: msg.sender === "user" ? "#000" : "#fff",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    maxWidth: "70%",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div style={chatInputContainerStyle}>
            <input
              style={chatInputStyle}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder="Type here..."
            />
            <button style={chatSendButtonStyle} onClick={onSend}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}