import React, { useEffect, useState } from 'react';

const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Parse the leading numeric sections of a name string.
 * Example:
 *   "9. Local Government" => [9]
 *   "10.2.1 Some Title"   => [10, 2, 1]
 */
function parseLeadingSections(str) {
  const parts = str.split('.').map((p) => p.trim());
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    const maybeNum = parseInt(parts[i], 10);
    if (!isNaN(maybeNum)) {
      result.push(maybeNum);
    } else {
      break;
    }
  }
  if (result.length === 0) return [Infinity];
  return result;
}

/** Compare arrays of numeric segments lexicographically. */
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

/** Sort array of objects by numeric segments in obj.name. */
function sortByNameWithNumericAware(items) {
  return items.sort((a, b) => {
    if (!a.name && !b.name) return 0;
    if (!a.name) return 1;
    if (!b.name) return -1;

    const aSections = parseLeadingSections(a.name);
    const bSections = parseLeadingSections(b.name);

    const sectionCompare = compareSections(aSections, bSections);
    if (sectionCompare !== 0) {
      return sectionCompare;
    } else {
      return a.name.localeCompare(b.name);
    }
  });
}

/**
 * Get total words, "read or proficient" words, and "proficient-only" words for a book.
 */
function getBookProgressStats(book) {
  let totalWords = 0;
  let readOrProficientWords = 0;
  let proficientWords = 0;

  if (book.chapters) {
    book.chapters.forEach((ch) => {
      if (!ch.subchapters) return;
      ch.subchapters.forEach((sub) => {
        const wc = sub.wordCount || 0;
        totalWords += wc;

        if (sub.proficiency === 'read' || sub.proficiency === 'proficient') {
          readOrProficientWords += wc;
        }
        if (sub.proficiency === 'proficient') {
          proficientWords += wc;
        }
      });
    });
  }

  return { totalWords, readOrProficientWords, proficientWords };
}

