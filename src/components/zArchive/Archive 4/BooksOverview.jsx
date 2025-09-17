import React, { useEffect, useState } from 'react';

// If you're using Vite, you might have VITE_BACKEND_URL in .env
// For Create React App, use process.env.REACT_APP_BACKEND_URL
const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Parse the leading numeric sections of a name string.
 * Example:
 *  - "9. Local Government" => [9]
 *  - "10.2.1 Some Title" => [10, 2, 1]
 *  - "Chapter 12 Something" => no leading digits => [Infinity] (forces it to the end in sorting)
 */
function parseLeadingSections(str) {
  // Split by '.' to see if there are multiple numeric segments
  // e.g. "10.2.1 Title" -> ["10", "2", "1 Title"]
  const parts = str.split('.').map((p) => p.trim());
  const result = [];

  for (let i = 0; i < parts.length; i++) {
    // Attempt to parse each part as a number
    // Once we hit a non-numeric, we stop
    const maybeNum = parseInt(parts[i], 10);
    if (!isNaN(maybeNum)) {
      result.push(maybeNum);
    } else {
      // If we reach something not purely numeric, break
      // because we only want leading numeric segments
      break;
    }
  }

  // If we found no valid leading digits, return [Infinity] so it sorts last
  if (result.length === 0) return [Infinity];
  return result;
}

/**
 * Compare two arrays of numeric sections lexicographically.
 * e.g. [1] vs [2], or [10,2] vs [10,10], etc.
 */
function compareSections(aSections, bSections) {
  const len = Math.max(aSections.length, bSections.length);
  for (let i = 0; i < len; i++) {
    const aVal = aSections[i] ?? 0;
    const bVal = bSections[i] ?? 0;
    if (aVal !== bVal) {
      return aVal - bVal;
    }
  }
  return 0;
}

/**
 * Sort an array of items (chapters or subchapters) by numeric sections
 * extracted from item.name. If there's a tie, fallback to normal string compare.
 */
function sortByNameWithNumericAware(items) {
  return items.sort((a, b) => {
    const aSections = parseLeadingSections(a.name);
    const bSections = parseLeadingSections(b.name);

    const sectionCompare = compareSections(aSections, bSections);
    if (sectionCompare !== 0) {
      return sectionCompare;
    } else {
      // fallback to standard string sort
      return a.name.localeCompare(b.name);
    }
  });
}

/**
 * Sum word/page counts for a single chapter by looking at its subchapters.
 */
function getChapterStats(chapter) {
  let totalWords = 0;
  let totalPages = 0;
  if (chapter.subchapters) {
    chapter.subchapters.forEach((sub) => {
      totalWords += sub.wordCount || 0;
      totalPages += sub.pageCount || 0;
    });
  }
  return { totalWords, totalPages };
}

/**
 * Sum an entire book's word/page count (all chapters → subchapters).
 */
function getBookStats(book) {
  let totalWords = 0;
  let totalPages = 0;
  if (book.chapters) {
    book.chapters.forEach((ch) => {
      const { totalWords: cWords, totalPages: cPages } = getChapterStats(ch);
      totalWords += cWords;
      totalPages += cPages;
    });
  }
  return { totalWords, totalPages };
}

