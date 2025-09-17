import React from "react";

export default function LibraryDrawer({
  open,
  categories,
  selectedCategory,
  onClose,
  onCategoryChange,
  booksData,
  onSelectSubChapter,
}) {
  // Basic drawer styling:
  const drawerWidth = 300;
  const drawerStyle = {
    position: "absolute",
    top: 0,
    left: open ? 0 : -drawerWidth,
    width: `${drawerWidth}px`,
    height: "100%",
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    boxShadow: open ? "2px 0 5px rgba(0,0,0,0.5)" : "none",
    transition: "left 0.3s",
    overflowY: "auto",
    padding: "20px",
  };

  const closeButtonStyle = {
    background: "none",
    border: "1px solid #fff",
    color: "#fff",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginBottom: "10px",
  };

  const bookTitleStyle = {
    cursor: "pointer",
    margin: "8px 0",
    fontWeight: "bold",
  };
  const chapterTitleStyle = {
    marginLeft: "10px",
    cursor: "pointer",
  };
  const subChapterTitleStyle = {
    marginLeft: "20px",
    cursor: "pointer",
  };
  const doneBadgeStyle = {
    color: "#FFD700",
    marginLeft: "8px",
  };

  return (
    <div style={drawerStyle}>
      <button style={closeButtonStyle} onClick={onClose}>
        Close
      </button>

      {/* Category Select */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>Category:</label>
        <select
          value={selectedCategory || ""}
          onChange={(e) => onCategoryChange(e.target.value)}
          style={{ padding: "4px 8px" }}
        >
          {categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* Books + Chapters + SubChapters */}
      {booksData.map((book) => (
        <div key={book.bookName}>
          <div style={bookTitleStyle}>{book.bookName}</div>
          {book.chapters.map((chap) => (
            <div key={chap.chapterName} style={chapterTitleStyle}>
              {chap.chapterName}
              {chap.subChapters.map((subChap) => (
                <div
                  key={subChap.subChapterName}
                  style={subChapterTitleStyle}
                  onClick={() => onSelectSubChapter(book, chap, subChap)}
                >
                  {subChap.subChapterName}
                  {subChap.isDone && (
                    <span style={doneBadgeStyle}>(Done)</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}