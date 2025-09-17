// LearnerPersonaForm.jsx

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Import subform components
import AcademicForm from "./AcademicForm";
import CompetitiveForm from "./CompetitiveForm";
import VocationalForm from "./VocationalForm";
import CasualForm from "./CasualForm";

const backendURL = import.meta.env.VITE_BACKEND_URL;

function LearnerPersonaForm() {
  const navigate = useNavigate();

  // -----------------------------
  // MAIN STEPS:
  // step = 1 => Choose category
  // step >= 2 => Sub-steps for the chosen category
  // -----------------------------

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");

  // For convenience, define how many sub-steps each category has:
  const maxSubSteps = {
    academic: 4, // matches the 4 steps in AcademicForm
    competitive: 1,
    vocational: 1,
    casual: 1,
  };

  // subStep = step - 1
  const subStep = step - 1;

  console.log("Rendering LearnerPersonaForm... step =", step, "subStep =", subStep);

  // -----------------------------
  // MASTER FORM DATA
  // -----------------------------
  const [formData, setFormData] = useState({
    academic: {
      // CHANGED: only keep exam, subject, etc. for step 1
      exam: "",
      subject: "",

      examOrCourses: [],
      examTimeline: "",
      dailyHours: "",
      preparationGoal: "",
      courseList: [],
      additionalNote: "",
    },
    competitive: {
      country: "",
      examName: "",
      examTimeline: "",
      dailyHours: "",
      preparationGoal: "",
    },
    vocational: {
      skillDomain: "",
      subSkills: [],
      dailyHours: "",
      preparationGoal: "",
    },
    casual: {
      interests: [],
      dailyHours: "",
      preparationGoal: "",
    },
  });

  // For calling methods on the AcademicForm
  const academicFormRef = useRef(null);

  // -----------------------------
  // HANDLERS
  // -----------------------------
  // 1) Category Selection
  const handleCategorySelect = (selected) => {
    setCategory(selected);
    setStep(2); // Move to first sub-step
  };

  // Show "Coming Soon"
  const handleComingSoon = () => {
    alert("Coming Soon!");
  };

  // 2) Generic text input changes
  const handleInputChange = (e, path) => {
    const [mainKey, subKey] = path.split(".");
    setFormData((prev) => ({
      ...prev,
      [mainKey]: {
        ...prev[mainKey],
        [subKey]: e.target.value,
      },
    }));
  };

  // For multi-select fields
  const handleMultiSelectChange = (value, path) => {
    const [mainKey, subKey] = path.split(".");
    setFormData((prev) => {
      const currentArray = prev[mainKey][subKey] || [];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [mainKey]: {
            ...prev[mainKey],
            [subKey]: currentArray.filter((item) => item !== value),
          },
        };
      } else {
        return {
          ...prev,
          [mainKey]: {
            ...prev[mainKey],
            [subKey]: [...currentArray, value],
          },
        };
      }
    });
  };

  // 3) Academic-specific
  const addNewCourse = () => {
    if (formData.academic.courseList.length >= 1) {
      alert("Currently only 1 course can be added. Coming soon!");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        courseList: [
          ...prev.academic.courseList,
          {
            id: uuidv4(),
            courseName: "",
            pdfLink: "",
            examDates: [{ type: "", date: "" }],
          },
        ],
      },
    }));
  };

  const handleCourseChange = (e, courseIdx, field) => {
    const newValue = e.target.value;
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        [field]: newValue,
      };
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  const storePdfLinkInState = (courseIdx, url) => {
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        pdfLink: url,
      };
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  const addExamDate = (courseIdx) => {
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        examDates: [
          ...updatedCourses[courseIdx].examDates,
          { type: "", date: "" },
        ],
      };
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  const handleExamFieldChange = (e, courseIdx, examIdx, field) => {
    const newValue = e.target.value;
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      const updatedExamDates = [...updatedCourses[courseIdx].examDates];
      updatedExamDates[examIdx] = {
        ...updatedExamDates[examIdx],
        [field]: newValue,
      };
      updatedCourses[courseIdx].examDates = updatedExamDates;
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  // 4) Navigation
  const handleBack = () => {
    if (step > 2) {
      setStep((prev) => prev - 1);
    } else {
      // If at sub-step=1, going back resets to category selection
      setStep(1);
      setCategory("");
    }
  };

  const handleNext = () => {
    if (subStep < maxSubSteps[category]) {
      setStep((prev) => prev + 1);
    } else {
      // If it's already the last sub-step, do final form submit
      handleSubmit();
    }
  };

  const isLastSubStep = subStep === maxSubSteps[category];

  // 5) Final Submission
  const handleSubmit = async () => {
    try {
      // If user is academic, first upload PDFs
      if (category === "academic" && academicFormRef.current) {
        await academicFormRef.current.uploadAllPDFs();
      }

      // Now submit everything
      const payload = {
        category,
        answers: formData[category],
      };

      console.log("Submitting Learner Persona payload:", payload);

      const token = localStorage.getItem("token");
      console.log("Token is:", token);

      const response = await axios.post(
        `${backendURL}/api/learnerpersona`,
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      console.log("Request succeeded with response:", response.data);
      navigate("/onboardingassessment");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit form. Check console for details.");
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  // STEP 1 => Category selection
  if (step === 1) {
    const tileStyle = {
      backgroundColor: "#333",
      borderRadius: "8px",
      padding: "20px",
      cursor: "pointer",
      transition: "transform 0.3s",
      textAlign: "left",
    };
    const disabledTileStyle = {
      ...tileStyle,
      opacity: 0.5,
      cursor: "not-allowed",
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
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            padding: "40px",
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginBottom: "20px" }}>Choose Your Learner Type</h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "30px", lineHeight: 1.6 }}>
            How would you define yourself as a learner?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Academic Learner (Enabled) */}
            <div onClick={() => handleCategorySelect("academic")} style={tileStyle}>
              <h2 style={{ margin: 0 }}>Academic Learner</h2>
              <p style={{ margin: 0 }}>
                School or college-based learning, aiming for exams or course mastery.
              </p>
            </div>

            {/* Others (disabled) */}
            <div onClick={handleComingSoon} style={disabledTileStyle}>
              <h2 style={{ margin: 0 }}>Competitive Exam (Coming Soon)</h2>
              <p style={{ margin: 0 }}>
                Preparing for a standardized test or entrance exam.
              </p>
            </div>
            <div onClick={handleComingSoon} style={disabledTileStyle}>
              <h2 style={{ margin: 0 }}>Vocational Learner (Coming Soon)</h2>
              <p style={{ margin: 0 }}>
                Practical, job-oriented skills (coding, design, etc.).
              </p>
            </div>
            <div onClick={handleComingSoon} style={disabledTileStyle}>
              <h2 style={{ margin: 0 }}>Casual Learner (Coming Soon)</h2>
              <p style={{ margin: 0 }}>
                Learning for personal growth or general improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP >= 2 => subForm with Next/Back
  const cardStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: "10px",
    padding: "40px",
    maxWidth: "600px",
    width: "100%",
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
      <div style={cardStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
          {category === "academic"
            ? "Academic Learner"
            : category === "competitive"
            ? "Competitive Exam Learner"
            : category === "vocational"
            ? "Vocational Learner"
            : "Casual Learner"}
        </h2>

        {category === "academic" && (
          <AcademicForm
            ref={academicFormRef} // forwardRef usage
            subStep={subStep}
            formData={formData.academic}
            handleInputChange={handleInputChange}
            handleCourseChange={handleCourseChange}
            addExamDate={addExamDate}
            handleExamFieldChange={handleExamFieldChange}
            addNewCourse={addNewCourse}
            storePdfLinkInState={storePdfLinkInState}
          />
        )}

        {category === "competitive" && (
          <CompetitiveForm
            formData={formData.competitive}
            handleInputChange={handleInputChange}
          />
        )}

        {category === "vocational" && (
          <VocationalForm
            formData={formData.vocational}
            handleInputChange={handleInputChange}
            handleMultiSelectChange={handleMultiSelectChange}
          />
        )}

        {category === "casual" && (
          <CasualForm
            formData={formData.casual}
            handleInputChange={handleInputChange}
            handleMultiSelectChange={handleMultiSelectChange}
          />
        )}

        {/* NAV BUTTONS */}
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#888",
              color: "#fff",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={isLastSubStep ? handleSubmit : handleNext}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#FFD700",
              color: "#000",
              cursor: "pointer",
            }}
          >
            {isLastSubStep ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearnerPersonaForm;