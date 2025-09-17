// TimeCalc.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

/**
 * formatTimeSpent
 * ---------------
 * - If the time is less than 1 minute, display seconds (e.g. "45s")
 * - If 1 minute or more, display minutes with one decimal (e.g. "1.2 min")
 */
function formatTimeSpent(totalMinutes) {
  if (!totalMinutes || totalMinutes <= 0) {
    return "0 min";
  }
  if (totalMinutes < 1) {
    const secs = Math.round(totalMinutes * 60);
    return `${secs}s`;
  }
  return `${totalMinutes.toFixed(1)} min`;
}

/**
 * parseNumericPrefix
 * ------------------
 * Extracts the leading numeric part from a title (e.g. "1.2 Introduction" returns 1.2)
 */
function parseNumericPrefix(title = "") {
  const match = title.trim().match(/^(\d+(\.\d+){0,2})/);
  if (match) {
    return parseFloat(match[1]);
  }
  return Infinity;
}

/**
 * TimeCalc
 * --------
 * This component displays a table that shows:
 *   - Chapter
 *   - Subchapter
 *   - Word Count (from the subchapter document)
 *   - WPM (from the learnerPersonas document)
 *   - Time to Read (calculated as wordCount ÷ WPM; formatted appropriately)
 *   - Total Concepts (fetched from subchapterConcepts documents)
 *   - Four quiz stage columns: Remember, Understand, Apply, Analyze
 *       * For Remember & Understand: each concept requires 1 minute
 *       * For Apply & Analyze: each concept requires 2 minutes
 *   - Total Quiz Time (sum of the four stage times)
 *
 * On hovering over the "Total Concepts" cell, a tooltip will display the concept names.
 *
 * Props:
 *   - db: Firestore instance
 *   - userId: Current user's ID
 *   - bookId: Book ID (to fetch chapters/subchapters)
 */