function BooksOverview() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expand states
  // e.g. expandedBooks[bookId] = true/false
  const [expandedBooks, setExpandedBooks] = useState({});
  // e.g. expandedChapters[chapterId] = true/false
  const [expandedChapters, setExpandedChapters] = useState({});
  // e.g. expandedSubchapters[subchapterId] = true/false
  const [expandedSubchapters, setExpandedSubchapters] = useState({});

  // Toggles
  const toggleBook = (bookId) => {
    setExpandedBooks((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };
  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };
  const toggleSubchapter = (subchapterId) => {
    setExpandedSubchapters((prev) => ({
      ...prev,
      [subchapterId]: !prev[subchapterId],
    }));
  };

  useEffect(() => {
    fetch(`${backendURL}/api/books-structure`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch data.');
        }
        return res.json();
      })
      .then((data) => {
        // Before storing, sort chapters & subchapters in each book
        const sortedData = data.map((book) => {
          if (!book.chapters) return book;

          // Sort chapters by name with numeric awareness
          const sortedChapters = sortByNameWithNumericAware([...book.chapters])
            .map((chapter) => {
              if (!chapter.subchapters) return chapter;

              // Sort subchapters
              const sortedSubs = sortByNameWithNumericAware([...chapter.subchapters]);
              return { ...chapter, subchapters: sortedSubs };
            });

          return { ...book, chapters: sortedChapters };
        });
        setBooks(sortedData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading data…</div>;
  if (error) return <div>Error: {error}</div>;

  /** 
   * Build up table rows in a single pass by traversing 
   * each Book → Chapter → Subchapter. 
   */
  const renderTableRows = () => {
    const rows = [];

    books.forEach((book) => {
      const { totalWords: bookWordCount, totalPages: bookPageCount } = getBookStats(book);

      // 1) Book row
      rows.push(
        <tr key={`book-${book.id}`}>
          <td style={{ textAlign: 'center' }}>
            <button onClick={() => toggleBook(book.id)}>
              {expandedBooks[book.id] ? '–' : '+'}
            </button>
          </td>
          <td>{book.name}</td>  {/* Book column */}
          <td></td>            {/* Chapter column empty for a book row */}
          <td></td>            {/* Subchapter column empty for a book row */}
          <td>{bookWordCount}</td>
          <td>{bookPageCount}</td>
          <td></td>            {/* Quiz ID empty */}
          <td></td>            {/* Score empty */}
          <td></td>            {/* IsRead empty */}
          <td></td>            {/* Proficiency empty */}
          <td></td>            {/* Summary empty */}
        </tr>
      );

      // 2) If book is expanded, show chapters
      if (expandedBooks[book.id] && book.chapters) {
        book.chapters.forEach((chapter) => {
          const { totalWords: cWords, totalPages: cPages } = getChapterStats(chapter);

          rows.push(
            <tr key={`chapter-${chapter.id}`}>
              <td style={{ textAlign: 'center', paddingLeft: '1.5rem' }}>
                <button onClick={() => toggleChapter(chapter.id)}>
                  {expandedChapters[chapter.id] ? '–' : '+'}
                </button>
              </td>
              <td></td>             {/* Book column blank */}
              <td>{chapter.name}</td>    {/* Chapter column */}
              <td></td>             {/* Subchapter blank */}
              <td>{cWords}</td>     {/* Summation over subchapters */}
              <td>{cPages}</td>
              <td></td>             {/* Quiz empty at Chapter level */}
              <td></td>             {/* Score empty at Chapter level */}
              <td></td>             {/* IsRead empty at Chapter level */}
              <td></td>             {/* Proficiency empty */}
              <td></td>             {/* Summary empty */}
            </tr>
          );

          // 3) If chapter is expanded, show subchapters
          if (expandedChapters[chapter.id] && chapter.subchapters) {
            chapter.subchapters.forEach((sub) => {
              rows.push(
                <tr key={`subchapter-${sub.id}`}>
                  <td style={{ textAlign: 'center', paddingLeft: '3rem' }}>
                    <button onClick={() => toggleSubchapter(sub.id)}>
                      {expandedSubchapters[sub.id] ? '–' : '+'}
                    </button>
                  </td>
                  <td></td>           {/* Book column blank */}
                  <td></td>           {/* Chapter column blank */}
                  <td>{sub.name}</td> {/* Subchapter column */}
                  <td>{sub.wordCount || 0}</td>
                  <td>{sub.pageCount || 0}</td>
                  <td>{sub.quizId || ''}</td>
                  <td>{sub.score ?? ''}</td>
                  <td>{sub.isRead ? 'Yes' : 'No'}</td>
                  <td>{sub.proficiency || ''}</td>
                  {/* Show summary only if expanded */}
                  <td>
                    {expandedSubchapters[sub.id] ? sub.summary : ''}
                  </td>
                </tr>
              );
            });
          }
        });
      }
    });
    return rows;
  };

  return (
    <div style={{ margin: '1rem' }}>
      <h1>Books (Tree Table with Numeric Sorting)</h1>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '1rem',
          border: '1px solid #ccc'
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            {/* Expand button column */}
            <th style={{ width: '50px', textAlign: 'center' }}>Expand</th>
            <th>Book</th>
            <th>Chapter</th>
            <th>Subchapter</th>
            <th>Word Count</th>
            <th>Page Count</th>
            <th>Quiz ID</th>
            <th>Score</th>
            <th>Is Read</th>
            <th>Proficiency</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>{renderTableRows()}</tbody>
      </table>
    </div>
  );
}

export default BooksOverview;