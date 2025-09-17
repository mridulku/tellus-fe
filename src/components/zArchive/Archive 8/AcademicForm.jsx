// AcademicForm.jsx

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
} from "react";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage, auth } from "../../../firebase"; // your firebase.js file

function AcademicForm(
  {
    subStep,
    formData,
    handleInputChange,
    handleCourseChange,
    addExamDate,
    handleExamFieldChange,
    addNewCourse,
    storePdfLinkInState,
  },
  ref
) {
  // ---------- For debugging: detect mount/unmount ----------
  useEffect(() => {
    console.log("AcademicForm MOUNTED");
    return () => {
      console.log("AcademicForm UNMOUNTED");
    };
  }, []);

  // ---------- STYLES ----------
  const sectionContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "20px",
  };
  const sectionHeadingStyle = { marginBottom: "10px", fontWeight: "bold" };
  const helperTextStyle = {
    fontStyle: "italic",
    color: "#eee",
    marginBottom: "10px",
    display: "block",
  };
  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    marginBottom: "15px",
    fontSize: "1rem",
  };
  const selectStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    fontSize: "1rem",
    marginBottom: "15px",
  };
  const tileContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };
  const tileStyle = {
    display: "inline-block",
    padding: "10px 20px",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.1)",
    cursor: "pointer",
    textAlign: "center",
    transition: "background-color 0.2s ease-in-out",
    userSelect: "none",
  };
  const tileSelectedStyle = {
    backgroundColor: "#FFD700",
    color: "#333",
    fontWeight: "bold",
  };

  // ---------- STATE for selected files (PDFs) ----------
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ---------- TILES Helper ----------
  const handleTileSelection = (value, fieldKey) => {
    const path = `academic.${fieldKey}`;
    const mockEvent = { target: { value } };
    handleInputChange(mockEvent, path);
  };

  const renderTile = (label, value, currentValue, fieldKey, emoji = "") => {
    const isSelected = currentValue === value;
    return (
      <div
        style={{
          ...tileStyle,
          ...(isSelected ? tileSelectedStyle : {}),
        }}
        onClick={() => handleTileSelection(value, fieldKey)}
      >
        {emoji} {label}
      </div>
    );
  };

  // ---------- PDF Upload Helper ----------
  const uploadPDFwithMetadata = useCallback(
    async (file, courseName, categoryValue) => {
      return new Promise((resolve, reject) => {
        try {
          const storagePath = `pdfUploads/${courseName}/${file.name}`;
          const storageRef = firebaseRef(storage, storagePath);
          const user = auth.currentUser;

          const metadata = {
            customMetadata: {
              category: categoryValue,
              courseName,
              userId: user?.uid,
            },
          };

          const uploadTask = uploadBytesResumable(storageRef, file, metadata);

          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`${courseName} PDF upload is ${progress}% done`);
            },
            (error) => {
              console.error("Error uploading PDF:", error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log(`${courseName} PDF available at:`, downloadURL);
              resolve(downloadURL);
            }
          );
        } catch (err) {
          reject(err);
        }
      });
    },
    []
  );

  // ---------- The function the parent will call to upload PDFs ----------
  const uploadAllPDFs = useCallback(async () => {
    try {
      const categoryValue = "Academic";
      for (let i = 0; i < formData.courseList.length; i++) {
        const course = formData.courseList[i];
        const file = selectedFiles[i]; // The file the user picked for this course
        if (file) {
          const dlURL = await uploadPDFwithMetadata(
            file,
            course.courseName || `Course${i + 1}`,
            categoryValue
          );
          storePdfLinkInState(i, dlURL);
        }
      }
      console.log("All PDFs (if any) uploaded successfully!");
    } catch (err) {
      console.error("uploadAllPDFs error:", err);
      throw err; // re-throw so parent knows it failed
    }
  }, [
    formData.courseList,
    selectedFiles,
    storePdfLinkInState,
    uploadPDFwithMetadata,
  ]);

  // Make `uploadAllPDFs` callable from parent
  useImperativeHandle(ref, () => ({
    uploadAllPDFs,
  }));

  // ---------- onFileSelect ----------
  const handleFileSelect = (file, courseIndex) => {
    if (!file) return;
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[courseIndex] = file;
      return updated;
    });
  };

  // ---------- Step 1 (REPLACED) ----------
  const Step1_ExamAndSubject = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>1. Exam & Subject</h3>
      <span style={helperTextStyle}>
        Please select the exam you are preparing for, then choose your subject.
      </span>

      {/* --- Exams --- */}
      <label style={{ marginBottom: "5px" }}>Select Exam:</label>
      <div style={tileContainerStyle}>
        {renderTile("UPSC", "UPSC", formData.exam, "exam", "🏛️")}
        {renderTile("JEE", "JEE", formData.exam, "exam", "📐")}
      </div>

      {/* --- Subjects: show only if an exam is chosen --- */}
      {formData.exam === "UPSC" && (
        <>
          <label style={{ marginBottom: "5px" }}>Select UPSC Subject:</label>
          <div style={tileContainerStyle}>
            {renderTile("History", "History", formData.subject, "subject", "📜")}
            {renderTile(
              "Polity & Governance",
              "Polity & Governance",
              formData.subject,
              "subject",
              "🏛️"
            )}
            {renderTile("Geography", "Geography", formData.subject, "subject", "🌐")}
            {renderTile("Economics", "Economics", formData.subject, "subject", "💰")}
            {renderTile(
              "Environment & Ecology",
              "Environment & Ecology",
              formData.subject,
              "subject",
              "🌱"
            )}
            {renderTile(
              "General Science",
              "General Science",
              formData.subject,
              "subject",
              "🔬"
            )}
            {renderTile(
              "Current Affairs",
              "Current Affairs",
              formData.subject,
              "subject",
              "📰"
            )}
          </div>
        </>
      )}

      {formData.exam === "JEE" && (
        <>
          <label style={{ marginBottom: "5px" }}>Select JEE Subject:</label>
          <div style={tileContainerStyle}>
            {renderTile("Physics", "Physics", formData.subject, "subject", "🔭")}
            {renderTile("Chemistry", "Chemistry", formData.subject, "subject", "⚗️")}
            {renderTile("Mathematics", "Mathematics", formData.subject, "subject", "➕")}
          </div>
        </>
      )}
    </div>
  );

  // Step 2
  const Step2_Courses = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>2. Book/Course PDF 📚</h3>
      <span style={helperTextStyle}>
        Currently, only 1 PDF is supported.
      </span>

      {formData.courseList.map((course, courseIndex) => (
        <div
          key={course.id}
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <label>Course/Book Name:</label>
          <input
            type="text"
            placeholder="e.g. Math 101"
            value={course.courseName}
            onChange={(e) => handleCourseChange(e, courseIndex, "courseName")}
            style={inputStyle}
          />

          <label> </label>
          <span style={helperTextStyle}>
           </span>
          <input
            type="file"
            accept="application/pdf"
            disabled={!!course.pdfLink}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file, courseIndex);
              }
            }}
            style={{ marginBottom: "10px", display: "block" }}
          />

          {selectedFiles[courseIndex] && !course.pdfLink && (
            <p style={{ color: "#FFD700" }}>
              File selected: {selectedFiles[courseIndex].name}
            </p>
          )}
          {course.pdfLink && (
            <p>
              Uploaded PDF:{" "}
              <a
                href={course.pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#FFD700" }}
              >
                View PDF
              </a>
            </p>
          )}

          <h5>Exam / Test Dates 🗓</h5>
          <span style={helperTextStyle}>
            Add exam or test dates for the AI to plan your content.
          </span>
          {course.examDates?.map((examObj, examIdx) => (
            <div
              key={examIdx}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "5px",
                borderRadius: "4px",
                marginBottom: "5px",
              }}
            >
              <label>Type of Exam:</label>
              <input
                type="text"
                placeholder="e.g. Final, Quiz"
                value={examObj.type}
                onChange={(e) =>
                  handleExamFieldChange(e, courseIndex, examIdx, "type")
                }
                style={{ ...inputStyle, marginBottom: "5px" }}
              />

              <label>Date:</label>
              <input
                type="date"
                value={examObj.date}
                onChange={(e) =>
                  handleExamFieldChange(e, courseIndex, examIdx, "date")
                }
                style={{ ...inputStyle, marginBottom: "5px" }}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => addExamDate(courseIndex)}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#999",
              cursor: "pointer",
              border: "none",
              marginBottom: "10px",
            }}
          >
            + Add Another Exam
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addNewCourse}
        disabled={formData.courseList.length >= 1}
        style={{
          marginBottom: "20px",
          display: "block",
          padding: "10px 20px",
          borderRadius: "4px",
          background: "#FFD700",
          cursor: "pointer",
          border: "none",
          fontWeight: "bold",
        }}
      >
        + Add Book/Course PDF
      </button>
    </div>
  );

  // Step 3
  const Step3_TimeGoals = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>3. Time Commitment & Goals</h3>
      <label>⏰ Daily Hours:</label>
      <span style={helperTextStyle}>
        Helps the AI plan your study schedule effectively.
      </span>
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="e.g. 2"
        value={formData.dailyHours}
        onChange={(e) => handleInputChange(e, "academic.dailyHours")}
        style={inputStyle}
      />

      <label>🎯 Preparation Goal:</label>
      <span style={helperTextStyle}>
        Share your goal so the AI can plan accordingly.
      </span>
      <select
        value={formData.preparationGoal}
        onChange={(e) => handleInputChange(e, "academic.preparationGoal")}
        style={selectStyle}
      >
        <option value="">Select</option>
        <option value="revise">Revise &amp; Refresh</option>
        <option value="start afresh">Start Afresh</option>
        <option value="deep mastery">Deep Mastery</option>
      </select>
    </div>
  );

  // Step 4
  const Step4_AdditionalNotes = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>4. Additional Notes 📝</h3>
      <span style={helperTextStyle}>
        Let us know anything else that might help us personalize your plan.
      </span>
      <textarea
        rows={3}
        placeholder="Anything else you'd like us to know?"
        value={formData.additionalNote}
        onChange={(e) => handleInputChange(e, "academic.additionalNote")}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "4px",
          marginBottom: "20px",
          border: "none",
          fontSize: "1rem",
        }}
      />
    </div>
  );

  // ---------- RENDER ----------
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "30px" }}>🎓 Academic Learner Form</h2>

      {subStep === 1 && <Step1_ExamAndSubject />}
      {subStep === 2 && <Step2_Courses />}
      {subStep === 3 && <Step3_TimeGoals />}
      {subStep === 4 && <Step4_AdditionalNotes />}
    </div>
  );
}

export default forwardRef(AcademicForm);