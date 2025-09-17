import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Onboarding() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Adjust backend URL as needed
//  const backendURL = "http://localhost:3001";

  const backendURL = import.meta.env.VITE_BACKEND_URL;


  /**
   * State to capture onboarding inputs.
   * Structure:
   * {
   *   topics: [],        // e.g. ['Math', 'Programming']
   *   timeCommitment: '',// e.g. '1-3 hours/week'
   *   learningGoal: '',  // e.g. 'Career Advancement'
   *   motivation: '',    // short free-form text
   * }
   */
  const [formData, setFormData] = useState({
    topics: [],
    timeCommitment: "",
    learningGoal: "",
    motivation: "",
  });

  // Possible topics for checkboxes
  const availableTopics = [
    "Mathematics",
    "Programming",
    "Physics",
    "History",
    "Art & Design",
    "Business & Marketing",
    "Language Learning",
    "Psychology",
    "Philosophy",
    "Music Theory",
  ];

  // Handle checkbox changes
  const handleTopicChange = (topic) => {
    setFormData((prev) => {
      // If already in array, remove it; otherwise, add it
      const topicsSet = new Set(prev.topics);
      if (topicsSet.has(topic)) {
        topicsSet.delete(topic);
      } else {
        topicsSet.add(topic);
      }
      return { ...prev, topics: Array.from(topicsSet) };
    });
  };

  // Handle all other input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // We want to pass formData as { answers: formData }
      // because the backend expects "answers" in the body
      await axios.post(
        `${backendURL}/complete-onboarding`,
        { answers: formData },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Navigate to home or main page upon success
      navigate("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("Failed to submit onboarding data. Check console for details.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Open Sans', sans-serif",
        color: "#fff",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          borderRadius: "10px",
          padding: "40px",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
          Tell Us About Your Learning Goals
        </h1>

        {/* Topics of Interest (Checkboxes) */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "10px" }}>1. Which topics interest you?</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            {availableTopics.map((topic) => (
              <label
                key={topic}
                style={{
                  background: formData.topics.includes(topic)
                    ? "#FFD700"
                    : "rgba(255,255,255,0.2)",
                  color: formData.topics.includes(topic) ? "#000" : "#fff",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <input
                  type="checkbox"
                  value={topic}
                  checked={formData.topics.includes(topic)}
                  onChange={() => handleTopicChange(topic)}
                  style={{ display: "none" }}
                />
                {topic}
              </label>
            ))}
          </div>
        </div>

        {/* Time Commitment (Select) */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "10px" }}>
            2. How much time can you devote each week?
          </h3>
          <select
            name="timeCommitment"
            value={formData.timeCommitment}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              outline: "none",
              fontSize: "1rem",
            }}
            required
          >
            <option value="">Select One</option>
            <option value="Less than 1 hour">Less than 1 hour</option>
            <option value="1-3 hours">1-3 hours</option>
            <option value="3-5 hours">3-5 hours</option>
            <option value="5+ hours">5+ hours</option>
          </select>
        </div>

        {/* Primary Goal (Select or Text) */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "10px" }}>3. What is your main learning goal?</h3>
          <select
            name="learningGoal"
            value={formData.learningGoal}
            onChange={handleInputChange}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              outline: "none",
              fontSize: "1rem",
            }}
            required
          >
            <option value="">Select One</option>
            <option value="Career Advancement">Career Advancement</option>
            <option value="Personal Hobby">Personal Hobby</option>
            <option value="Academic Excellence">Academic Excellence</option>
            <option value="Professional Certification">Professional Certification</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Motivation (Short Text) */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginBottom: "10px" }}>
            4. Any specific goals or reasons for learning?
          </h3>
          <textarea
            name="motivation"
            value={formData.motivation}
            onChange={handleInputChange}
            rows="3"
            placeholder="Share a little about why you want to learn these topics..."
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "4px",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            display: "block",
            width: "100%",
            padding: "15px 0",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "4px",
            background: "#FFD700",
            color: "#000",
            cursor: "pointer",
            transition: "opacity 0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Complete Onboarding
        </button>
      </form>
    </div>
  );
}

export default Onboarding;