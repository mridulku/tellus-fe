// File: src/components/DetailedBookViewer/PanelTOEFL.jsx
import React from "react";

// We’ll define the 4 desired TOEFL book names in the desired order.
const DESIRED_BOOK_NAMES = [
  "TOEFL Reading Guidebook",
  "TOEFL Writing Guidebook",
  "TOEFL Speaking Guidebook",
  "TOEFL Listening Guidebook",
];

// Map each book title to a relevant icon
const ICON_MAP = {
  "TOEFL Reading Guidebook": "📖",
  "TOEFL Writing Guidebook": "✍️",
  "TOEFL Speaking Guidebook": "🗣️",
  "TOEFL Listening Guidebook": "🎧",
};

/**
 * PanelTOEFL
 *
 * - Renders exactly 4 tiles: Reading (unlocked), Writing/Speaking/Listening (locked).
 * - If "Reading" has a plan, shows "{X}% complete" + a "Start Learning" button.
 * - For locked books => 0% + lock icon.
 * - handleStartLearning(bookId) => call in the parent to open the plan (full-screen).
 */
export default function PanelTOEFL({
  books = [],
  plansData = {},
  handleStartLearning,
  // If you need them, onOpenOnboarding, onSeeAllCourses, etc.
}) {
  // For each of the 4 TOEFL book names, find if the user has it
  const finalBooks = DESIRED_BOOK_NAMES.map((desiredName) => {
    const match = books.find((bk) => bk.name === desiredName);
    return {
      displayName: desiredName,
      icon: ICON_MAP[desiredName] || "📚", // fallback icon
      bookObj: match || null,
    };
  });

  return (
    <div style={styles.container}>
      <h2 style={{ marginBottom: 10 }}>My TOEFL Books</h2>

      <div style={styles.tileContainer}>
        {finalBooks.map((item, index) => {
          // The first tile (index=0 => "Reading") is unlocked
          // Others => locked
          const isLocked = index > 0;

          // If the user actually has that book in their library, we check plan status
          let loading = false;
          let error = null;
          let hasPlan = false;
          let aggregatorProgress = 0;

          if (item.bookObj) {
            const bookId = item.bookObj.id;
            const planInfo = plansData[bookId] || {};
            loading = planInfo.loading;
            error = planInfo.error;
            hasPlan = planInfo.hasPlan;
            aggregatorProgress = planInfo.aggregatorProgress || 0;
          }

          return (
            <div style={styles.tile} key={index}>
              {/* Icon & Title */}
              <div style={styles.headerRow}>
                <span style={styles.bookIcon}>{item.icon}</span>
                <h3 style={styles.bookTitle}>{item.displayName}</h3>
              </div>

              {/* If the user doesn't have this book at all */}
              {!item.bookObj && (
                <p style={styles.noPlanText}>Book not found in your library.</p>
              )}

              {/* If the user has the book */}
              {item.bookObj && (
                <>
                  {isLocked ? (
                    // LOCKED => always show 0%, locked label, no "Start Learning"
                    <>
                      <div style={styles.progressBarContainer}>
                        <div style={{ ...styles.progressBarFill, width: "0%" }} />
                      </div>
                      <p style={styles.progressLabel}>0% complete</p>
                      <div style={styles.lockedContainer}>
                        <span style={styles.lockIcon}>🔒</span>
                        <span>Locked</span>
                      </div>
                    </>
                  ) : (
                    // UNLOCKED => "Reading" tile
                    <>
                      {loading && (
                        <p style={styles.statusText}>Loading plan...</p>
                      )}
                      {!loading && error && (
                        <p style={styles.statusText}>Error: {error}</p>
                      )}
                      {!loading && !error && !hasPlan && (
                        <p style={styles.statusText}>No plan found.</p>
                      )}
                      {!loading && !error && hasPlan && (
                        <>
                          {/* Use aggregatorProgress instead of hard-coded 40% */}
                          <div style={styles.progressBarContainer}>
                            <div
                              style={{
                                ...styles.progressBarFill,
                                width: `${aggregatorProgress}%`,
                              }}
                            />
                          </div>
                          <p style={styles.progressLabel}>
                            {aggregatorProgress.toFixed(1)}% complete
                          </p>

                          {/* Start Learning button => triggers parent's modal */}
                          <button
                            style={styles.startButton}
                            onClick={() => handleStartLearning(item.bookObj.id)}
                          >
                            Start Learning
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------------------
// STYLES
// ------------------------------------
const styles = {
  container: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  tileContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 20,
    marginTop: 16,
    maxWidth: 800,
    margin: "0 auto",
  },
  tile: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    aspectRatio: "1 / 1", // or a fixed height if preferred
    padding: 15,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  bookIcon: {
    fontSize: "2rem",
  },
  bookTitle: {
    margin: 0,
    fontSize: "1.1rem",
  },
  noPlanText: {
    fontSize: "0.9rem",
    opacity: 0.7,
    marginTop: 8,
  },
  statusText: {
    fontSize: "0.9rem",
    opacity: 0.7,
    marginTop: 8,
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    marginTop: 10,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#B39DDB",
    borderRadius: 4,
    transition: "width 0.3s ease",
  },
  progressLabel: {
    margin: "5px 0",
    fontSize: "0.85rem",
    opacity: 0.8,
  },
  lockedContainer: {
    marginTop: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: "1rem",
    fontWeight: "bold",
    backgroundColor: "#333",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 4,
  },
  lockIcon: {
    fontSize: "1.2rem",
  },
  startButton: {
    marginTop: 10,
    backgroundColor: "#B39DDB",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#000",
  },
};