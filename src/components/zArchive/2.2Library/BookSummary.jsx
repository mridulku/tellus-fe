// src/components/DetailedBookViewer/BookSummary.jsx
import React from "react";

function BookSummary({ book, getBookProgressInfo }) {
  const progressInfo = getBookProgressInfo(book.bookName);

  // Stats from aggregator or fallback from book data
  const totalChapters = progressInfo?.totalChapters || book.chapters.length;
  const completedChapters = progressInfo?.completedChapters || 0;
  const totalSubChapters = progressInfo?.totalSubChapters || countSubChapters(book);
  const completedSubChapters = progressInfo?.completedSubChapters || 0;

  // Calculate percentages
  const chapterPercent = totalChapters
    ? Math.round((completedChapters / totalChapters) * 100)
    : 0;
  const subChapterPercent = totalSubChapters
    ? Math.round((completedSubChapters / totalSubChapters) * 100)
    : 0;

  return (
    <div style={summaryContainerStyle}>
      {/* Header */}
      <h2 style={bookTitleStyle}>
        <span role="img" aria-label="book icon" style={{ marginRight: "8px" }}>
          📖
        </span>
        {book.bookName}
      </h2>
      <p style={taglineStyle}>An overview of your progress in this book</p>

      <div style={statsRowStyle}>
        {/* Chapters Card */}
        <div style={statCardStyle}>
          <div style={iconContainerStyle}>
            <span role="img" aria-label="chapters icon" style={statIconStyle}>
              📑
            </span>
          </div>
          <div style={statTextContainerStyle}>
            <div style={statLabelStyle}>Chapters</div>
            <div style={statValueStyle}>
              {completedChapters}/{totalChapters} ({chapterPercent}%)
            </div>
            <div style={progressBarContainerStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${chapterPercent}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Subchapters Card */}
        <div style={statCardStyle}>
          <div style={iconContainerStyle}>
            <span role="img" aria-label="subchapters icon" style={statIconStyle}>
              📄
            </span>
          </div>
          <div style={statTextContainerStyle}>
            <div style={statLabelStyle}>Subchapters</div>
            <div style={statValueStyle}>
              {completedSubChapters}/{totalSubChapters} ({subChapterPercent}%)
            </div>
            <div style={progressBarContainerStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${subChapterPercent}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* You can add more cards here, e.g. total reading time, quizzes done, etc. */}
    </div>
  );
}

// Count subchapters if not provided by aggregator
function countSubChapters(book) {
  let total = 0;
  book.chapters.forEach((chapter) => {
    total += chapter.subChapters.length;
  });
  return total;
}

// Styles
const summaryContainerStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "8px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
};

const bookTitleStyle = {
  display: "flex",
  alignItems: "center",
  fontSize: "1.4rem",
  margin: 0,
};

const taglineStyle = {
  fontStyle: "italic",
  opacity: 0.85,
  marginBottom: "20px",
};

const statsRowStyle = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
};

const statCardStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "8px",
  padding: "15px",
  minWidth: "220px",
};

const iconContainerStyle = {
  marginRight: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const statIconStyle = {
  fontSize: "1.8rem",
};

const statTextContainerStyle = {
  flex: 1,
};

const statLabelStyle = {
  fontSize: "0.95rem",
  marginBottom: "4px",
  opacity: 0.8,
};

const statValueStyle = {
  fontWeight: "bold",
  fontSize: "1.1rem",
  marginBottom: "8px",
  color: "#FFD700", // gold
};

const progressBarContainerStyle = {
  height: "6px",
  backgroundColor: "#333",
  borderRadius: "4px",
  overflow: "hidden",
};

const progressBarFillStyle = {
  height: "100%",
  backgroundColor: "#FFD700",
  transition: "width 0.4s ease",
};

export default BookSummary;