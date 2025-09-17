// TimelineView.jsx
import React from "react";

/**
 * TimelineView
 * -----------
 * Props:
 *  - selectedDate (string)
 *  - timelineEvents: array of objects, each with:
 *      { type, docId, subChapterId, eventTime (Date), detail (string) }
 */
export default function TimelineView({ selectedDate, timelineEvents = [] }) {
  if (!selectedDate) {
    return <p style={styles.infoText}>No date selected.</p>;
  }
  if (timelineEvents.length === 0) {
    return (
      <p style={styles.infoText}>
        No timeline events found for {selectedDate}.
      </p>
    );
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={styles.sectionTitle}>Timeline for {selectedDate}</h3>
      {timelineEvents.map((evt, index) => {
        const timeString = evt.eventTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        return (
          <div key={evt.docId || index} style={styles.timelineItem}>
            <div style={styles.timelineTime}>{timeString}</div>
            <div style={styles.timelineContent}>
              <p style={{ margin: "4px 0", fontWeight: "bold" }}>{evt.type}</p>
              <p style={{ margin: "4px 0" }}>
                <strong>Sub-chapter:</strong> {evt.subChapterId || "—"}
              </p>
              <p style={{ margin: "4px 0" }}>{evt.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Styles
const styles = {
  infoText: {
    fontSize: "0.95rem",
    color: "#333",
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
  timelineItem: {
    display: "flex",
    borderLeft: "3px solid #ccc",
    padding: "8px 0",
    margin: "8px 0",
    position: "relative",
  },
  timelineTime: {
    marginRight: "12px",
    fontWeight: "bold",
    minWidth: "70px",
    textAlign: "right",
  },
  timelineContent: {
    marginLeft: "12px",
    backgroundColor: "#fafafa",
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #eee",
    flex: 1,
  },
};