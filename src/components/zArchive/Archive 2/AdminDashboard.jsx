import React, { useState } from "react";
import PdfUploader from "./PdfUploader";
import SubChaptersUploader from "./SubChaptersUploader";
import ChaptersUploader from "./ChaptersUploader";
import BookTextViewer from "./BookTextViewer";
import SubchapterNameUploader from "./SubchapterNameUploader";

function AdminDashboard() {
  const [activeComponent, setActiveComponent] = useState("pdf");

  // We’ll map each option to a label & component ID for clarity
  const navItems = [
    { id: "pdf", label: "Upload PDF" },
    { id: "subChapters", label: "SubChapters Uploader" },
    { id: "chapters", label: "Chapters Uploader" },
    { id: "viewer", label: "View Book Text" },
    { id: "subchaptername", label: "SubchapterName Upload" },
  ];

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case "pdf":
        return <PdfUploader />;
      case "subChapters":
        return <SubChaptersUploader />;
      case "chapters":
        return <ChaptersUploader />;
      case "viewer":
        return <BookTextViewer />;
      case "subchaptername":
        return <SubchapterNameUploader />;
      default:
        return <PdfUploader />;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: "'Open Sans', sans-serif",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        color: "#fff",
      }}
    >
      {/* Side Navigation */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            marginBottom: "30px",
            textAlign: "center",
          }}
        >
          Admin Dashboard
        </h2>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveComponent(item.id)}
            style={{
              backgroundColor:
                activeComponent === item.id ? "#FFD700" : "transparent",
              color: activeComponent === item.id ? "#000" : "#fff",
              fontWeight: activeComponent === item.id ? "bold" : "normal",
              border: "none",
              borderRadius: "4px",
              padding: "10px 15px",
              textAlign: "left",
              marginBottom: "10px",
              cursor: "pointer",
              transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => {
              if (activeComponent !== item.id) {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
              }
            }}
            onMouseOut={(e) => {
              if (activeComponent !== item.id) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          flex: 1,
          padding: "20px",
          overflowY: "auto",
          backgroundColor: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(8px)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
          {navItems.find((i) => i.id === activeComponent)?.label || "Upload PDF"}
        </h2>
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.3)",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          {renderActiveComponent()}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;