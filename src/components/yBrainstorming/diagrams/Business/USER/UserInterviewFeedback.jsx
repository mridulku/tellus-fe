import React, { useState } from 'react';

const interviewSections = [
  {
    id: "journey",
    title: "Study Journey",
    questions: [
      { id: "routine", question: "Describe your typical study routine.", type: "textarea" },
      { id: "tools", question: "What tools or methods do you use while studying?", type: "textarea" },
      { id: "planning", question: "How do you plan your study sessions?", type: "textarea" }
    ]
  },
  {
    id: "painPoints",
    title: "Pain Points & Challenges",
    questions: [
      { id: "challenges", question: "What are the main challenges you face in your study process?", type: "textarea" },
      { id: "timeConsuming", question: "Which part of your study routine is the most time-consuming?", type: "textarea" },
      { id: "hoursSpent", question: "Approximately how many hours per week do you spend dealing with these challenges?", type: "number" }
    ]
  },
  {
    id: "alignment",
    title: "Process Alignment",
    questions: [
      { id: "improvements", question: "How do you think your study process could be improved?", type: "textarea" },
      { id: "features", question: "What features would you like to see in a tool that supports your study process?", type: "textarea" },
      { id: "betaTest", question: "Would you be interested in beta testing a product tailored to your needs?", type: "radio", options: ["Yes", "No"] }
    ]
  }
];

const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#0F0F0F",
    color: "#fff",
    fontFamily: "Arial, sans-serif",
    maxWidth: "800px",
    margin: "0 auto"
  },
  header: {
    textAlign: "center",
    marginBottom: "1.5rem",
    fontSize: "1.8rem",
    fontWeight: "bold"
  },
  sectionCard: {
    border: "1px solid #444",
    borderRadius: "4px",
    marginBottom: "1rem",
    padding: "1rem"
  },
  sectionTitle: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
    cursor: "pointer"
  },
  question: {
    marginBottom: "0.75rem"
  },
  input: {
    width: "100%",
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginTop: "0.25rem"
  },
  radioGroup: {
    display: "flex",
    alignItems: "center",
    marginTop: "0.25rem"
  },
  radioOption: {
    marginRight: "1rem"
  },
  submitButton: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem"
  }
};

export default function UserInterviewFeedback() {
  // Track whether each section is expanded
  const [openSections, setOpenSections] = useState({});
  // Store interview responses, keys are "sectionId-questionId"
  const [responses, setResponses] = useState({});

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleChange = (sectionId, questionId, value) => {
    const key = `${sectionId}-${questionId}`;
    setResponses((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Interview Responses:", responses);
    alert("Thank you for your feedback!");
    // In a real application, you would submit responses to your backend here.
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>User Interview Feedback</div>
      <form onSubmit={handleSubmit}>
        {interviewSections.map((section) => (
          <div key={section.id} style={styles.sectionCard}>
            <div style={styles.sectionTitle} onClick={() => toggleSection(section.id)}>
              {section.title}
            </div>
            {openSections[section.id] &&
              section.questions.map((q) => (
                <div key={q.id} style={styles.question}>
                  <label>{q.question}</label>
                  {q.type === "textarea" && (
                    <textarea
                      style={styles.input}
                      rows="4"
                      value={responses[`${section.id}-${q.id}`] || ""}
                      onChange={(e) => handleChange(section.id, q.id, e.target.value)}
                    />
                  )}
                  {q.type === "number" && (
                    <input
                      type="number"
                      style={styles.input}
                      value={responses[`${section.id}-${q.id}`] || ""}
                      onChange={(e) => handleChange(section.id, q.id, e.target.value)}
                    />
                  )}
                  {q.type === "radio" && (
                    <div style={styles.radioGroup}>
                      {q.options.map((option) => (
                        <label key={option} style={styles.radioOption}>
                          <input
                            type="radio"
                            name={`${section.id}-${q.id}`}
                            value={option}
                            checked={responses[`${section.id}-${q.id}`] === option}
                            onChange={(e) => handleChange(section.id, q.id, e.target.value)}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button type="submit" style={styles.submitButton}>
            Submit Interview
          </button>
        </div>
      </form>
    </div>
  );
}