// src/components/DetailedBookViewer/LibraryHome.jsx
import React from "react";

function LibraryHome({ booksData = [] }) {
  return (
    <div style={homeContainerStyle}>
      <h2 style={{ marginTop: 0 }}>Welcome to Your Library</h2>
      <p style={{ fontStyle: "italic", opacity: 0.8 }}>
        Select a book from the sidebar to see details, chapters, or subchapters.
      </p>

      {booksData.length === 0 ? (
        <div style={noBooksStyle}>No books found in your library.</div>
      ) : (
        <div style={booksGridStyle}>
          {booksData.map((book) => (
            <div key={book.bookName} style={bookCardStyle}>
              <span role="img" aria-label="book" style={bookIconStyle}>
                📚
              </span>
              <div style={bookTitleStyle}>{book.bookName}</div>
            </div>
          ))}
        </div>
      )}

      {/* === DUMMY ICONS for Tour Testing === */}
      <div style={dummyIconsContainerStyle}>
        <span
          id="libraryHomeTitle"
          role="img"
          aria-label="Title icon"
          style={dummyIconStyle}
        >
          📝
        </span>
        <span
          id="libraryNoBooks"
          role="img"
          aria-label="No books icon"
          style={dummyIconStyle}
        >
          ❌
        </span>
        <span
          id="libraryHomeGrid"
          role="img"
          aria-label="Grid icon"
          style={dummyIconStyle}
        >
          🔲
        </span>
      </div>
    </div>
  );
}

// Styles
const homeContainerStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "8px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
};

const noBooksStyle = {
  marginTop: "20px",
  padding: "10px",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "6px",
  textAlign: "center",
};

const booksGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "15px",
  marginTop: "20px",
};

const bookCardStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px 15px",
  borderRadius: "6px",
  minWidth: "150px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const bookIconStyle = {
  fontSize: "2rem",
  marginBottom: "5px",
};

const bookTitleStyle = {
  fontWeight: "bold",
  color: "#FFD700",
};

// New styles for dummy icons
const dummyIconsContainerStyle = {
  marginTop: "30px",
  display: "flex",
  gap: "20px",
  justifyContent: "center",
};

const dummyIconStyle = {
  fontSize: "2.5rem",
  cursor: "pointer",
};

export default LibraryHome;