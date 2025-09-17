/********************************************
 * BooksViewer3.jsx (Updated to Wait on Auth)
 ********************************************/
import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../../firebase";

// Our brand-new layout components
import LibraryDrawer from "./LibraryDrawer";
import FloatingActions from "./FloatingActions";
import ReadingView from "./ReadingView";
import QuizModal from "./QuizModal";
import SummariesDrawer from "./SummariesDrawer";
import DoubtsDrawer from "./DoubtsDrawer";
import TutorDrawer from "./TutorDrawer";

// Example top nav bar
function NavigationBar({ onToggleLibrary }) {
  const navBarStyle = {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#111",
    color: "#fff",
    padding: "10px 16px",
  };

  const hamburgerStyle = {
    fontSize: "1.2rem",
    cursor: "pointer",
    marginRight: "16px",
    background: "none",
    border: "none",
    color: "#fff",
  };

  const titleStyle = {
    fontSize: "1.2rem",
    fontWeight: "bold",
  };

  return (
    <div style={navBarStyle}>
      <button style={hamburgerStyle} onClick={onToggleLibrary}>
        &#9776; {/* hamburger icon */}
      </button>
      <div style={titleStyle}>My Adaptive Learning Platform</div>
    </div>
  );
}

export default function BooksViewer3() {
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // ------------------------ Auth-Related State ------------------------
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ------------------------ Main State Variables ------------------------
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [booksData, setBooksData] = useState([]);
  const [booksProgressData, setBooksProgressData] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  // Quiz and overlay states
  const [quizData, setQuizData] = useState([]);
  const [quizOpen, setQuizOpen] = useState(false);

  const [summariesOpen, setSummariesOpen] = useState(false);
  const [doubtsOpen, setDoubtsOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);

  // For controlling the library drawer
  const [libraryOpen, setLibraryOpen] = useState(false);

  // Quiz answer state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // ------------------------ Auth Effect ------------------------
  // Listen for changes in auth state, set userId if logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ------------------------ Fetch Categories ------------------------
  useEffect(() => {
    // Only fetch categories once we know userId and we've finished checking auth
    if (!authLoading && userId) {
      fetchCategories();
    }
  }, [authLoading, userId]);

  // Once we have categories (and presumably setSelectedCategory), watch changes
  useEffect(() => {
    if (selectedCategory) {
      fetchAllData(selectedCategory);
    }
    // eslint-disable-next-line
  }, [selectedCategory]);

  // ------------------------ fetchCategories ------------------------
  const fetchCategories = async () => {
    try {
      // You could pass userId to the endpoint if your backend requires it
      // or just call /api/categories if that doesn't filter by user.
      const res = await axios.get(`${backendURL}/api/categories`);
      if (res.data.success !== false) {
        const catData = res.data.data || res.data;
        setCategories(catData);
        if (catData.length > 0) {
          setSelectedCategory(catData[0].categoryId);
        }
      } else {
        console.error("Failed to fetch categories:", res.data.error);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // ------------------------ fetchAllData ------------------------
  const fetchAllData = async (catId) => {
    try {
      // 1) Fetch books for this category + user
      const booksRes = await axios.get(
        `${backendURL}/api/books?categoryId=${catId}&userId=${userId}`
      );
      const books = booksRes.data;

      // 2) Fetch user progress
      const progRes = await axios.get(
        `${backendURL}/api/user-progress?userId=${userId}`
      );
      const progressData = progRes.data;

      if (!progressData.success) {
        console.error("Failed to fetch user progress:", progressData.error);
        setBooksData(books);
      } else {
        const doneSet = new Set(
          progressData.progress
            .filter((p) => p.isDone)
            .map((p) => `${p.bookName}||${p.chapterName}||${p.subChapterName}`)
        );

        const merged = books.map((book) => ({
          ...book,
          chapters: book.chapters.map((chap) => ({
            ...chap,
            subChapters: chap.subChapters.map((sc) => {
              const key = `${book.bookName}||${chap.chapterName}||${sc.subChapterName}`;
              return { ...sc, isDone: doneSet.has(key) };
            }),
          })),
        }));
        setBooksData(merged);
      }

      // 3) Fetch aggregator data (book-level progress)
      const aggRes = await axios.get(
        `${backendURL}/api/books-aggregated?userId=${userId}&categoryId=${catId}`
      );
      if (aggRes.data.success) {
        setBooksProgressData(aggRes.data.data);
      } else {
        console.error("Failed aggregator:", aggRes.data.error);
      }

      resetSelections();
    } catch (err) {
      console.error("Error in fetchAllData:", err);
    }
  };

  const resetSelections = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
    setQuizData([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(null);
  };

  // ------------------------ Drawer / UI Handlers ------------------------
  const handleToggleLibrary = () => {
    setLibraryOpen(!libraryOpen);
  };

  const handleCategoryChange = (newCatId) => {
    setSelectedCategory(newCatId);
  };

  const handleSelectSubChapter = async (book, chapter, subChap) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
    setSelectedSubChapter(subChap);

    // Also fetch quiz for that subchapter
    await fetchQuiz(book.bookName, chapter.chapterName, subChap.subChapterName);

    // Close library after selection
    setLibraryOpen(false);
  };

  // ------------------------ QUIZ Logic ------------------------
  const fetchQuiz = async (bookName, chapterName, subChapterName) => {
    try {
      const url = `${backendURL}/api/quizzes?bookName=${encodeURIComponent(
        bookName
      )}&chapterName=${encodeURIComponent(
        chapterName
      )}&subChapterName=${encodeURIComponent(subChapterName)}`;

      const res = await axios.get(url);
      if (res.data.success === false) {
        console.error("Quiz fetch error:", res.data.error);
        setQuizData([]);
      } else {
        setQuizData(res.data.data || []);
      }
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setScore(null);
    } catch (error) {
      console.error("Quiz fetch error:", error);
      setQuizData([]);
    }
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setQuizSubmitted(true);
  };

  // Mark subchapter done/incomplete
  const handleToggleDone = async (subChap) => {
    try {
      const newDoneState = !subChap.isDone;
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        bookName: selectedBook.bookName,
        chapterName: selectedChapter.chapterName,
        subChapterName: subChap.subChapterName,
        done: newDoneState,
      });
      // Refresh data
      await fetchAllData(selectedCategory);
    } catch (error) {
      console.error("Error toggling done state:", error);
      alert("Failed to update completion status.");
    }
  };

  // This helps readingView display progress
  const getBookProgressInfo = (bookName) => {
    return booksProgressData.find((b) => b.bookName === bookName);
  };

  // ------------------------ Render ------------------------
  // If still checking auth, or user not logged in, show something else:
  if (authLoading) {
    return <div style={{ padding: "20px" }}>Checking authentication...</div>;
  }

  if (!userId) {
    return <div style={{ padding: "20px", color: "#fff" }}>
      <h2>No user signed in</h2>
      <p>Please log in first.</p>
    </div>;
  }

  // Otherwise, show the main UI
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  };

  const mainContentStyle = {
    flex: 1,
    position: "relative",
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    color: "#fff",
    overflow: "hidden",
    display: "flex",
  };

  return (
    <div style={containerStyle}>
      {/* ========== NAV BAR ========== */}
      <NavigationBar onToggleLibrary={handleToggleLibrary} />

      {/* ========== MAIN AREA ========== */}
      <div style={mainContentStyle}>
        {/* Drawer with books, chapters, subchapters */}
        <LibraryDrawer
          open={libraryOpen}
          categories={categories}
          selectedCategory={selectedCategory}
          onClose={() => setLibraryOpen(false)}
          onCategoryChange={handleCategoryChange}
          booksData={booksData}
          onSelectSubChapter={handleSelectSubChapter}
        />

        {/* Central reading panel */}
        <ReadingView
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          selectedSubChapter={selectedSubChapter}
          onToggleDone={handleToggleDone}
          getBookProgressInfo={getBookProgressInfo}
        />

        {/* Floating FAB for Summaries / Quizzes / Doubts / Tutor */}
        <FloatingActions
          onOpenQuiz={() => setQuizOpen(true)}
          onOpenSummaries={() => setSummariesOpen(true)}
          onOpenDoubts={() => setDoubtsOpen(true)}
          onOpenTutor={() => setTutorOpen(true)}
          disabled={!selectedSubChapter}
        />
      </div>

      {/* ========== Overlays ========== */}
      {quizOpen && (
        <QuizModal
          quizData={quizData}
          selectedAnswers={selectedAnswers}
          quizSubmitted={quizSubmitted}
          score={score}
          onClose={() => setQuizOpen(false)}
          handleOptionSelect={handleOptionSelect}
          handleSubmitQuiz={handleSubmitQuiz}
        />
      )}
      {summariesOpen && (
        <SummariesDrawer onClose={() => setSummariesOpen(false)} />
      )}
      {doubtsOpen && (
        <DoubtsDrawer onClose={() => setDoubtsOpen(false)} />
      )}
      {tutorOpen && (
        <TutorDrawer onClose={() => setTutorOpen(false)} />
      )}
    </div>
  );
}