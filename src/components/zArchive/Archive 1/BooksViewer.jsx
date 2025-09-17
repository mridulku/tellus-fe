import React, { useState, useEffect } from "react";
import axios from "axios";

function BooksViewer() {
//  const backendURL = "http://localhost:3001"; // or your domain
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const [booksData, setBooksData] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  // NEW: We'll store aggregated progress data here
  const [booksProgressData, setBooksProgressData] = useState([]);

  // Hard-coded user
  const userId = "testUser123";

  // ================== Fetch Aggregated Data ==================
  const fetchAggregatedData = async () => {
    try {
      const url = `${backendURL}/api/books-aggregated?userId=${userId}`;
      const res = await axios.get(url);
      if (res.data.success) {
        setBooksProgressData(res.data.data); // array of books with progress
      } else {
        console.error("Failed to fetch aggregated data:", res.data.error);
      }
    } catch (err) {
      console.error("Error fetching aggregated data:", err);
    }
  };

  // ================== Fetch All Data & Progress ==================
  const fetchAllData = async () => {
    try {
      // 1. Fetch the main books structure
      const booksRes = await fetch(`${backendURL}/api/books`);
      const books = await booksRes.json();

      // 2. Fetch user progress
      const progRes = await fetch(`${backendURL}/api/user-progress?userId=${userId}`);
      const progressData = await progRes.json();

      if (!progressData.success) {
        console.error("Failed to fetch user progress:", progressData.error);
        setBooksData(books);
      } else {
        // Build a doneSet of "book||chapter||subChapter" strings
        const doneSet = new Set(
          progressData.progress
            .filter((p) => p.isDone)
            .map((p) => `${p.bookName}||${p.chapterName}||${p.subChapterName}`)
        );

        // Merge "isDone" data into books
        const merged = books.map((book) => {
          return {
            ...book,
            chapters: book.chapters.map((chap) => {
              const updatedSubs = chap.subChapters.map((sc) => {
                const key = `${book.bookName}||${chap.chapterName}||${sc.subChapterName}`;
                return {
                  ...sc,
                  isDone: doneSet.has(key),
                };
              });
              return { ...chap, subChapters: updatedSubs };
            }),
          };
        });

        setBooksData(merged);
      }

      // 3. ALSO fetch aggregated progress data
      await fetchAggregatedData();

      // Attempt to keep the same sub-chapter selected if it exists in new data
      if (selectedBook && selectedChapter && selectedSubChapter) {
        // find updated objects
        const updatedBook = books.find((b) => b.bookName === selectedBook.bookName);
        if (updatedBook) {
          const updatedChap = updatedBook.chapters.find(
            (ch) => ch.chapterName === selectedChapter.chapterName
          );
          if (updatedChap) {
            const updatedSub = updatedChap.subChapters.find(
              (sc) => sc.subChapterName === selectedSubChapter.subChapterName
            );
            if (updatedSub) {
              // keep them selected
              setSelectedBook(updatedBook);
              setSelectedChapter(updatedChap);
              setSelectedSubChapter(updatedSub);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // ================== useEffect on mount ==================
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line
  }, [backendURL]);

  // ================== Toggle Done -> re-fetch ==================
  const handleToggleDone = async (subChapter) => {
    try {
      const newDoneState = !subChapter.isDone;
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        bookName: selectedBook.bookName,
        chapterName: selectedChapter.chapterName,
        subChapterName: subChapter.subChapterName,
        done: newDoneState,
      });

      // Re-fetch everything so the UI stays in sync
      await fetchAllData();
    } catch (error) {
      console.error("Error toggling done state:", error);
      alert("Failed to update completion status.");
    }
  };

  // ================== Click Handlers ==================
  const handleBookClick = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedSubChapter(null);
  };

  const handleSubChapterClick = (subChapter) => {
    setSelectedSubChapter(subChapter);
  };

  // Helper to get aggregated data for the selected book
  const getBookProgressInfo = (bookName) =>
    booksProgressData.find((b) => b.bookName === bookName);

  return (
    <div style={{ display: "flex", padding: "20px" }}>
      {/* Books List */}
      <div style={{ width: "25%", marginRight: "20px" }}>
        <h2>Books</h2>
        {booksData.map((book) => (
          <div
            key={book.bookName}
            onClick={() => handleBookClick(book)}
            style={{
              cursor: "pointer",
              background:
                selectedBook?.bookName === book.bookName ? "#f0f0f0" : "transparent",
              padding: "8px",
              marginBottom: "4px",
            }}
          >
            {book.bookName}
          </div>
        ))}
      </div>

      {/* Chapters List */}
      <div style={{ width: "25%", marginRight: "20px" }}>
        <h2>Chapters</h2>

        {/* Display Book-Level Progress (if available) */}
        {selectedBook && (() => {
          const bp = getBookProgressInfo(selectedBook.bookName);
          if (!bp) return null; // no aggregator info yet
          return (
            <div style={{ marginBottom: "16px", padding: "8px", border: "1px solid #ccc" }}>
              <h4>Book Stats</h4>
              <p>Total Words: {bp.totalWords}</p>
              <p>Words Read: {bp.totalWordsRead}</p>
              <p>Progress: {bp.percentageCompleted.toFixed(2)}%</p>
            </div>
          );
        })()}

        {selectedBook ? (
          selectedBook.chapters.map((chapter) => (
            <div
              key={chapter.chapterName}
              onClick={() => handleChapterClick(chapter)}
              style={{
                cursor: "pointer",
                background:
                  selectedChapter?.chapterName === chapter.chapterName ? "#f0f0f0" : "transparent",
                padding: "8px",
                marginBottom: "4px",
              }}
            >
              {chapter.chapterName}
            </div>
          ))
        ) : (
          <p>Please select a Book to see chapters.</p>
        )}
      </div>

      {/* Sub-chapters List */}
      <div style={{ width: "25%", marginRight: "20px" }}>
        <h2>Sub-chapters</h2>
        {selectedChapter ? (
          selectedChapter.subChapters.map((subChapter) => (
            <div
              key={subChapter.subChapterName}
              onClick={() => handleSubChapterClick(subChapter)}
              style={{
                cursor: "pointer",
                background:
                  selectedSubChapter?.subChapterName === subChapter.subChapterName
                    ? "#f0f0f0"
                    : "transparent",
                padding: "8px",
                marginBottom: "4px",
              }}
            >
              {subChapter.subChapterName}{" "}
              {subChapter.isDone ? (
                <span style={{ color: "green" }}>(Done)</span>
              ) : (
                <span>(Not Done)</span>
              )}
            </div>
          ))
        ) : (
          <p>Please select a Chapter to see sub-chapters.</p>
        )}
      </div>

      {/* Content / Summary */}
      <div style={{ width: "25%" }}>
        <h2>Content</h2>
        {selectedSubChapter ? (
          <>
            <h3>
              {selectedSubChapter.subChapterName}{" "}
              {selectedSubChapter.isDone ? (
                <span style={{ color: "green" }}>(Done)</span>
              ) : (
                <span>(Not Done)</span>
              )}
            </h3>

            {selectedSubChapter.wordCount && (
              <p style={{ fontStyle: "italic" }}>
                Word Count: {selectedSubChapter.wordCount} — Estimated Time:{" "}
                {Math.ceil(selectedSubChapter.wordCount / 200)} min
              </p>
            )}

            <p>{selectedSubChapter.summary}</p>

            <button onClick={() => handleToggleDone(selectedSubChapter)}>
              {selectedSubChapter.isDone ? "Mark Incomplete" : "Mark as Done"}
            </button>
          </>
        ) : (
          <p>Please select a Sub-chapter to see its content.</p>
        )}
      </div>
    </div>
  );
}

export default BooksViewer;

