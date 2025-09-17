import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

/**
 * DoubtsModal
 *
 * Props:
 * - isOpen: Boolean => whether the modal is open or not
 * - onClose: Function to close the modal
 * - subChapterName: e.g. "Introduction to Biology"
 * - subChapterId: (optional) if you need it
 * - subChapterContent: The actual text or summary of the subchapter
 * - userId, backendURL, openAIKey, etc. (if needed)
 */
function DoubtsModal({
  isOpen,
  onClose,
  subChapterName,
  subChapterId,
  subChapterContent,
  userId,
  backendURL,
  openAIKey,
}) {
  // 1) If not open, return null (don’t render anything)
  if (!isOpen) return null;

  // 2) Grab portal root (like QuizModal does)
  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  // -------------------- State --------------------
  // Array of { role: "user" | "assistant", content: string }
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // -------------------- Effects --------------------
  // When the modal opens, set up the system message with subChapterContent
  useEffect(() => {
    // Clear out / reset whenever we open the modal
    setMessages([
      {
        role: "system",
        content: `You are a helpful assistant. The user is asking doubts about the following subchapter content:\n\n${subChapterContent}\n\nAnswer the user's questions based on this text.`,
      },
    ]);
    setUserInput("");
    setIsLoading(false);
  }, [isOpen, subChapterContent]);

  // -------------------- Functions --------------------
  // Sends user's message + updated context to ChatGPT
  const sendMessageToGPT = async (newUserMessage) => {
    const updatedMessages = [...messages, newUserMessage];
    try {
      setIsLoading(true);

      // POST to OpenAI Chat Completion
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: updatedMessages,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAIKey}`,
          },
        }
      );

      // Extract assistant's response
      const assistantReply = response.data?.choices?.[0]?.message?.content || "";
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (error) {
      console.error("OpenAI API error:", error);
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: "Sorry, I couldn't process your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // User hits "Send"
  const handleSend = () => {
    if (!userInput.trim()) return;
    const newUserMessage = { role: "user", content: userInput.trim() };
    setUserInput("");
    sendMessageToGPT(newUserMessage);
  };

  // -------------------- Styles (mirroring QuizModal) --------------------
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
    display: "flex",
    flexDirection: "column",
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

  const chatContainerStyle = {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: "4px",
    padding: "10px",
    marginBottom: "10px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  };

  const chatBubbleUser = {
    margin: "5px 0",
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "#e2f0ff",
    alignSelf: "flex-end",
    maxWidth: "80%",
  };

  const chatBubbleAssistant = {
    margin: "5px 0",
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "#f0f0f0",
    alignSelf: "flex-start",
    maxWidth: "80%",
  };

  const footerStyle = {
    display: "flex",
    alignItems: "center",
  };

  const inputStyle = {
    flex: 1,
    padding: "10px",
    marginRight: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  };

  const sendButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#203A43",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  // -------------------- Render w/ Portal --------------------
  return ReactDOM.createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button style={closeModalButtonStyle} onClick={onClose}>
          &times;
        </button>

        <h3 style={{ marginTop: 0 }}>
          Ask Your Doubts: {subChapterName || "Subchapter"}
        </h3>

        {/* Chat area */}
        <div style={chatContainerStyle}>
          {messages.map((msg, idx) => {
            if (msg.role === "system") {
              // Optionally hide system messages in UI
              return null;
            }
            const bubbleStyle = msg.role === "user" ? chatBubbleUser : chatBubbleAssistant;
            return (
              <div key={idx} style={bubbleStyle}>
                <strong>{msg.role.toUpperCase()}:</strong> {msg.content}
              </div>
            );
          })}
        </div>

        {/* Input + Send */}
        <div style={footerStyle}>
          <input
            style={inputStyle}
            type="text"
            placeholder="Type your doubt here..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button style={sendButtonStyle} onClick={handleSend} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>,
    portalRoot
  );
}

export default DoubtsModal;