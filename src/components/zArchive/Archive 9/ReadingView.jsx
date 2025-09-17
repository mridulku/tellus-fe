import React from "react";

// Example “progress bar” for the selected book
function BookProgress({ book, getBookProgressInfo }) {
  if (!book) return null;
  const bp = getBookProgressInfo(book.bookName);
  if (!bp) return null;

  const containerStyle = {
    background: "rgba(255,255,255,0.15)",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "10px",
  };
  const barContainerStyle = {
    height: "8px",
    background: "rgba(255,255,255,0.3)",
    borderRadius: "4px",
    marginTop: "4px",
  };
  const fillStyle = {
    height: "100%",
    width: `${bp.percentageCompleted}%`,
    background: "#FFD700",
  };

  return (
    <div style={containerStyle}>
      <strong>{book.bookName}</strong>
      <div style={barContainerStyle}>
        <div style={fillStyle} />
      </div>
      <p style={{ margin: 0 }}>{bp.percentageCompleted.toFixed(1)}% read</p>
    </div>
  );
}

// The main reading panel
export default function ReadingView({
  selectedBook,
  selectedChapter,
  level,
  selectedSubChapter,
  onToggleDone,
  getBookProgressInfo,
}) {
  const readingContainerStyle = {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
  };

  if (!selectedSubChapter) {
    return (
      <div style={readingContainerStyle}>
        <h2>No Subchapter Selected</h2>
        <p>Please open the library and choose a subchapter.</p>
      </div>
    );
  }

  // Example: combine Book Progress + subchapter text
  return (
    <div style={readingContainerStyle}>
      {/* Show progress bar for the current book */}
      {selectedBook && (
        <BookProgress book={selectedBook} getBookProgressInfo={getBookProgressInfo} />
      )}

      <h2>
        {selectedBook?.bookName} &gt; {selectedChapter?.chapterName} &gt;{" "}
        {selectedSubChapter?.subChapterName}
      </h2>

      {selectedSubChapter.wordCount && (
        <p style={{ fontStyle: "italic", opacity: 0.8 }}>
          Word Count: {selectedSubChapter.wordCount} (~
          {Math.ceil(selectedSubChapter.wordCount / 200)} min read )
        </p>
      )}

      <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px", borderRadius: "6px" }}>
        <p>{selectedSubChapter.summary}</p>
      </div>

      <button
        style={{
          marginTop: "10px",
          padding: "8px 12px",
          border: "none",
          background: "#FFD700",
          color: "#000",
          borderRadius: "4px",
          cursor: "pointer",
        }}
        onClick={() => onToggleDone(selectedSubChapter)}
      >
        {selectedSubChapter.isDone ? "Mark Incomplete" : "Mark as Done"}
      </button>
    </div>
  );
}