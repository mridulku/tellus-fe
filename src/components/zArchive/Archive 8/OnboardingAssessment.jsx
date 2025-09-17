import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const backendURL = import.meta.env.VITE_BACKEND_URL;

function OnboardingAssessment() {
  const navigate = useNavigate();

  /********************************************
   * State: Reading Timer
   ********************************************/
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  /********************************************
   * State: Comprehension Question
   ********************************************/
  const [comprehensionAnswer, setComprehensionAnswer] = useState(null);
  const [comprehensionScore, setComprehensionScore] = useState(null);

  // Example single comprehension question
  const readingQuestion = {
    question: "Which of the following statements is true based on the passage?",
    options: [
      "Tea was first discovered in Europe in the sixteenth century.",
      "The soothing ritual of tea drinking has changed drastically over time.",
      "Bubble tea and matcha lattes are examples of modern innovations in tea culture.",
      "Tea never became popular in British culture.",

    ],
    correctIndex: 2,
  };

  /********************************************
   * State: Learning Style
   ********************************************/
  // Simple single select for learning style
  const [learningStyle, setLearningStyle] = useState("Text Summaries");

  /********************************************
   * Reading Passage
   ********************************************/
  const readingPassage = `	Tea, one of the most widely consumed beverages in the world, has its origins in ancient China, where legend has it that Emperor Shen Nong discovered its refreshing properties by accident nearly five thousand years ago. Over time, various regions across Asia developed unique methods of cultivation and preparation, leading to a rich array of tea varieties such as green, black, oolong, and white. With the expansion of global trade routes, tea reached Europe in the sixteenth century, eventually becoming a staple in British culture. Today, tea continues to evolve, with innovations like bubble tea and matcha lattes gaining popularity worldwide. Although trends come and go, the soothing ritual of sipping a warm cup of tea has remained largely unchanged, bridging cultural gaps and offering a moment of tranquility in an increasingly hectic world. Some historians even credit tea with fostering social bonding and diplomatic exchanges in many regions.
`;

  // Count the words if you want an actual WPM measure
  const wordCount = readingPassage.split(/\s+/).length;

  /********************************************
   * Handlers: Begin / End Reading
   ********************************************/
  const handleBeginReading = () => {
    setStartTime(Date.now());
    setEndTime(null);
    setComprehensionScore(null); // reset if re-done
  };

  const handleDoneReading = () => {
    setEndTime(Date.now());
  };

  // Calculate total reading time in seconds
  const getReadingTimeSec = () => {
    if (!startTime || !endTime) return null;
    const diffMs = endTime - startTime;
    return (diffMs / 1000).toFixed(1);
  };

  // (Optional) If you want WPM:
  // const getReadingSpeedWPM = () => {
  //   const readingTimeMin = (endTime - startTime) / 60000;
  //   return (wordCount / readingTimeMin).toFixed(0);
  // };

  /********************************************
   * Handler: Submit Comprehension
   ********************************************/
  const handleCheckComprehension = () => {
    if (comprehensionAnswer == null) return;
    // If user’s selected answer index equals correctIndex => score=1, else 0
    const score = comprehensionAnswer === readingQuestion.correctIndex ? 1 : 0;
    setComprehensionScore(score);
  };

  /********************************************
   * Handler: Submit Final Data
   ********************************************/
  const handleSubmitAll = async () => {
    if (!endTime) {
      alert("Please finish reading (click 'Done Reading') before submitting.");
      return;
    }
    if (comprehensionScore == null) {
      alert("Please submit your comprehension answer first.");
      return;
    }

    const readingTimeSec = getReadingTimeSec();

    // Prepare data
    const formData = {
      readingTimeSec,
      comprehensionScore,
      learningStyle,
      // If you wanted WPM:
      // readingSpeedWPM: getReadingSpeedWPM(),
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${backendURL}/onboardingassessment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Navigate to next page or success page
        navigate("/personalizationprogress");
      } else {
        console.error("Error saving assessment:", response.data);
      }
    } catch (error) {
      console.error("Error submitting form data:", error);
    }
  };

  /********************************************
   * Render
   ********************************************/
  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Onboarding Assessment</h2>

        {/** Reading Timer & Passage **/}
        {!startTime && !endTime && (
          <>
            <p style={{ marginBottom: "1rem" }}>
              Please click "Begin Reading" then read the passage below. Your time will start as soon as you press Begin Reading. So start reading and press Done Reading when complete. Read in your normal pace.
            </p>
            <button style={buttonStyle} onClick={handleBeginReading}>
              Begin Reading
            </button>
          </>
        )}

        {startTime && !endTime && (
          <>
            <p style={{ fontStyle: "italic" }}>
              Timer started! Once you finish reading the passage, click{" "}
              <strong>“Done Reading.”</strong>
            </p>
            <div style={readingPassageStyle}>{readingPassage}</div>
            <button style={buttonStyle} onClick={handleDoneReading}>
              Done Reading
            </button>
          </>
        )}

        {endTime && (
          <>
            <p>
              <strong>Reading Time:</strong> {getReadingTimeSec()} seconds
            </p>
          </>
        )}

        {/** Comprehension Question **/}
        {endTime && (
          <div style={questionBoxStyle}>
            <h3>Quick Comprehension Check</h3>
            <p>{readingQuestion.question}</p>
            {readingQuestion.options.map((opt, idx) => {
              const radioId = `comp_${idx}`;
              return (
                <div key={idx}>
                  <label htmlFor={radioId} style={{ cursor: "pointer" }}>
                    <input
                      type="radio"
                      id={radioId}
                      name="comprehension"
                      value={idx}
                      checked={comprehensionAnswer === idx}
                      onChange={() => setComprehensionAnswer(idx)}
                    />
                    {opt}
                  </label>
                </div>
              );
            })}

            {comprehensionScore == null ? (
              <button style={buttonStyle} onClick={handleCheckComprehension}>
                Submit Comprehension Answer
              </button>
            ) : (
              <p style={{ marginTop: "10px" }}>
                <strong>
                  You got {comprehensionScore} out of 1 correct.{" "}
                  {comprehensionScore === 1
                    ? "Good job!"
                    : "Keep practicing!"}
                </strong>
              </p>
            )}
          </div>
        )}

        {/** Learning Style Question **/}
        {endTime && comprehensionScore !== null && (
          <div style={questionBoxStyle}>
            <h3>Learning Style</h3>
            <p>Which format appeals to you most?</p>
            <select
              style={dropdownStyle}
              value={learningStyle}
              onChange={(e) => setLearningStyle(e.target.value)}
            >
            <option value="Bullet-Point Summaries">Bullet-Point Summaries</option>
            <option value="Detailed Paragraphs">Detailed Paragraph Explanations</option>
            <option value="Step-by-Step Text">Step-by-Step (Chunked) Explanations</option>
            <option value="Real-World Analogies">Real-World Analogies & Cases</option>
            </select>
          </div>
        )}

        {/** Submit Button **/}
        {endTime && comprehensionScore !== null && (
          <div style={{ marginTop: "20px" }}>
            <button style={buttonStyle} onClick={handleSubmitAll}>
              Submit & Complete Onboarding
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/********************************************
 * Styles
 ********************************************/
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Open Sans', sans-serif",
  padding: "20px",
};

const panelStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "10px",
  width: "600px",
  maxWidth: "100%",
};

const sectionTitleStyle = {
  marginTop: 0,
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  paddingBottom: "5px",
  marginBottom: "20px",
};

const readingPassageStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "10px",
  whiteSpace: "pre-line",
};

const buttonStyle = {
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  background: "#FFD700",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
};

const questionBoxStyle = {
  marginTop: "20px",
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "15px",
  borderRadius: "6px",
};

const dropdownStyle = {
  marginTop: "10px",
  padding: "5px 10px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  width: "100%",
  maxWidth: "250px",
};

export default OnboardingAssessment;