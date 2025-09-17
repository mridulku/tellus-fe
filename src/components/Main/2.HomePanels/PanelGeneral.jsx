/* ───────────────────────────────────────────────────────────────
   File:  src/components/DetailedBookViewer/PanelGeneral.jsx
   Auto-resume logic removed (2025-05-18)
──────────────────────────────────────────────────────────────── */

import React from "react";

/* helper → pick a cute icon */
function getRandomIcon() {
  const icons = ["📐", "🔬", "🏰", "🎨", "📚", "📝", "📊", "💻"];
  return icons[Math.floor(Math.random() * icons.length)];
}

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function PanelGeneral({
  books = [],
  plansData = {},
  handleStartLearning = () => {},
  onOpenOnboarding   = () => {},
  onSeeAllCourses    = () => {},
}) {
  /* --------------------------------------------------------------
     Build the list of tiles to show (real books + “See All”)
  -------------------------------------------------------------- */
  const booksCount = books.length;
  let displayBooks = [];

  if (booksCount === 0) {
    /* No books at all → single “See All” card */
    displayBooks = [
      { isSeeAll: true, title: "See All Courses", icon: "📚" },
    ];
  } else if (booksCount <= 4) {
    /* ≤4 books → show them + “See All” */
    displayBooks = books.map((b) => ({
      isSeeAll: false,
      bookId:   b.id,
      title:    b.name || "Untitled",
      icon:     getRandomIcon(),
    }));
    displayBooks.push({ isSeeAll: true, title: "See All Courses", icon: "📚" });
  } else {
    /* >4 books → first 4 + “X more courses” */
    const firstFour = books.slice(0, 4).map((b) => ({
      isSeeAll: false,
      bookId:   b.id,
      title:    b.name || "Untitled",
      icon:     getRandomIcon(),
    }));
    const remaining = booksCount - 4;
    firstFour.push({
      isSeeAll: true,
      title:    `${remaining} more courses available`,
      icon:     "📚",
    });
    displayBooks = firstFour;
  }

  /* --------------------------------------------------------------
     RENDER
  -------------------------------------------------------------- */
  return (
    <div style={styles.container}>
      {/* header row */}
      <div style={styles.topRow}>
        <h2>My Courses / Books</h2>
        <button style={styles.uploadButton} onClick={onOpenOnboarding}>
          <span style={{ marginRight: 6 }}>⬆️</span> Upload New Material
        </button>
      </div>

      {/* tiles */}
      <div style={styles.tileContainer}>
        {displayBooks.map((item, idx) =>
          item.isSeeAll ? (
            /* ── “See All Courses” tile ── */
            <div key={`seeAll-${idx}`} style={styles.tile}>
              <div style={styles.iconStyle}>{item.icon}</div>
              <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>
              <button style={styles.seeAllButton} onClick={onSeeAllCourses}>
                See All Courses
              </button>
            </div>
          ) : (
            /* ── real book tile ── */
            <BookTile
              key={`course-${idx}`}
              item={item}
              planInfo={plansData[item.bookId] || {}}
              onStart={() => handleStartLearning(item.bookId)}
            />
          )
        )}
      </div>
    </div>
  );
}

/* =================================================================
   Child component for one book tile
   ================================================================= */
function BookTile({ item, planInfo, onStart }) {
  const {
    loading      = false,
    error        = null,
    hasPlan      = false,
    readCount    = 0,
    quizCount    = 0,
    reviseCount  = 0,
    totalTime    = 0,
    /* planId etc. are ignored here because auto-resume is gone */
  } = planInfo;

  return (
    <div style={styles.tile}>
      <div style={styles.iconStyle}>{item.icon}</div>
      <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

      {/* status & progress */}
      {loading && (
        <p style={styles.statusText}>Loading plan…</p>
      )}

      {!loading && error && (
        <p style={styles.statusText}>Error: {error}</p>
      )}

      {!loading && !error && !hasPlan && (
        <p style={styles.statusText}>No learning plan found.</p>
      )}

      {!loading && !error && hasPlan && (
        <>
          {/* progress bar – placeholder 40 % until you wire real data */}
          <div style={styles.progressBarContainer}>
            <div style={{ ...styles.progressBarFill, width: "40%" }} />
          </div>
          <p style={styles.progressLabel}>40% complete</p>

          {/* tiny stats */}
          <div style={styles.infoContainer}>
            <div style={styles.infoLine}>⏰ {totalTime} min total</div>
            <div style={styles.infoLine}>📖 {readCount} read</div>
            <div style={styles.infoLine}>❓ {quizCount} quizzes</div>
            <div style={styles.infoLine}>🔄 {reviseCount} revise</div>
          </div>

          {/* CTA */}
          <button style={styles.primaryButton} onClick={onStart}>
            Start Learning
          </button>
        </>
      )}
    </div>
  );
}

/* =================================================================
   Styles
   ================================================================= */
const styles = {
  container: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  tileContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 20,
    marginTop: 16,
  },
  tile: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    padding: 15,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  iconStyle: { fontSize: "2rem" },

  /* buttons */
  seeAllButton: {
    marginTop: 10,
    backgroundColor: "#03A9F4",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  primaryButton: {
    marginTop: 10,
    backgroundColor: "#B39DDB",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  /* progress bar */
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

  /* info lines */
  infoContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: 10,
  },
  infoLine: {
    fontSize: "0.75rem",
    marginBottom: 4,
    opacity: 0.9,
  },

  statusText: {
    fontSize: "0.9rem",
    opacity: 0.7,
    marginTop: 10,
  },
};