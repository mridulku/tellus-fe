import React, { useEffect, useState, useRef } from "react";

function TestView() {
  // Hardcoded scope data
  const scope = {
    book: "React 101",
    chapter: "Introduction",
    subChapter: "Basics",
  };

  // Hardcoded time limit (in seconds)
  const timeLimit = 300; // 300s = 5 minutes

  // Hardcoded sample questions (MCQ)
  const questions = [
    {
      id: 1,
      text: "What does JSX stand for?",
      options: [
        "JavaScript XML",
        "JSON Xpress",
        "JavaXtra Script",
        "None of the above",
      ],
      correctIndex: 0, // "JavaScript XML"
    },
    {
      id: 2,
      text: "Which hook is used for side effects in React?",
      options: [
        "useContext",
        "useState",
        "useEffect",
        "useCallback",
      ],
      correctIndex: 2, // "useEffect"
    },
    {
      id: 3,
      text: "Which statement is true about React components?",
      options: [
        "They must be class-based",
        "They must be named 'App'",
        "They can be class or function components",
        "They are written in HTML only",
      ],
      correctIndex: 2, // "They can be class or function components"
    },
  ];

  // Timer state
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef(null);

  // Store user answers: userSelections[i] = index of chosen option, or null if unselected
  const [userSelections, setUserSelections] = useState(
    Array(questions.length).fill(null)
  );

  const [testSubmitted, setTestSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // ======== Timer Logic ========
  useEffect(() => {
    if (!testSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(); // Auto-submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [testSubmitted]);

  // Helper to format time as mm:ss
  const formatTime = (seconds) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm.toString().padStart(2, "0")}:${ss
      .toString()
      .padStart(2, "0")}`;
  };

  // ======== Submission Logic ========
  const handleOptionSelect = (qIndex, optionIndex) => {
    if (testSubmitted) return; // Prevent changing answers after submit
    const newSelections = [...userSelections];
    newSelections[qIndex] = optionIndex;
    setUserSelections(newSelections);
  };

  const handleSubmit = () => {
    if (testSubmitted) return; // Already submitted
    setTestSubmitted(true);
    clearInterval(timerRef.current);

    // Simple scoring: +1 for each correct
    let correctCount = 0;
    questions.forEach((q, i) => {
      if (userSelections[i] === q.correctIndex) correctCount++;
    });
    setScore(correctCount);
  };

  // ======== STYLES ========
  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "20px",
    color: "#fff",
    fontFamily: "'Open Sans', sans-serif",
  };

  const contentStyle = {
    width: "90%",
    maxWidth: "900px",
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: "10px",
    padding: "30px",
    boxSizing: "border-box",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  };

  const scopeStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  const timerStyle = {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "6px",
    padding: "10px 15px",
    fontWeight: "bold",
    fontSize: "1.2rem",
  };

  const questionCardStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    marginBottom: "20px",
    borderRadius: "6px",
    padding: "15px",
  };

  const questionTextStyle = {
    marginBottom: "10px",
    fontSize: "1.1rem",
    fontWeight: "bold",
  };

  const optionStyle = (isSelected, isCorrect = null) => {
    let base = {
      padding: "8px 10px",
      marginBottom: "8px",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.3s",
      border: "1px solid transparent",
    };

    if (testSubmitted && isCorrect === true) {
      // Mark correct option in green
      return {
        ...base,
        backgroundColor: "rgba(0,255,0,0.3)",
        border: "1px solid green",
      };
    } else if (testSubmitted && isCorrect === false && isSelected) {
      // Mark the incorrectly chosen option in red
      return {
        ...base,
        backgroundColor: "rgba(255,0,0,0.3)",
        border: "1px solid red",
      };
    } else {
      // If test not submitted or option not selected
      return {
        ...base,
        backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : "transparent",
      };
    }
  };

  const buttonStyle = {
    padding: "12px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginRight: "10px",
  };

  // ======== RENDER ========
  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header with Timer */}
        <div style={headerStyle}>
          <h1 style={{ margin: 0 }}>Test</h1>
          <div style={timerStyle}>
            Time Left: {formatTime(timeLeft)}
          </div>
        </div>

        {/* Scope Info */}
        <div style={scopeStyle}>
          <h3 style={{ margin: "0 0 10px 0" }}>Scope of This Test</h3>
          {scope?.book && <p style={{ margin: 0 }}>Book: {scope.book}</p>}
          {scope?.chapter && <p style={{ margin: 0 }}>Chapter: {scope.chapter}</p>}
          {scope?.subChapter && (
            <p style={{ margin: 0 }}>Sub-chapter: {scope.subChapter}</p>
          )}
        </div>

        {/* Questions List */}
        {questions.map((q, qIndex) => {
          // Highlight correct/incorrect if test is submitted
          return (
            <div style={questionCardStyle} key={q.id || qIndex}>
              <div style={questionTextStyle}>
                Q{qIndex + 1}. {q.text}
              </div>
              {q.options.map((opt, optIndex) => {
                const isSelected = userSelections[qIndex] === optIndex;
                const isCorrect = optIndex === q.correctIndex;
                return (
                  <div
                    key={optIndex}
                    style={optionStyle(
                      isSelected,
                      testSubmitted ? isCorrect : null
                    )}
                    onClick={() => handleOptionSelect(qIndex, optIndex)}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Submit/Score */}
        {!testSubmitted ? (
          <button
            style={buttonStyle}
            onClick={handleSubmit}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Submit Test
          </button>
        ) : (
          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              padding: "10px",
              borderRadius: "6px",
              marginTop: "20px",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Test Results</h3>
            <p style={{ margin: 0 }}>
              Your Score: {score} / {questions.length}
            </p>
            <p style={{ margin: 0 }}>
              Percentage: {((score / questions.length) * 100).toFixed(2)}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestView;