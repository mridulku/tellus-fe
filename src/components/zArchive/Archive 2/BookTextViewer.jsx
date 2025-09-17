import React, { useState, useEffect } from "react";
import axios from "axios";

function BookTextViewer() {
  // We'll have 2 top-level modes: "pages" or "chapters"
  const [mode, setMode] = useState("pages");

  // If mode = "chapters", we have a secondary choice: "whole" or "subchapter"
  const [chapterMode, setChapterMode] = useState("whole");

  // Book selection
  const [uniqueBooks, setUniqueBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState("");

  // Chapter selection
  const [chaptersForBook, setChaptersForBook] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState("");

  // Sub-chapter selection
  const [subChaptersForChapter, setSubChaptersForChapter] = useState([]);
  const [selectedSubChapter, setSelectedSubChapter] = useState("");

  // Page range
  const [startPage, setStartPage] = useState("");
  const [endPage, setEndPage] = useState("");

  // Displayed text
  const [retrievedText, setRetrievedText] = useState("");

  // Endpoints

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const bookNamesURL = `${backendURL}/api/rawbooks/bookNames`;
  const chaptersURL = `${backendURL}/api/chapters`;
  const subChaptersURL = `${backendURL}/api/subchapternames`;
  const pagesURL = `${backendURL}/api/rawbooks/pages`;




 // const bookNamesURL = "http://localhost:3001/api/rawbooks/bookNames";
  //const chaptersURL = "http://localhost:3001/api/chapters";
  //const subChaptersURL = "http://localhost:3001/api/subchapternames"; 
  // you'll create a GET route: /api/subchapters?bookName=XXX&chapterName=YYY
  //const pagesURL = "http://localhost:3001/api/rawbooks/pages";

  // =========================== Fetch Books Once ===========================
  useEffect(() => {
    async function fetchBooks() {
      try {
        const response = await axios.get(bookNamesURL);
        if (response.data.success) {
          setUniqueBooks(response.data.bookNames);
        } else {
          console.error("Failed to fetch book names:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching book names:", error);
      }
    }
    fetchBooks();
  }, [bookNamesURL]);

  // =========================== Fetch Chapters When Book Changes ===========================
  useEffect(() => {
    if (!selectedBook) {
      // Clear everything
      setChaptersForBook([]);
      setSelectedChapter("");
      setSubChaptersForChapter([]);
      setSelectedSubChapter("");
      setStartPage("");
      setEndPage("");
      return;
    }

    async function fetchChapters() {
      try {
        const url = `${chaptersURL}?bookName=${encodeURIComponent(selectedBook)}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          setChaptersForBook(resp.data.chapters);
        } else {
          console.error("Error fetching chapters:", resp.data.error);
          setChaptersForBook([]);
        }
      } catch (err) {
        console.error("Error fetching chapters:", err);
        setChaptersForBook([]);
      }
    }
    fetchChapters();
  }, [selectedBook, chaptersURL]);

  // =========================== Fetch Sub-chapters When Chapter Changes (and user wants subCh) ===========================
  useEffect(() => {
    // Only fetch sub-chapters if user is in "chapters" mode + sub-chapter radio
    // and we actually have a selectedBook + selectedChapter
    if (mode !== "chapters" || chapterMode !== "subchapter") {
      setSubChaptersForChapter([]);
      setSelectedSubChapter("");
      return;
    }
    if (!selectedBook || !selectedChapter) {
      setSubChaptersForChapter([]);
      setSelectedSubChapter("");
      return;
    }

    async function fetchSubChapters() {
      try {
        const url = `${subChaptersURL}?bookName=${encodeURIComponent(selectedBook)}&chapterName=${encodeURIComponent(selectedChapter)}`;
        const resp = await axios.get(url);
        if (resp.data.success) {
          setSubChaptersForChapter(resp.data.subChapters);
        } else {
          console.error("Error fetching sub-chapters:", resp.data.error);
          setSubChaptersForChapter([]);
        }
      } catch (err) {
        console.error("Error fetching sub-chapters:", err);
        setSubChaptersForChapter([]);
      }
    }
    fetchSubChapters();
  }, [mode, chapterMode, selectedBook, selectedChapter, subChaptersURL]);

  // =========================== Handlers ===========================
  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);

    // Reset relevant fields
    if (newMode === "pages") {
      setChapterMode("whole");
      setSelectedChapter("");
      setSubChaptersForChapter([]);
      setSelectedSubChapter("");
    }
  };

  const handleChapterModeChange = (e) => {
    const newChapterMode = e.target.value;
    setChapterMode(newChapterMode);

    // If user picks "whole", we fill from the main chapter
    // If user picks "subchapter", we will fetch sub-chapters in the useEffect
    // below once we know selectedChapter
    if (newChapterMode === "whole") {
      // If there's already a selected chapter, auto-fill page range from that chapter
      const found = chaptersForBook.find((ch) => ch.chapterName === selectedChapter);
      if (found) {
        setStartPage(found.startPage);
        setEndPage(found.endPage);
      }
      setSubChaptersForChapter([]);
      setSelectedSubChapter("");
    } else {
      // newChapterMode = subchapter
      // We'll trigger fetch in the useEffect
      setStartPage("");
      setEndPage("");
    }
  };

  const handleSelectBook = (e) => {
    setSelectedBook(e.target.value);
  };

  const handleSelectChapter = (e) => {
    const chapterName = e.target.value;
    setSelectedChapter(chapterName);
    setSelectedSubChapter("");

    // If "whole" mode, auto-fill page range
    if (chapterMode === "whole") {
      const found = chaptersForBook.find((ch) => ch.chapterName === chapterName);
      if (found) {
        setStartPage(found.startPage);
        setEndPage(found.endPage);
      }
    } else {
      // if subchapter mode, we just wait for sub-chaps to load
      setStartPage("");
      setEndPage("");
    }
  };

  const handleSelectSubChapter = (e) => {
    const subChName = e.target.value;
    setSelectedSubChapter(subChName);

    // auto-fill from the subCh doc
    const found = subChaptersForChapter.find((sc) => sc.subChapterName === subChName);
    if (found) {
      setStartPage(found.startPage);
      setEndPage(found.endPage);
    }
  };

  const handleFetchPages = async () => {
    if (!selectedBook) {
      alert("Please pick a book!");
      return;
    }
    if (!startPage || !endPage) {
      alert("Please specify a page range or select a (sub)chapter that auto-fills.");
      return;
    }

    try {
      const url = `${pagesURL}?bookName=${encodeURIComponent(selectedBook)}&startPage=${startPage}&endPage=${endPage}`;
      const response = await axios.get(url);

      if (response.data.success) {
        const pagesArr = response.data.pages;
        if (pagesArr.length === 0) {
          setRetrievedText("No pages found for that range.");
        } else {
          let combined = "";
          pagesArr.forEach((pg) => {
            combined += `\n\nPage ${pg.pageNumber}:\n${pg.text}`;
          });
          setRetrievedText(combined.trim());
        }
      } else {
        setRetrievedText("Error: " + response.data.error);
      }
    } catch (error) {
      console.error("Error fetching pages:", error);
      setRetrievedText("Error fetching pages. Check console.");
    }
  };

  // =========================== Rendering ===========================
  return (
    <div style={{ padding: "20px" }}>
      <h2>View Book Chapters & Pages</h2>

      {/* MODE SWITCH: pages vs. chapters */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          <input
            type="radio"
            name="mode"
            value="pages"
            checked={mode === "pages"}
            onChange={handleModeChange}
            style={{ marginRight: "5px" }}
          />
          Pages
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="radio"
            name="mode"
            value="chapters"
            checked={mode === "chapters"}
            onChange={handleModeChange}
            style={{ marginRight: "5px" }}
          />
          Chapters
        </label>
      </div>

      {/* Book Dropdown */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "10px" }}>
          Select Book:
          <select value={selectedBook} onChange={handleSelectBook} style={{ marginLeft: "5px" }}>
            <option value="">-- Choose a Book --</option>
            {uniqueBooks.map((bk) => (
              <option key={bk} value={bk}>
                {bk}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* If we are in "chapters" mode, show second radio: whole vs. subchapter */}
      {mode === "chapters" && (
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="radio"
              name="chapterMode"
              value="whole"
              checked={chapterMode === "whole"}
              onChange={handleChapterModeChange}
              style={{ marginRight: "5px" }}
            />
            Whole Chapter
          </label>
          <label style={{ marginLeft: "20px" }}>
            <input
              type="radio"
              name="chapterMode"
              value="subchapter"
              checked={chapterMode === "subchapter"}
              onChange={handleChapterModeChange}
              style={{ marginRight: "5px" }}
            />
            Sub-chapter
          </label>
        </div>
      )}

      {/* If mode=chapters, we show the chapter dropdown */}
      {mode === "chapters" && chaptersForBook.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "10px" }}>
            Select Chapter:
            <select
              value={selectedChapter}
              onChange={handleSelectChapter}
              style={{ marginLeft: "5px" }}
            >
              <option value="">-- Choose a Chapter --</option>
              {chaptersForBook.map((ch) => (
                <option key={ch.chapterName} value={ch.chapterName}>
                  {ch.chapterName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* If user chooses "subchapter", show sub-chapter dropdown */}
      {mode === "chapters" && chapterMode === "subchapter" && subChaptersForChapter.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <label style={{ marginRight: "10px" }}>
            Select Sub-chapter:
            <select
              value={selectedSubChapter}
              onChange={handleSelectSubChapter}
              style={{ marginLeft: "5px" }}
            >
              <option value="">-- Choose a Sub-chapter --</option>
              {subChaptersForChapter.map((sc) => (
                <option key={sc.subChapterName} value={sc.subChapterName}>
                  {sc.subChapterName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Page Range Inputs + Fetch Button */}
      <div style={{ marginBottom: "10px" }}>
        <label style={{ marginRight: "5px" }}>
          Start Page:
          <input
            type="number"
            value={startPage}
            onChange={(e) => setStartPage(e.target.value)}
            style={{ marginLeft: "5px", width: "60px" }}
            disabled={mode === "chapters"} // if chapters mode, we fill automatically (for both whole + subchapter)
          />
        </label>

        <label style={{ marginLeft: "20px", marginRight: "5px" }}>
          End Page:
          <input
            type="number"
            value={endPage}
            onChange={(e) => setEndPage(e.target.value)}
            style={{ marginLeft: "5px", width: "60px" }}
            disabled={mode === "chapters"} // if chapters mode, we fill automatically
          />
        </label>

        <button onClick={handleFetchPages} style={{ marginLeft: "20px", padding: "6px 12px" }}>
          Fetch
        </button>
      </div>

      {/* Display text in a textarea */}
      <textarea
        rows="10"
        cols="80"
        readOnly
        value={retrievedText}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
}

export default BookTextViewer;