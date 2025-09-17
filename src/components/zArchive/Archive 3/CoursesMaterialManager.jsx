import React, { useState } from "react";

/**
 * CoursesMaterialManager.jsx
 * A component to manage courses and their materials:
 * - Show a sidebar (similar to reference)
 * - For each course, show its name, toggle "include in plan"
 * - Show materials with delete option
 * - Upload button to add more materials
 */
function CoursesMaterialManager() {
  // Sample data for demonstration
  const [courses, setCourses] = useState([
    {
      id: 1,
      name: "Intro to Algorithms",
      includedInPlan: true,
      materials: [
        { id: 101, title: "CLRS Textbook PDF" },
        { id: 102, title: "Lecture 1 Notes" },
        { id: 103, title: "Lecture 2 Slides" },
      ],
    },
    {
      id: 2,
      name: "Intro to Machine Learning",
      includedInPlan: false,
      materials: [
        { id: 201, title: "ML Overview PDF" },
        { id: 202, title: "Lecture 1 Notes" },
      ],
    },
    {
      id: 3,
      name: "Data Intensive Computing",
      includedInPlan: true,
      materials: [
        { id: 301, title: "MapReduce Paper" },
        { id: 302, title: "Lecture 2 Notes" },
        { id: 303, title: "Hadoop Installation Guide" },
      ],
    },
    {
      id: 4,
      name: "Computer Security",
      includedInPlan: false,
      materials: [
        { id: 401, title: "Security Best Practices" },
        { id: 402, title: "Lecture 1 PDF" },
      ],
    },
  ]);

  /**
   * Toggle whether a course is included in the plan
   */
  const handleToggleInclude = (courseId) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === courseId
          ? { ...course, includedInPlan: !course.includedInPlan }
          : course
      )
    );
  };

  /**
   * Delete a specific material from a course
   */
  const handleDeleteMaterial = (courseId, materialId) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) => {
        if (course.id === courseId) {
          return {
            ...course,
            materials: course.materials.filter((m) => m.id !== materialId),
          };
        }
        return course;
      })
    );
  };

  /**
   * Trigger "upload" for a given course (dummy handler for now)
   */
  const handleUploadMaterial = (courseId) => {
    alert(`Trigger upload dialog for course ID ${courseId}`);
    // Insert your real file-upload logic here
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        fontFamily: "'Open Sans', sans-serif",
        color: "#fff",
      }}
    >
      {/* ============ Sidebar ============ */}
      <aside
        style={{
          width: "220px",
          backgroundColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Menu</h3>

        <button
          style={sidebarButtonStyle}
          onClick={() => alert("View All Courses clicked")}
        >
          View All Courses
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Upload Material clicked")}
        >
          Upload Material
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Change Configuration clicked")}
        >
          Change Configuration
        </button>
      </aside>

      {/* ============ Main Content ============ */}
      <main style={{ flex: 1, padding: "30px" }}>
        <h1 style={{ marginBottom: "20px" }}>Manage Your Course Materials</h1>

        {courses.map((course) => (
          <div
            key={course.id}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "20px",
              marginBottom: "30px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ marginTop: 0 }}>{course.name}</h2>
              {/* Toggle: Include in plan */}
              <label style={{ display: "flex", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={course.includedInPlan}
                  onChange={() => handleToggleInclude(course.id)}
                  style={{ marginRight: "8px", cursor: "pointer" }}
                />
                {course.includedInPlan
                  ? "Included in Learning Plan"
                  : "Not in Learning Plan"}
              </label>
            </div>

            {/* Materials List */}
            <div style={{ marginTop: "10px" }}>
              <h4 style={{ marginBottom: "10px" }}>Uploaded Materials:</h4>
              {course.materials.length > 0 ? (
                course.materials.map((material) => (
                  <div
                    key={material.id}
                    style={{
                      backgroundColor: "#333",
                      borderRadius: "8px",
                      padding: "10px 15px",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>{material.title}</div>
                    <button
                      style={deleteButtonStyle}
                      onClick={() => handleDeleteMaterial(course.id, material.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ fontStyle: "italic" }}>No materials uploaded yet.</p>
              )}
            </div>

            {/* Upload Button */}
            <button
              style={uploadButtonStyle}
              onClick={() => handleUploadMaterial(course.id)}
            >
              Upload Material
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}

/** Reusable style objects */
const sidebarButtonStyle = {
  background: "none",
  border: "1px solid #FFD700",
  borderRadius: "4px",
  padding: "10px",
  color: "#FFD700",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.2s",
  textAlign: "left",
};

const uploadButtonStyle = {
  background: "#FFD700",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  padding: "10px 20px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "opacity 0.3s",
  marginTop: "10px",
};

const deleteButtonStyle = {
  background: "#FF6B6B",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "6px 10px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "opacity 0.3s",
};

export default CoursesMaterialManager;