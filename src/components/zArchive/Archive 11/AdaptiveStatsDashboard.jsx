import React, { useState } from "react";

/**
 * ModernDashboard.jsx
 *
 * A "modern" tile-based dashboard that:
 *  - Includes a top toolbar with a search box + filter dropdown
 *  - Displays stats in tiles (grid layout)
 *  - Maintains the dark gradient background + translucent panels
 *
 * This is purely an example layout. In real usage, pass actual data
 * from your APIs or hooks, and wire up the search/filter logic to them.
 */
function ModernDashboard() {
  // =========== EXAMPLE DATA FOR DEMO =============
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Some hypothetical subchapter stats:
  const totalChapters = 9;
  const totalSubChapters = 30;
  const unreadSubChapters = 10;
  const readSubChapters = 15;
  const proficientSubChapters = 5;

  // Some time stats:
  const totalReadingTimeMin = 120; // e.g. 2 hours total reading
  const totalQuizTimeMin = 30;     // e.g. 30 min on quizzes
  const avgWpm = 190;

  // Book name for demonstration
  const bookName = "The Subtle Art of Not Giving a F**k";

  // Example subchapter data for "search + filter"
  const allSubChapters = [
    { id: "1.1", name: "Introduction", status: "read" },
    { id: "1.2", name: "The Problem", status: "read" },
    { id: "1.3", name: "Deep Dive", status: "proficient" },
    { id: "2.1", name: "Another Topic", status: "unread" },
    { id: "2.2", name: "Yet Another", status: "unread" },
    // ...
  ];

  // =========== FILTER / SEARCH IMPLEMENTATION ===========
  const displayedSubChapters = allSubChapters.filter((sc) => {
    // 1) Check status filter
    if (statusFilter !== "All" && sc.status !== statusFilter.toLowerCase()) {
      return false;
    }
    // 2) Check search term
    const lowerName = sc.name.toLowerCase();
    if (searchTerm && !lowerName.includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // =========== STYLE OBJECTS ===========
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    color: "#fff",
    fontFamily: "'Open Sans', sans-serif",
    padding: "20px",
  };

  // Top toolbar for search/filter
  const toolbarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px",
  };

  const leftToolbarStyle = {
    display: "flex",
    flexDirection: "column",
  };

  const searchFilterContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const searchInputStyle = {
    padding: "8px",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.9rem",
  };

  const selectStyle = {
    padding: "8px",
    border: "none",
    borderRadius: "4px",
    fontSize: "0.9rem",
  };

  // The grid of tiles
  const tilesGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  };

  const tileStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "16px",
  };

  // Table or list container for subchapters
  const subchapterListStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "16px",
  };

  // =========== RENDER ===========
  return (
    <div style={containerStyle}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        <div style={leftToolbarStyle}>
          <h2 style={{ margin: "0 0 5px" }}>Library Dashboard</h2>
          <p style={{ margin: 0, fontSize: "0.95rem", color: "#ccc" }}>
            A quick overview of your book and progress
          </p>
        </div>

        <div style={searchFilterContainerStyle}>
          {/* Search box */}
          <input
            type="text"
            placeholder="Search subchapters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={selectStyle}
          >
            <option value="All">All statuses</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
            <option value="Proficient">Proficient</option>
          </select>
        </div>
      </div>

      {/* Stats Tiles */}
      <div style={tilesGridStyle}>
        {/* Tile 1: Book Info */}
        <div style={tileStyle}>
          <h3 style={{ marginTop: 0 }}>Book Info</h3>
          <p style={{ margin: "5px 0" }}>
            <strong>Title:</strong> {bookName}
            <br />
            <strong>Chapters:</strong> {totalChapters}
            <br />
            <strong>SubChapters:</strong> {totalSubChapters}
          </p>
        </div>

        {/* Tile 2: Subchapter Status */}
        <div style={tileStyle}>
          <h3 style={{ marginTop: 0 }}>Subchapter Status</h3>
          <p style={{ margin: "5px 0" }}>
            <strong>Unread:</strong> {unreadSubChapters}
            <br />
            <strong>Read:</strong> {readSubChapters}
            <br />
            <strong>Proficient:</strong> {proficientSubChapters}
          </p>
        </div>

        {/* Tile 3: Time Stats */}
        <div style={tileStyle}>
          <h3 style={{ marginTop: 0 }}>Time & Speed</h3>
          <p style={{ margin: "5px 0" }}>
            <strong>Reading Time:</strong> {Math.floor(totalReadingTimeMin / 60)}h{" "}
            {totalReadingTimeMin % 60}m
            <br />
            <strong>Quiz Time:</strong> {Math.floor(totalQuizTimeMin / 60)}h{" "}
            {totalQuizTimeMin % 60}m
            <br />
            <strong>Avg Speed:</strong> {avgWpm} WPM
          </p>
        </div>
      </div>

      {/* Example upcoming plan tile (optional) */}
      <div style={tileStyle}>
        <h3 style={{ marginTop: 0 }}>Upcoming Sessions</h3>
        <p style={{ margin: "5px 0" }}>
          <em>Example: Session 3 tomorrow, covering subchapters 3.1 & 3.2</em>
        </p>
      </div>

      {/* Subchapter List (Filtered) */}
      <div style={subchapterListStyle}>
        <h3 style={{ marginTop: 0 }}>Subchapters (Filtered)</h3>
        {displayedSubChapters.length === 0 ? (
          <p style={{ fontStyle: "italic" }}>
            No subchapters match your search/filter.
          </p>
        ) : (
          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {displayedSubChapters.map((sc) => (
              <li key={sc.id} style={{ marginBottom: "6px" }}>
                <strong>{sc.id}</strong> - {sc.name} ({sc.status})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ModernDashboard;