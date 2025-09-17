// File: QuestionTypePlayground.jsx

import React, { useState, useEffect } from "react";
import { db } from "../../../../../../firebase"; // your Firebase config
import { collection, getDocs } from "firebase/firestore";

import { generateQuestions } from "./QuestionGenerator";
import { gradeQuestion } from "./QuestionGrader";
import QuestionRenderer from "./QuestionRenderer";

export default function QuestionTypePlayground() {
  // STATE
  const [questionTypes, setQuestionTypes] = useState([]);
  const [selectedTypeName, setSelectedTypeName] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [subChapterId, setSubChapterId] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [subchapterSummary, setSubchapterSummary] = useState("");

  const [userAnswers, setUserAnswers] = useState([]);
  const [gradingResults, setGradingResults] = useState([]);
  const [showGradingResults, setShowGradingResults] = useState(false);

  // 1) Fetch question types on mount
  useEffect(() => {
    async function fetchQuestionTypes() {
      try {
        const qSnap = await getDocs(collection(db, "questionTypes"));
        const typesArr = [];
        qSnap.forEach((docSnap) => {
          typesArr.push({ id: docSnap.id, ...docSnap.data() });
        });
        setQuestionTypes(typesArr);
      } catch (err) {
        console.error("Error fetching question types:", err);
      }
    }
    fetchQuestionTypes();
  }, []);

  // 2) Generate questions
  async function handleGenerate() {
    if (!openAiKey) {
      alert("Please enter an OpenAI API key (for POC only).");
      return;
    }
    if (!selectedTypeName) {
      alert("Please select a question type.");
      return;
    }
    if (!subChapterId) {
      alert("Please enter a subChapterId.");
      return;
    }

    setLoading(true);
    setStatus("Generating questions...");

    // (a) Find the question type doc
    const qTypeDoc = questionTypes.find((qt) => qt.name === selectedTypeName);
    if (!qTypeDoc) {
      setLoading(false);
      setStatus(`No question type doc found for name = ${selectedTypeName}`);
      return;
    }

    // (b) Call our generateQuestions utility
    const result = await generateQuestions({
      db,
      subChapterId,
      openAiKey,
      selectedTypeName,
      questionTypeDoc: qTypeDoc,
      numberOfQuestions,
    });

    if (!result.success) {
      // an error occurred
      setLoading(false);
      setStatus(result.error || "Error generating questions");
      // we can store partial data if we want:
      setGeneratedQuestions(result.questionsData); // might hold error + raw
      return;
    }

    // If successful:
    setStatus("Questions generated successfully.");
    setSubchapterSummary(result.subchapterSummary || "");
    setGeneratedQuestions(result.questionsData); // { "questions": [ ... ] }

    // Initialize userAnswers + reset grading
    if (Array.isArray(result.questionsData?.questions)) {
      const initialAnswers = result.questionsData.questions.map(() => "");
      setUserAnswers(initialAnswers);
    } else {
      setUserAnswers([]);
    }
    setGradingResults([]);
    setShowGradingResults(false);

    setLoading(false);
  }

  // 3) Render the question form
  function renderQuestionsAsForm() {
    if (!generatedQuestions) return null;
    if (generatedQuestions.error) {
      return (
        <div style={{ color: "red" }}>
          <p>{generatedQuestions.error}</p>
          <pre style={styles.pre}>{generatedQuestions.raw}</pre>
        </div>
      );
    }

    const questionsArr = generatedQuestions.questions || [];
    if (!questionsArr.length) return <p>No questions found.</p>;

    return (
      <div style={{ marginTop: "1rem" }}>
        <h3>Take the Quiz</h3>
        {questionsArr.map((questionObj, idx) => (
          <div key={idx} style={styles.questionContainer}>
            <QuestionRenderer
              questionObj={questionObj}
              index={idx}
              userAnswer={userAnswers[idx]}
              onUserAnswerChange={(val) => handleAnswerChange(idx, val)}
            />
          </div>
        ))}
        <button style={styles.submitBtn} onClick={handleQuizSubmit}>
          Submit All
        </button>
      </div>
    );
  }

  function handleAnswerChange(index, newVal) {
    const updated = [...userAnswers];
    updated[index] = newVal;
    setUserAnswers(updated);
  }

  // 4) Submit All => calls grading for each question
  async function handleQuizSubmit() {
    if (!generatedQuestions?.questions) {
      alert("No questions to submit.");
      return;
    }
    if (!openAiKey) {
      alert("Please enter an OpenAI API key before submitting.");
      return;
    }

    setLoading(true);
    setStatus("Grading in progress...");

    const newGradingResults = [];
    const questionsArr = generatedQuestions.questions;

    // Synchronous or Promise.all - here we do a simple for-loop
    for (let i = 0; i < questionsArr.length; i++) {
      const questionObj = questionsArr[i];
      const userAnswer = userAnswers[i] || "";

      const gradeRes = await gradeQuestion({
        openAiKey,
        subchapterSummary,
        questionObj,
        userAnswer,
      });

      newGradingResults.push(gradeRes);
    }

    setGradingResults(newGradingResults);
    setShowGradingResults(true);

    setStatus("Grading complete.");
    setLoading(false);
  }

  // 5) Render grading results
  function renderGradingResults() {
    if (!showGradingResults || !gradingResults.length) return null;
    const totalScore = gradingResults.reduce((acc, r) => acc + (r.score || 0), 0);

    return (
      <div style={styles.gradingContainer}>
        <h3>Grading Results</h3>
        {gradingResults.map((res, i) => (
          <div key={i} style={styles.gradingResult}>
            <b>Question {i + 1}:</b>
            <p>
              Score: {res.score}
              <br />
              Feedback: {res.feedback}
            </p>
          </div>
        ))}
        <p>
          <b>Total Score:</b> {totalScore}
        </p>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Question Type Playground (Modular Version)</h2>

      {loading && <p style={styles.text}>Loading... {status}</p>}
      {!loading && status && <p style={{ color: "lightgreen" }}>{status}</p>}

      {/* OpenAI key */}
      <div style={styles.fieldBlock}>
        <label style={styles.label}>OpenAI API Key (POC only):</label>
        <input
          type="text"
          style={styles.input}
          value={openAiKey}
          onChange={(e) => setOpenAiKey(e.target.value)}
        />
      </div>

      {/* Subchapter ID */}
      <div style={styles.fieldBlock}>
        <label style={styles.label}>SubChapter ID:</label>
        <input
          type="text"
          style={styles.input}
          value={subChapterId}
          onChange={(e) => setSubChapterId(e.target.value)}
        />
      </div>

      {/* number of questions */}
      <div style={styles.fieldBlock}>
        <label style={styles.label}>Number of Questions:</label>
        <input
          type="number"
          style={styles.input}
          value={numberOfQuestions}
          onChange={(e) => setNumberOfQuestions(e.target.value)}
        />
      </div>

      {/* question type dropdown */}
      <div style={styles.fieldBlock}>
        <label style={styles.label}>Select Question Type:</label>
        <select
          style={styles.input}
          value={selectedTypeName}
          onChange={(e) => setSelectedTypeName(e.target.value)}
        >
          <option value="">--Select--</option>
          {questionTypes.map((qt) => (
            <option key={qt.id} value={qt.name}>
              {qt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Generate button */}
      <button style={styles.button} onClick={handleGenerate}>
        Generate Questions
      </button>

      {/* Render the question form (with the user’s inputs) */}
      {renderQuestionsAsForm()}

      {/* Render grading results */}
      {renderGradingResults()}
    </div>
  );
}

// Reusable style objects
const styles = {
  container: {
    padding: "1rem",
    color: "#fff",
    maxWidth: "600px",
    margin: "0 auto",
  },
  heading: {
    marginBottom: "1rem",
  },
  fieldBlock: {
    marginBottom: "0.75rem",
  },
  label: {
    display: "block",
    marginBottom: "0.25rem",
  },
  input: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    borderRadius: "4px",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  text: {
    color: "#fff",
  },
  questionContainer: {
    backgroundColor: "#333",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  submitBtn: {
    padding: "8px 16px",
    backgroundColor: "purple",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  pre: {
    whiteSpace: "pre-wrap",
    color: "#fff",
    margin: 0,
    marginTop: "0.5rem",
    backgroundColor: "#222",
    padding: "8px",
    borderRadius: "4px",
  },
  gradingContainer: {
    marginTop: "1rem",
    backgroundColor: "#222",
    padding: "1rem",
    borderRadius: "4px",
  },
  gradingResult: {
    marginBottom: "1rem",
    border: "1px solid #555",
    padding: "0.5rem",
    borderRadius: "4px",
  },
};