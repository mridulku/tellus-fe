import React, { useState } from "react";
import { FiPlus } from "react-icons/fi"; // or any other icons you like

export default function FloatingActions({
  onOpenQuiz,
  onOpenSummaries,
  onOpenDoubts,
  onOpenTutor,
  disabled,
}) {
  const [open, setOpen] = useState(false);

  const containerStyle = {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "flex-end",
    gap: "10px",
  };

  const fabStyle = {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "#FFD700",
    color: "#000",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.2rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  };

  const actionButtonStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    background: "#FFD700",
    color: "#000",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  };

  const handleToggle = () => {
    if (!disabled) setOpen(!open);
  };

  return (
    <div style={containerStyle}>
      {open && !disabled && (
        <>
          <button style={actionButtonStyle} onClick={onOpenQuiz}>
            Quiz
          </button>
          <button style={actionButtonStyle} onClick={onOpenSummaries}>
            Summaries
          </button>
          <button style={actionButtonStyle} onClick={onOpenDoubts}>
            Doubts
          </button>
          <button style={actionButtonStyle} onClick={onOpenTutor}>
            Tutor
          </button>
        </>
      )}

      <button style={fabStyle} onClick={handleToggle}>
        <FiPlus />
      </button>
    </div>
  );
}