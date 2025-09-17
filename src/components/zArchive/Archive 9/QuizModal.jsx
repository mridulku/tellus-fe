import React from "react";

export default function QuizModal({
  quizData,
  selectedAnswers,
  quizSubmitted,
  score,
  handleOptionSelect,
  handleSubmitQuiz,
  onClose,
}) {
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
  const modalStyle = {
    background: "#fff",
    color: "#000",
    width: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    position: "relative",
  };
  const closeButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
  };

  if (!quizData || quizData.length === 0) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <button style={closeButtonStyle} onClick={onClose}>
            ✕
          </button>
          <h2>Quiz</h2>
          <p>No quiz available.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button style={closeButtonStyle} onClick={onClose}>
          ✕
        </button>
        <h2>Quiz</h2>
        {quizData.map((q, idx) => {
          const userSelection = selectedAnswers[idx];
          const isCorrect = userSelection === q.correctAnswerIndex;
          return (
            <div
              key={idx}
              style={{
                marginBottom: "15px",
                borderBottom: "1px solid #ccc",
                paddingBottom: "10px",
              }}
            >
              <p>
                <strong>Q{idx + 1}:</strong> {q.questionText}
              </p>
              {q.options.map((optionText, optionIdx) => (
                <label key={optionIdx} style={{ display: "block", marginLeft: "20px" }}>
                  <input
                    type="radio"
                    name={`question_${idx}`}
                    checked={userSelection === optionIdx}
                    onChange={() => handleOptionSelect(idx, optionIdx)}
                  />
                  {optionText}
                </label>
              ))}
              {/* If submitted, show correctness */}
              {quizSubmitted && (
                <div style={{ marginTop: "5px" }}>
                  {userSelection === undefined ? (
                    <span style={{ color: "orange" }}>No answer chosen.</span>
                  ) : isCorrect ? (
                    <span style={{ color: "green" }}>Correct!</span>
                  ) : (
                    <span style={{ color: "red" }}>Incorrect!</span>
                  )}
                  <div style={{ fontStyle: "italic", marginTop: "3px" }}>
                    Explanation: {q.explanation}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!quizSubmitted ? (
          <button
            onClick={handleSubmitQuiz}
            style={{ padding: "8px 12px", background: "#203A43", color: "#fff" }}
          >
            Submit Quiz
          </button>
        ) : (
          <p>
            You scored {score} / {quizData.length}
          </p>
        )}
      </div>
    </div>
  );
}