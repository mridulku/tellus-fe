import React, { useState, useEffect, useRef } from "react";

function MaterialUploadWizard() {
  // Hard-coded user persona & goal
  const userType = "Academic Learner: 3rd-Year Graduate Student";
  const userGoal = "Complete the 'Advanced Algorithms' syllabus in 2 months";

  // Step-based animation
  // Each step has: a message, a start progress, an end progress, and a duration in ms
  const stepsData = [
    {
      message: "Analyzing Document Structure...",
      startPerc: 0,
      endPerc: 20,
      duration: 2000,
    },
    {
      message: "Reading Pages...",
      startPerc: 20,
      endPerc: 50,
      duration: 3000,
    },
    {
      message: "Breaking Down Chapters...",
      startPerc: 50,
      endPerc: 75,
      duration: 2000,
    },
    {
      message: "Identifying Sub-Chapters...",
      startPerc: 75,
      endPerc: 90,
      duration: 1500,
    },
    {
      message: "Generating Lesson & Testing Plan...",
      startPerc: 90,
      endPerc: 100,
      duration: 2000,
    },
  ];

  // State
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1); // which step we're on
  const [progress, setProgress] = useState(0);    // 0-100
  const [done, setDone] = useState(false);

  // Simulated breakdown data (shown after 100%)
  const [chaptersData, setChaptersData] = useState([]);

  const intervalRef = useRef(null);
  const stepStartTimeRef = useRef(null);

  // Clicking upload sets a dummy file name and triggers step 0
  const handleUpload = () => {
    setFileName("Advanced_Algorithms.pdf");
    setIsProcessing(true);
    setStepIndex(0);
    setProgress(0);
    setDone(false);
    setChaptersData([]);
  };

  // On stepIndex change, if we're within stepsData range, animate that step's progress
  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= stepsData.length) return;

    const { startPerc, endPerc, duration } = stepsData[stepIndex];

    // Start time & initial progress
    stepStartTimeRef.current = Date.now();
    setProgress(startPerc);

    // Clear any previous intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Animate progress from startPerc to endPerc over "duration" ms
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - stepStartTimeRef.current;
      const fraction = Math.min(1, elapsed / duration);
      const newProgress = startPerc + fraction * (endPerc - startPerc);
      setProgress(newProgress);

      // If we've reached the end of this step
      if (fraction === 1) {
        clearInterval(intervalRef.current);
        // Move to next step, or finish if at last step
        if (stepIndex + 1 < stepsData.length) {
          setStepIndex(stepIndex + 1);
        } else {
          // Processing is done
          setIsProcessing(false);
          setDone(true);
          showFinalBreakdown(); // fill chaptersData
        }
      }
    }, 40);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [stepIndex]);

  // Once completed, show final breakdown (dummy data)
  const showFinalBreakdown = () => {
    setChaptersData([
      {
        chapterName: "Chapter 1: Introduction to Algorithmic Complexity",
        subChapters: [
          { subChapterName: "1.1 Big-O Notation", estimatedTime: 30 },
          { subChapterName: "1.2 Basic Complexity Classes", estimatedTime: 20 },
        ],
      },
      {
        chapterName: "Chapter 2: Divide and Conquer",
        subChapters: [
          { subChapterName: "2.1 Merge Sort", estimatedTime: 45 },
          { subChapterName: "2.2 Quick Sort", estimatedTime: 35 },
        ],
      },
      {
        chapterName: "Chapter 3: Graph Algorithms",
        subChapters: [
          { subChapterName: "3.1 DFS & BFS", estimatedTime: 40 },
          { subChapterName: "3.2 Shortest Paths", estimatedTime: 50 },
        ],
      },
    ]);
  };

  // Styling
  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "20px",
    fontFamily: "'Open Sans', sans-serif",
    color: "#fff",
  };

  const cardStyle = {
    width: "90%",
    maxWidth: "1000px",
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: "10px",
    padding: "30px",
    boxSizing: "border-box",
    marginTop: "20px",
  };

  const userTypeStyle = {
    margin: 0,
    fontSize: "1.2rem",
  };

  const goalStyle = {
    margin: 0,
    fontSize: "1rem",
    marginBottom: "20px",
    fontStyle: "italic",
  };

  const uploadButtonStyle = {
    padding: "12px 20px",
    border: "none",
    borderRadius: "4px",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginBottom: "20px",
  };

  const progressContainerStyle = {
    marginTop: "20px",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    padding: "15px",
  };

  const progressBarBackgroundStyle = {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "6px",
    height: "12px",
    overflow: "hidden",
    margin: "10px 0",
  };

  const progressBarFillStyle = {
    height: "100%",
    width: `${progress}%`,
    backgroundColor: "#FFD700",
    transition: "width 0.1s",
  };

  const stepMessageStyle = {
    margin: 0,
    fontSize: "1rem",
    fontWeight: "bold",
    marginBottom: "10px",
  };

  const chaptersContainerStyle = {
    marginTop: "30px",
  };

  const chapterCardStyle = {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: "6px",
    padding: "15px",
    marginBottom: "15px",
  };

  const subChapterItemStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "4px",
    padding: "10px",
    margin: "6px 0",
  };

  // Get the current step message
  const currentStepMessage =
    stepIndex >= 0 && stepIndex < stepsData.length
      ? stepsData[stepIndex].message
      : "";

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Upload Learning Material</h1>
        <p style={userTypeStyle}>{userType}</p>
        <p style={goalStyle}>Target: {userGoal}</p>

        {!done && (
          <button
            style={uploadButtonStyle}
            onClick={handleUpload}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            disabled={isProcessing}
          >
            Upload Material
          </button>
        )}

        {fileName && !done && <p>File Selected: <strong>{fileName}</strong></p>}

        {/* Processing Progress */}
        {isProcessing && (
          <div style={progressContainerStyle}>
            <p style={stepMessageStyle}>{currentStepMessage}</p>
            <div style={progressBarBackgroundStyle}>
              <div style={progressBarFillStyle}></div>
            </div>
            <p style={{ margin: 0 }}>{Math.floor(progress)}% completed</p>
          </div>
        )}

        {/* Final Breakdown */}
        {done && (
          <div style={chaptersContainerStyle}>
            <h2 style={{ marginTop: 0 }}>Material Breakdown</h2>
            <p>
              We've identified <strong>{chaptersData.length} chapters</strong>.
              Below is the recommended breakdown:
            </p>
            {chaptersData.map((chapter, cIndex) => (
              <div style={chapterCardStyle} key={cIndex}>
                <h3 style={{ marginTop: 0, marginBottom: "10px" }}>
                  {chapter.chapterName}
                </h3>
                {chapter.subChapters.map((sub, sIndex) => (
                  <div style={subChapterItemStyle} key={sIndex}>
                    <p style={{ margin: 0 }}>
                      <strong>{sub.subChapterName}</strong>
                    </p>
                    <p style={{ margin: 0 }}>
                      Estimated Time: {sub.estimatedTime} minutes
                    </p>
                  </div>
                ))}
              </div>
            ))}
            <p style={{ marginTop: "20px" }}>
              A <strong>testing plan</strong> has also been generated for each sub-chapter 
              (quizzes, flashcards, etc.). Let’s get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MaterialUploadWizard;