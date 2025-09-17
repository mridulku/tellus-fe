import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import chatPrompts from "./ChatPrompts";
import ReactMarkdown from "react-markdown";


function ChatInterface() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const hasPromptBeenSent = useRef(false);

 
  //  const backendURL = "https://bookish-guide-pjpjjpjgwxxgc7x5j-3001.app.github.dev";
//  const backendURL = "http://localhost:3001";

  const backendURL = import.meta.env.VITE_BACKEND_URL;


  
  

  const startingPrompt = chatPrompts[id] || "Welcome to the chat!";

  // Send initial prompt once on mount
  useEffect(() => {
    if (hasPromptBeenSent.current) return;
    hasPromptBeenSent.current = true;

    const sendStartingPrompt = async () => {
      setMessages([{ text: startingPrompt, type: "user" }]);

      try {
        // Log the starting prompt being sent
        console.log("Sending starting prompt to backend:", startingPrompt);

        const response = await axios.post(`${backendURL}/api/chat`, {
          message: startingPrompt,
          history: [],
        });

        // Log the response received from the backend
        console.log("Starting prompt response from backend:", response.data);

        const aiResponse = {
          text: response.data.reply,
          type: "ai",
        };

        setMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
        console.error("Error fetching initial response:", error);
      }
    };

    sendStartingPrompt();
  }, [id, startingPrompt]);

  // Function to send a user message to the "main" AI
  async function sendMessage() {
    if (!input) return;

    const userMessage = { text: input, type: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // (NEW) Filter out "judge" and "hint" messages from the main AI conversation
      const filteredHistory = messages
        .filter((msg) => msg.type === "user" || msg.type === "ai")
        .map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.text,
        }));

      console.log("User input:", input);
      console.log("Filtered messages sent to backend:", filteredHistory);

      const response = await axios.post(`${backendURL}/api/chat`, {
        message: input,
        history: filteredHistory,
      });

      // Log the response received from the backend
      console.log("Backend response:", response.data);

      const aiMessage = {
        text: response.data.reply,
        type: "ai",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error while sending message:", error);
    }
  }

  // (NEW) Function to send the entire conversation to a "Judge" AI
  async function judgeConversation() {
    try {
      console.log("Sending entire conversation to judge...");

      const response = await axios.post(`${backendURL}/api/judge`, {
        history: messages.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      });

      console.log("Judge response:", response.data);

      const judgeMessage = {
        text: response.data.reply,
        type: "judge",
      };

      setMessages((prev) => [...prev, judgeMessage]);
    } catch (error) {
      console.error("Error sending conversation to judge:", error);
    }
  }

  // (NEW) Function to send the entire conversation to a "Hint" AI
  async function hintConversation() {
    try {
      console.log("Sending entire conversation to hint...");

      const response = await axios.post(`${backendURL}/api/hint`, {
        history: messages.map((msg) => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      });

      console.log("Hint response:", response.data);

      const hintMessage = {
        text: response.data.reply,
        type: "hint",
      };

      setMessages((prev) => [...prev, hintMessage]);
    } catch (error) {
      console.error("Error sending conversation to hint:", error);
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chat Interface</h1>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "10px",
          height: "400px",
          overflowY: "scroll",
        }}
      >
        {messages.map((msg, index) => {
          // Default styles for AI messages
          let backgroundColor = "#ccc";
          let textColor = "#000";
          let alignment = "left";

          if (msg.type === "user") {
            backgroundColor = "#007bff";
            textColor = "#fff";
            alignment = "right";
          } else if (msg.type === "judge") {
            // Distinct color for the "judge" AI
            backgroundColor = "orange";
            textColor = "#000";
            alignment = "left";
          } else if (msg.type === "hint") {
            // Distinct color for the "hint" AI
            backgroundColor = "green";
            textColor = "#fff";
            alignment = "left";
          }

          return (
            <div
              key={index}
              style={{
                textAlign: alignment,
                margin: "10px 0",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor,
                  color: textColor,
                }}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </span>
            </div>
          );
        })}
      </div>

      {/* Input + Send + Judge + Hint Buttons */}
      <div style={{ marginTop: "10px", display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send
        </button>

        {/* Existing "Judge" button */}
        <button
          onClick={judgeConversation}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "orange",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Judge
        </button>

        {/* NEW "Hint" button */}
        <button
          onClick={hintConversation}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            backgroundColor: "green",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Hint
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;
