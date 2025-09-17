import React, { useState } from "react";

export default function BookUploader() {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);

  // mock “server” response
  const mockParsedBook = {
    fileName: "Physics_JEE_Main_Vol_1.pdf",
    subchapters: [
      {
        chapterName: "Kinematics",
        subchapterName: "1.1 1-D Motion",
        summary:
          "Explains displacement, velocity, acceleration in a straight line; introduces graphical interpretation of motion equations."
      },
      {
        chapterName: "Kinematics",
        subchapterName: "1.2 2-D Projectile Motion",
        summary:
          "Derives trajectory, range and time-of-flight formulae; assumes no drag and constant g."
      }
    ]
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
    setParsed(null);
  };

  const fakeUploadAndParse = () => {
    setTimeout(() => setParsed(mockParsedBook), 500); // replace later
  };

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
        Base-Book Uploader
      </h2>
      <p style={{ fontSize: 14, color: "#666", marginBottom: "1rem" }}>
        Upload a syllabus PDF and preview the auto-parsed outline (mock demo
        for now).
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button
          onClick={fakeUploadAndParse}
          disabled={!file}
          style={{
            padding: "0.5rem 1rem",
            background: file ? "#2563eb" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: file ? "pointer" : "not-allowed"
          }}
        >
          Upload&nbsp;&amp;&nbsp;Parse
        </button>
      </div>

      {parsed && (
        <>
          <h3 style={{ marginBottom: "0.5rem" }}>
            Parsed outline — <span style={{ color: "#2563eb" }}>{parsed.fileName}</span>
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14
            }}
          >
            <thead>
              <tr>
                <th style={th}>Chapter</th>
                <th style={th}>Sub-chapter</th>
                <th style={th}>Summary</th>
              </tr>
            </thead>
            <tbody>
              {parsed.subchapters.map((s, i) => (
                <tr key={i}>
                  <td style={td}>{s.chapterName}</td>
                  <td style={td}>{s.subchapterName}</td>
                  <td style={td}>{s.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

const th = {
  textAlign: "left",
  borderBottom: "1px solid #ddd",
  padding: "0.5rem"
};
const td = { padding: "0.5rem", borderBottom: "1px solid #eee" };