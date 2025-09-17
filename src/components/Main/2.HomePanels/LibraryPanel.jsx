import React, { useRef } from "react";

/**
 * Example props:
 *   booksData: [{ id, title, author, coverUrl }, ...]
 *   onUpload: function(file) => handles the file upload
 */
function LibraryPanel({ booksData = [], onUpload }) {
  const hiddenFileInput = useRef(null);

  // When user clicks "Upload Book" button
  const handleUploadClick = () => {
    // Programmatically open the hidden file input
    hiddenFileInput.current.click();
  };

  // When the file input changes (user picks a file)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  // Count how many books
  const totalBooks = booksData.length;

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>My Library</h2>
      <div style={summaryStyle}>
        You have <strong>{totalBooks}</strong> book{totalBooks !== 1 ? "s" : ""} in your library.
      </div>

      <button style={uploadButtonStyle} onClick={handleUploadClick}>
        Upload Book
      </button>
      <input
        type="file"
        accept="application/pdf"
        ref={hiddenFileInput}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div style={cardsContainerStyle}>
        {booksData.length === 0 ? (
          <div style={emptyStyle}>No books found. Please upload!</div>
        ) : (
          booksData.map((book) => (
            <div key={book.id || book.title} style={cardStyle}>
              {/* Cover image if available, else fallback */}
              {book.coverUrl ? (
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  style={coverImageStyle}
                />
              ) : (
                <div style={noCoverStyle}>No Cover</div>
              )}
              <div style={cardContentStyle}>
                <h3 style={titleStyle}>{book.title}</h3>
                {book.author && <p style={authorStyle}>by {book.author}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LibraryPanel;

/** --- Inline Styles Below --- **/

const containerStyle = {
  backgroundColor: "#1E1E1E",
  color: "#FFFFFF",
  padding: "20px",
  borderRadius: "8px",
  fontFamily: "sans-serif",
  margin: "20px auto",
  maxWidth: "800px",
};

const headerStyle = {
  margin: 0,
  marginBottom: "10px",
  textAlign: "center",
  fontSize: "1.8rem",
};

const summaryStyle = {
  textAlign: "center",
  marginBottom: "20px",
};

const uploadButtonStyle = {
  display: "block",
  margin: "0 auto 20px auto",
  backgroundColor: "#BB86FC",
  color: "#000",
  border: "none",
  padding: "10px 20px",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
  fontSize: "1rem",
};

const cardsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  backgroundColor: "#2D2D2D",
  borderRadius: "8px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "10px",
};

const coverImageStyle = {
  width: "100px",
  height: "140px",
  objectFit: "cover",
  borderRadius: "4px",
  marginBottom: "10px",
};

const noCoverStyle = {
  width: "100px",
  height: "140px",
  backgroundColor: "#444",
  borderRadius: "4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#AAA",
  marginBottom: "10px",
};

const cardContentStyle = {
  textAlign: "center",
};

const titleStyle = {
  fontSize: "1rem",
  margin: "0 0 5px 0",
};

const authorStyle = {
  margin: 0,
  fontSize: "0.9rem",
  color: "#CCC",
};

const emptyStyle = {
  gridColumn: "1 / -1",
  textAlign: "center",
  color: "#CCC",
  fontStyle: "italic",
};