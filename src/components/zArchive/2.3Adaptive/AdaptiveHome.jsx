// src/components/DetailedBookViewer/AdaptiveHome.jsx
import React from "react";

// A bigger, resource-intensive approach to a polished dashboard
function AdaptiveHome({ booksData = [] }) {
  // Placeholder “user stats” or “adaptive metrics”
  const userReadingSpeed = 200; // wpm (example)
  const globalProgress = 40;    // percent done with the main adaptive plan
  const userName = "John Doe";  // or fetch from your auth

  // Example: Some “stages” in the adaptive learning journey
  const adaptiveStages = [
    {
      id: 1,
      label: "Stage 1: Book Uploaded",
      description: "You selected your book or material. The system analyzed it.",
      icon: "📥",
      isComplete: true,
    },
    {
      id: 2,
      label: "Stage 2: Reading & Summaries",
      description: "You’re currently reading chapters, summarizing content, and taking initial quizzes.",
      icon: "📖",
      isComplete: false,
    },
    {
      id: 3,
      label: "Stage 3: Deeper Quizzes",
      description: "We’ll test deeper recall and mastery with spaced quizzes.",
      icon: "❓",
      isComplete: false,
    },
    {
      id: 4,
      label: "Stage 4: Final Mastery Check",
      description: "A final review ensures you’re ready for your exam or goal date.",
      icon: "🏆",
      isComplete: false,
    },
  ];

  // This could show "today’s tasks" or recommended next steps
  const recommendedActions = [
    {
      title: "Read Next 10 Pages",
      detail: "Estimated 15 minutes (based on 200 wpm)",
      actionLabel: "Start Reading",
      icon: "📄",
    },
    {
      title: "Quiz on Chapter 1",
      detail: "Reinforce your memory from 2 days ago",
      actionLabel: "Take Quiz",
      icon: "❔",
    },
  ];

  return (
    <div style={homeContainerStyle}>
      {/* Header greeting */}
      <h2 style={{ marginTop: 0, marginBottom: "10px" }}>
        Welcome back, {userName}!
      </h2>
      <p style={{ fontStyle: "italic", opacity: 0.8, marginBottom: "30px" }}>
        Here’s your Adaptive Learning Dashboard. Stay on track to reach your goal!
      </p>

      {/* Top row: user stats + progress bar */}
      <div style={statsContainerStyle}>
        {/* Left: big progress ring or bar */}
        <div style={progressCardStyle}>
          <h3 style={progressTitleStyle}>Overall Progress</h3>
          <div style={progressBarContainerStyle}>
            <div style={{ ...progressBarFillStyle, width: `${globalProgress}%` }} />
          </div>
          <p style={{ marginTop: "10px", textAlign: "center" }}>
            {globalProgress}% Complete
          </p>
        </div>

        {/* Middle: reading speed / times */}
        <div style={infoCardStyle}>
          <div style={infoCardIconStyle}>⚡</div>
          <div>
            <h4 style={infoCardTitleStyle}>Reading Speed</h4>
            <p style={infoCardDescriptionStyle}>
              ~{userReadingSpeed} words per minute
            </p>
          </div>
        </div>

        {/* Right: number of books or custom “Your Profile” block */}
        <div style={infoCardStyle}>
          <div style={infoCardIconStyle}>📚</div>
          <div>
            <h4 style={infoCardTitleStyle}>Books in Adaptive Plan</h4>
            <p style={infoCardDescriptionStyle}>{booksData.length}</p>
          </div>
        </div>
      </div>

      {/* Adaptive Stages / Timeline */}
      <div style={stagesContainerStyle}>
        <h3 style={{ marginBottom: "15px" }}>Your Adaptive Journey</h3>
        <div style={stageListStyle}>
          {adaptiveStages.map((stage) => (
            <div key={stage.id} style={stageItemStyle}>
              <div style={stageIconStyle}>
                <span style={{ fontSize: "1.5rem" }}>{stage.icon}</span>
              </div>
              <div style={stageTextStyle}>
                <h4 style={{ margin: "0 0 5px 0" }}>
                  {stage.label}
                  {stage.isComplete && (
                    <span style={stageCompleteStyle}> (Done)</span>
                  )}
                </h4>
                <p style={{ fontSize: "0.9rem", margin: 0 }}>
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div style={tasksContainerStyle}>
        <h3 style={{ marginBottom: "15px" }}>Recommended Next Steps</h3>
        {recommendedActions.map((action, idx) => (
          <div key={idx} style={taskCardStyle}>
            <div style={taskCardIconStyle}>{action.icon}</div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: "0 0 5px 0" }}>{action.title}</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.8 }}>
                {action.detail}
              </p>
            </div>
            <button style={taskActionButtonStyle}>
              {action.actionLabel}
            </button>
          </div>
        ))}
      </div>

      {/* Book Listing (like original) */}
      <div style={{ marginTop: "40px" }}>
        <h3 style={{ marginBottom: "10px" }}>Adaptive Books</h3>
        {booksData.length === 0 ? (
          <div style={noBooksStyle}>No adaptive books found.</div>
        ) : (
          <div style={booksGridStyle}>
            {booksData.map((book) => (
              <div key={book.bookName} style={bookCardStyle}>
                <span role="img" aria-label="book" style={bookIconStyle}>
                  🔖
                </span>
                <div style={bookTitleStyle}>{book.bookName}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =================== STYLES ===================
const homeContainerStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "8px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
};

// Stats & progress row
const statsContainerStyle = {
  display: "flex",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "30px",
};

// Progress card
const progressCardStyle = {
  flex: "1 1 200px",
  backgroundColor: "rgba(0,0,0,0.3)",
  padding: "20px",
  borderRadius: "8px",
  textAlign: "center",
};

const progressTitleStyle = {
  margin: "0 0 10px 0",
  fontSize: "1.1rem",
  fontWeight: "bold",
};

const progressBarContainerStyle = {
  width: "100%",
  height: "14px",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "8px",
  overflow: "hidden",
};

const progressBarFillStyle = {
  height: "100%",
  backgroundColor: "#FFD700",
  transition: "width 0.5s",
};

// Info card (for reading speed, etc.)
const infoCardStyle = {
  flex: "1 1 150px",
  display: "flex",
  alignItems: "center",
  backgroundColor: "rgba(0,0,0,0.3)",
  borderRadius: "8px",
  padding: "15px",
};

const infoCardIconStyle = {
  fontSize: "2rem",
  marginRight: "10px",
};

const infoCardTitleStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: "bold",
};

const infoCardDescriptionStyle = {
  margin: 0,
  fontSize: "0.9rem",
  opacity: 0.9,
};

// Stages / timeline
const stagesContainerStyle = {
  marginBottom: "30px",
};

const stageListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const stageItemStyle = {
  display: "flex",
  backgroundColor: "rgba(255,255,255,0.15)",
  padding: "10px",
  borderRadius: "6px",
  alignItems: "center",
};

const stageIconStyle = {
  fontSize: "1.5rem",
  marginRight: "15px",
};

const stageTextStyle = {
  display: "flex",
  flexDirection: "column",
};

const stageCompleteStyle = {
  marginLeft: "8px",
  color: "#FFD700",
  fontSize: "0.85rem",
};

// Recommended tasks
const tasksContainerStyle = {
  marginBottom: "30px",
};

const taskCardStyle = {
  display: "flex",
  alignItems: "center",
  backgroundColor: "rgba(255,255,255,0.15)",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "10px",
};

const taskCardIconStyle = {
  fontSize: "1.5rem",
  marginRight: "10px",
  width: "30px",
  textAlign: "center",
};

const taskActionButtonStyle = {
  backgroundColor: "#FFD700",
  color: "#000",
  border: "none",
  borderRadius: "6px",
  padding: "8px 12px",
  fontWeight: "bold",
  cursor: "pointer",
};

// Book listing (like original)
const noBooksStyle = {
  marginTop: "20px",
  padding: "10px",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "6px",
  textAlign: "center",
};

const booksGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "15px",
  marginTop: "20px",
};

const bookCardStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px 15px",
  borderRadius: "6px",
  minWidth: "150px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const bookIconStyle = {
  fontSize: "2rem",
  marginBottom: "5px",
};

const bookTitleStyle = {
  fontWeight: "bold",
  color: "#FFD700",
};

export default AdaptiveHome;