function ReadingPlan() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User inputs
  const [wpm, setWpm] = useState(200); // Words per minute
  const [dailyTime, setDailyTime] = useState(20); // Daily reading time (minutes)

  // Final reading plan for each book
  const [readingPlan, setReadingPlan] = useState([]);

  useEffect(() => {
    fetch(`${backendURL}/api/books-structure`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch book data');
        }
        return res.json();
      })
      .then((data) => {
        // Sort the data so reading order is numeric
        const sortedBooks = data.map((book) => {
          if (!book.chapters) return book;

          // Sort chapters
          const sortedChapters = sortByNameWithNumericAware([...book.chapters]).map((chapter) => {
            if (!chapter.subchapters) return chapter;

            // Sort subchapters
            const sortedSubs = sortByNameWithNumericAware([...chapter.subchapters]);
            return { ...chapter, subchapters: sortedSubs };
          });

          return { ...book, chapters: sortedChapters };
        });

        setBooks(sortedBooks);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading data…</div>;
  if (error) return <div>Error: {error}</div>;

  const handleGeneratePlan = () => {
    // wordsPerDay = wpm * dailyTime
    const wordsPerDay = wpm * dailyTime;

    const newPlan = books.map((book) => {
      const days = [];
      let currentDaySubchapters = [];
      let currentDayWordCount = 0;
      let dayIndex = 1;

      if (!book.chapters) {
        return {
          bookName: book.name || 'Untitled Book',
          days: [],
        };
      }

      // Build day-by-day
      for (const chapter of book.chapters) {
        if (!chapter.subchapters) continue;

        for (const sub of chapter.subchapters) {
          const subWordCount = sub.wordCount || 0;

          // If adding this subchapter exceeds the daily limit, push a new day
          if (currentDayWordCount + subWordCount > wordsPerDay && currentDayWordCount > 0) {
            days.push({
              dayNumber: dayIndex,
              subchapters: currentDaySubchapters,
              totalWords: currentDayWordCount,
            });
            dayIndex += 1;
            currentDaySubchapters = [];
            currentDayWordCount = 0;
          }

          currentDaySubchapters.push({
            chapterName: chapter.name,
            subchapterName: sub.name,
            wordCount: subWordCount,
            // We capture the sub's proficiency to highlight row color
            proficiency: sub.proficiency || null,
          });
          currentDayWordCount += subWordCount;
        }
      }

      // leftover subchapters for the last day
      if (currentDaySubchapters.length > 0) {
        days.push({
          dayNumber: dayIndex,
          subchapters: currentDaySubchapters,
          totalWords: currentDayWordCount,
        });
      }

      return {
        bookName: book.name || 'Untitled Book',
        // We'll keep the entire book data so we can compute progress
        bookData: book,
        days,
      };
    });

    setReadingPlan(newPlan);
  };

  // Helper to get row background color
  const getRowStyle = (proficiency) => {
    if (proficiency === 'proficient') {
      return { backgroundColor: 'lightgreen' };
    }
    if (proficiency === 'read') {
      return { backgroundColor: 'lightyellow' };
    }
    return {}; // default no background
  };

  // Simple progress bar style
  function ProgressBar({ percentage, color }) {
    return (
      <div style={{ width: '100%', backgroundColor: '#eee', height: '12px', borderRadius: '4px' }}>
        <div
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: '4px',
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ margin: '1rem' }}>
      <h1>Reading Plan Generator</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '1rem' }}>
          Words per minute:
          <input
            type="number"
            value={wpm}
            onChange={(e) => setWpm(parseInt(e.target.value, 10) || 0)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <label style={{ marginRight: '1rem' }}>
          Daily reading time (minutes):
          <input
            type="number"
            value={dailyTime}
            onChange={(e) => setDailyTime(parseInt(e.target.value, 10) || 0)}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>

        <button onClick={handleGeneratePlan}>Generate Plan</button>
      </div>

      {readingPlan.length === 0 ? (
        <p>No plan yet. Enter your preferences and click "Generate Plan".</p>
      ) : (
        <div>
          {readingPlan.map((bookPlan, idx) => {
            // Compute reading & proficiency progress for this book
            const { totalWords, readOrProficientWords, proficientWords } =
              getBookProgressStats(bookPlan.bookData);

            // Avoid divide-by-zero
            const readingPercent =
              totalWords > 0 ? (readOrProficientWords / totalWords) * 100 : 0;
            const proficiencyPercent =
              totalWords > 0 ? (proficientWords / totalWords) * 100 : 0;

            return (
              <div key={idx} style={{ marginBottom: '2rem' }}>
                <h2>{bookPlan.bookName}</h2>

                {/* Display progress bars (Reading and Proficiency) */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <p style={{ margin: '0 0 4px 0' }}>
                    Reading Progress: {readOrProficientWords} / {totalWords} words
                  </p>
                  <ProgressBar percentage={readingPercent} color="blue" />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ margin: '0 0 4px 0' }}>
                    Proficiency Progress: {proficientWords} / {totalWords} words
                  </p>
                  <ProgressBar percentage={proficiencyPercent} color="green" />
                </div>

                {/* Day-by-Day Plan */}
                {bookPlan.days.length === 0 ? (
                  <p>No chapters/subchapters found for this book.</p>
                ) : (
                  bookPlan.days.map((day) => (
                    <div
                      key={day.dayNumber}
                      style={{
                        border: '1px solid #ccc',
                        padding: '1rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <h3>Day {day.dayNumber}</h3>
                      <p>Total Words: {day.totalWords}</p>

                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #666', textAlign: 'left' }}>
                            <th style={{ width: '40%' }}>Chapter</th>
                            <th style={{ width: '40%' }}>Subchapter</th>
                            <th>Word Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.subchapters.map((sc, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #ddd', ...getRowStyle(sc.proficiency) }}>
                              <td>{sc.chapterName}</td>
                              <td>{sc.subchapterName}</td>
                              <td>{sc.wordCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReadingPlan;