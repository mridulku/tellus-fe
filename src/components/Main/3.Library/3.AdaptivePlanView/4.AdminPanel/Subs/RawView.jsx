// RawView.jsx
import React from "react";

// You can import a shared helper if you want
// but let's just define them here for brevity.

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
  } else if (m > 0) {
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  } else {
    return `${s}s`;
  }
}

export default function RawView({
  selectedDate,
  dailyRecord,
  readingActsForDate,
  quizActsForDate,
  revisionActsForDate,
  readingCompletionsForDate,
  quizCompletionsForDate,
  revisionCompletionsForDate,
}) {
  return (
    <div>
      {/* Daily Record */}
      {dailyRecord && (
        <div style={styles.dailyCard}>
          <h3 style={styles.sectionTitle}>
            {selectedDate} – Overall Usage
          </h3>
          <p style={{ margin: "0.5rem 0", fontWeight: "bold", color: "#111" }}>
            Total: {formatTime(dailyRecord.totalSeconds)}
          </p>
        </div>
      )}

      {/* Reading Activities (Time lumps) */}
      {readingActsForDate.length > 0 && (
        <div style={styles.activitySection}>
          <h4 style={styles.activityTitle}>Reading Activities (Time Lumps)</h4>
          {readingActsForDate.map((ra) => (
            <div key={ra.docId} style={styles.activityCard}>
              <p style={styles.activityLabel}>
                <strong>Sub-chapter ID:</strong> {ra.subChapterId || "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Time:</strong> {formatTime(ra.totalSeconds)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Attempts (Time Lumps) */}
      {quizActsForDate.length > 0 && (
        <div style={styles.activitySection}>
          <h4 style={styles.activityTitle}>Quiz Attempts (Time Lumps)</h4>
          {quizActsForDate.map((qa) => (
            <div key={qa.docId} style={styles.activityCard}>
              <p style={styles.activityLabel}>
                <strong>Sub-chapter ID:</strong> {qa.subChapterId || "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Stage:</strong> {qa.quizStage || "N/A"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Attempt #:</strong> {qa.attemptNumber != null ? qa.attemptNumber : "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Time:</strong> {formatTime(qa.totalSeconds)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Revision Attempts (Time Lumps) */}
      {revisionActsForDate.length > 0 && (
        <div style={styles.activitySection}>
          <h4 style={styles.activityTitle}>Revision Attempts (Time Lumps)</h4>
          {revisionActsForDate.map((rv) => (
            <div key={rv.docId} style={styles.activityCard}>
              <p style={styles.activityLabel}>
                <strong>Sub-chapter ID:</strong> {rv.subChapterId || "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Stage:</strong> {rv.quizStage || "N/A"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Revision #:</strong> {rv.attemptNumber != null ? rv.attemptNumber : "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Time:</strong> {formatTime(rv.totalSeconds)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reading Completions */}
      {readingCompletionsForDate.length > 0 && (
        <div style={styles.activitySection}>
          <h4 style={styles.activityTitle}>Reading Completions</h4>
          {readingCompletionsForDate.map((rc) => (
            <div key={rc.docId} style={styles.activityCard}>
              <p style={styles.activityLabel}>
                <strong>Sub-chapter ID:</strong> {rc.subChapterId || "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Start Time:</strong>{" "}
                {rc.readingStartTime ? rc.readingStartTime.toDate().toLocaleString() : "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>End Time:</strong>{" "}
                {rc.readingEndTime ? rc.readingEndTime.toDate().toLocaleString() : "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Performance:</strong> {rc.productReadingPerformance || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Completions */}
      {quizCompletionsForDate.length > 0 && (
        <div style={styles.activitySection}>
          <h4 style={styles.activityTitle}>Quiz Completions</h4>
          {quizCompletionsForDate.map((qc) => (
            <div key={qc.docId} style={styles.activityCard}>
              <p style={styles.activityLabel}>
                <strong>Sub-chapter ID:</strong> {qc.subChapterId || "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Quiz Type:</strong> {qc.quizType || "N/A"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Attempt #:</strong> {qc.attemptNumber}
              </p>
              <p style={styles.activityLabel}>
                <strong>Score:</strong> {qc.score || "N/A"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Questions:</strong> {qc.quizSubmission.length} total
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Revision Completions */}
      {revisionCompletionsForDate.length > 0 && (
        <div style={styles.activitySection}>
          <h4 style={styles.activityTitle}>Revision Completions</h4>
          {revisionCompletionsForDate.map((rvc) => (
            <div key={rvc.docId} style={styles.activityCard}>
              <p style={styles.activityLabel}>
                <strong>Sub-chapter ID:</strong> {rvc.subChapterId || "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Revision #:</strong> {rvc.revisionNumber != null ? rvc.revisionNumber : "—"}
              </p>
              <p style={styles.activityLabel}>
                <strong>Revision Type:</strong> {rvc.revisionType || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Styles for the RawView
const styles = {
  dailyCard: {
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  sectionTitle: {
    margin: "0.5rem 0",
    color: "#333",
    fontSize: "1.05rem",
    fontWeight: 600,
    borderBottom: "1px solid #ccc",
    paddingBottom: "0.3rem",
  },
  activitySection: {
    marginBottom: "1.5rem",
  },
  activityTitle: {
    fontSize: "1rem",
    margin: "0.5rem 0",
    color: "#444",
    fontWeight: 600,
    borderBottom: "1px solid #ccc",
    paddingBottom: "0.3rem",
  },
  activityCard: {
    backgroundColor: "#fdfdfd",
    border: "1px solid #eee",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    margin: "0.5rem 0",
  },
  activityLabel: {
    margin: "4px 0",
    fontSize: "0.9rem",
    color: "#444",
  },
};