export default function TimeCalc({ db, userId, bookId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chapters, setChapters] = useState([]);
  const [wpm, setWpm] = useState(null);
  const [subchapterConceptsMap, setSubchapterConceptsMap] = useState({});

  // Fetch chapters and subchapters from Firestore
  useEffect(() => {
    if (!db || !bookId) return;
    setLoading(true);
    setError("");
    async function fetchChapters() {
      try {
        const chaptersArr = [];

        // Fetch chapters from "chapters_demo"
        const chapQ = query(
          collection(db, "chapters_demo"),
          where("bookId", "==", bookId)
        );
        const chapSnap = await getDocs(chapQ);
        chapSnap.docs.forEach((docSnap) => {
          const data = docSnap.data();
          chaptersArr.push({
            id: docSnap.id,
            title: data.title || data.name || `Chapter ${docSnap.id}`,
            subchapters: [],
          });
        });

        // For each chapter, fetch subchapters from "subchapters_demo"
        for (let chap of chaptersArr) {
          const subQ = query(
            collection(db, "subchapters_demo"),
            where("chapterId", "==", chap.id)
          );
          const subSnap = await getDocs(subQ);
          const subs = [];
          subSnap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            subs.push({
              id: docSnap.id,
              name: data.title || data.name || `SubCh ${docSnap.id}`,
              wordCount: data.wordCount || 0,
            });
          });
          // Sort subchapters by numeric prefix
          subs.sort((a, b) => parseNumericPrefix(a.name) - parseNumericPrefix(b.name));
          chap.subchapters = subs;
        }
        // Sort chapters by numeric prefix
        chaptersArr.sort((a, b) => parseNumericPrefix(a.title) - parseNumericPrefix(b.title));
        setChapters(chaptersArr);
      } catch (err) {
        console.error("Error fetching chapters/subchapters:", err);
        setError(err.message || "Failed to fetch chapters/subchapters.");
      } finally {
        setLoading(false);
      }
    }
    fetchChapters();
  }, [db, bookId]);

  // Fetch the learner's WPM from "learnerPersonas" (document ID = userId)
  useEffect(() => {
    if (!db || !userId) return;
    async function fetchWPM() {
      try {
        const personaRef = doc(db, "learnerPersonas", userId);
        const personaSnap = await getDoc(personaRef);
        if (personaSnap.exists()) {
          const data = personaSnap.data();
          console.log("Fetched LearnerPersonas data:", data);
          setWpm(data.wpm || 0);
        } else {
          console.warn("No learnerPersonas doc for user:", userId);
          setWpm(0);
        }
      } catch (err) {
        console.error("Error fetching WPM:", err);
        setError(err.message || "Failed to fetch WPM.");
        setWpm(0);
      }
    }
    fetchWPM();
  }, [db, userId]);

  // For each subchapter, fetch its concepts from "subchapterConcepts"
  useEffect(() => {
    if (!db || chapters.length === 0) return;
    async function fetchConcepts() {
      const conceptMap = {};
      for (const chapter of chapters) {
        for (const sub of chapter.subchapters) {
          try {
            const conceptQ = query(
              collection(db, "subchapterConcepts"),
              where("subChapterId", "==", sub.id)
            );
            const conceptSnap = await getDocs(conceptQ);
            const concepts = conceptSnap.docs.map((docSnap) => docSnap.data());
            conceptMap[sub.id] = concepts;
          } catch (err) {
            console.error("Error fetching concepts for subchapter:", sub.id, err);
            conceptMap[sub.id] = [];
          }
        }
      }
      setSubchapterConceptsMap(conceptMap);
    }
    fetchConcepts();
  }, [db, chapters]);

  // Render the table
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Time Calculation View</h2>
      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {wpm === null ? (
        <p>Loading user reading speed...</p>
      ) : (
        <div>
          <p>
            <strong>Your Reading Speed (WPM):</strong> {wpm}
          </p>
          {chapters.length === 0 ? (
            <p>No chapters found for bookId: {bookId}</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Chapter</th>
                  <th style={styles.th}>Subchapter</th>
                  <th style={styles.th}>Word Count</th>
                  <th style={styles.th}>WPM</th>
                  <th style={styles.th}>Time to Read</th>
                  <th style={styles.th}>Total Concepts</th>
                  <th style={styles.th}>Remember (1 min/conc)</th>
                  <th style={styles.th}>Understand (1 min/conc)</th>
                  <th style={styles.th}>Apply (2 min/conc)</th>
                  <th style={styles.th}>Analyze (2 min/conc)</th>
                  <th style={styles.th}>Total Quiz Time</th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter) =>
                  chapter.subchapters.map((sub) => {
                    const wordCount = sub.wordCount;
                    const timeToRead = wpm > 0 ? wordCount / wpm : 0;
                    // Get concepts for this subchapter from subchapterConceptsMap
                    const concepts = subchapterConceptsMap[sub.id] || [];
                    const conceptCount = concepts.length;
                    // Calculate times per stage (in minutes)
                    const rememberTime = conceptCount * 1;
                    const understandTime = conceptCount * 1;
                    const applyTime = conceptCount * 2;
                    const analyzeTime = conceptCount * 2;
                    const totalQuizTime = conceptCount * 6;
                    // Tooltip text for concepts
                    const tooltipText = concepts.map((c) => c.name).join(", ");

                    return (
                      <tr key={sub.id}>
                        <td style={styles.td}>{chapter.title}</td>
                        <td style={styles.td}>{sub.name}</td>
                        <td style={styles.td}>{wordCount}</td>
                        <td style={styles.td}>{wpm}</td>
                        <td style={styles.td}>{formatTimeSpent(timeToRead)}</td>
                        <td style={styles.td}>
                          <span title={tooltipText}>
                            {conceptCount}
                          </span>
                        </td>
                        <td style={styles.td}>{rememberTime} min</td>
                        <td style={styles.td}>{understandTime} min</td>
                        <td style={styles.td}>{applyTime} min</td>
                        <td style={styles.td}>{analyzeTime} min</td>
                        <td style={styles.td}>{totalQuizTime} min</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#fff",
    padding: "16px",
    borderRadius: "4px",
    fontFamily: "Arial, sans-serif",
  },
  heading: {
    marginBottom: "1rem",
    color: "#333",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  th: {
    border: "1px solid #ccc",
    backgroundColor: "#f0f0f0",
    padding: "8px",
    textAlign: "left",
  },
  td: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
  },
};

export { formatTimeSpent, parseNumericPrefix };