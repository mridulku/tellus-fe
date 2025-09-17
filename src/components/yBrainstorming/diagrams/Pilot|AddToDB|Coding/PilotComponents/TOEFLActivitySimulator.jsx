import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * A simple MVP simulator to demonstrate:
 *  - Starting/Ending a session
 *  - Switching between sub-activities (Reading, Quiz, etc.)
 *  - Logging each event to a local state array (which you could send to the backend)
 */
export default function TOEFLActivitySimulator() {
  // Session-level state
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Track which activity is currently active (null if none)
  const [currentActivity, setCurrentActivity] = useState(null);

  // We'll log all events in this array (in real code, you'd POST them to your backend)
  const [events, setEvents] = useState([]);

  // Some sample activities you might have in your plan
  const availableActivities = [
    { id: "reading-1", label: "Reading #1" },
    { id: "quiz-1", label: "Quiz #1" },
    { id: "reading-2", label: "Reading #2" },
    { id: "quiz-2", label: "Quiz #2" },
    { id: "revise-1", label: "Revision #1" },
  ];

  // Helper to log events
  function logEvent(evt) {
    // We add a timestamp & store in local state
    const eventWithTimestamp = {
      ...evt,
      timestamp: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, eventWithTimestamp]);
  }

  // Start session => generate an ID, log "SESSION_START"
  function handleStartSession() {
    if (sessionActive) {
      alert("Session is already active!");
      return;
    }
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    setSessionActive(true);

    logEvent({
      eventType: "SESSION_START",
      sessionId: newSessionId,
      message: "User started session",
    });
  }

  // End session => log "SESSION_END", also end any current activity
  function handleEndSession() {
    if (!sessionActive) {
      alert("No active session to end!");
      return;
    }

    // If an activity is active, first end it
    if (currentActivity) {
      logEvent({
        eventType: "ACTIVITY_END",
        sessionId,
        activityId: currentActivity.id,
        activityLabel: currentActivity.label,
      });
      setCurrentActivity(null);
    }

    logEvent({
      eventType: "SESSION_END",
      sessionId,
      message: "User ended session",
    });

    setSessionActive(false);
    setSessionId(null);
  }

  // Start a specific sub-activity => end the previous one if it exists
  function handleStartActivity(activity) {
    if (!sessionActive) {
      alert("You need to start the session first!");
      return;
    }

    // If an activity is already running, end it
    if (currentActivity) {
      logEvent({
        eventType: "ACTIVITY_END",
        sessionId,
        activityId: currentActivity.id,
        activityLabel: currentActivity.label,
      });
    }
    setCurrentActivity(activity);

    logEvent({
      eventType: "ACTIVITY_START",
      sessionId,
      activityId: activity.id,
      activityLabel: activity.label,
    });
  }

  return (
    <div style={styles.container}>
      <h2>TOEFL Activity Simulator</h2>

      {/* Session Controls */}
      <div style={styles.section}>
        <button onClick={handleStartSession} style={styles.btn}>
          Start Session
        </button>
        <button onClick={handleEndSession} style={styles.btn}>
          End Session
        </button>
        <p>
          <strong>Session Active:</strong> {sessionActive ? "Yes" : "No"}
          {sessionId && (
            <>
              {" "}
              (<code>{sessionId}</code>)
            </>
          )}
        </p>
      </div>

      {/* Activity Controls */}
      <div style={styles.section}>
        <h4>Available Activities</h4>
        <p style={{ fontSize: "0.9rem", marginBottom: 6 }}>
          Click an activity below to "start" it (ends the previous one if any).
        </p>
        <div style={styles.activityList}>
          {availableActivities.map((act) => (
            <button
              key={act.id}
              onClick={() => handleStartActivity(act)}
              style={styles.activityBtn}
            >
              Start {act.label}
            </button>
          ))}
        </div>

        <p>
          <strong>Current Activity:</strong>{" "}
          {currentActivity ? currentActivity.label : "(none)"}
        </p>
      </div>

      {/* Log of events */}
      <div style={styles.section}>
        <h4>Event Log</h4>
        {events.length === 0 ? (
          <p>(No events yet)</p>
        ) : (
          <table style={styles.eventTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Activity</th>
                <th>Session ID</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt, i) => (
                <tr key={i}>
                  <td>{evt.timestamp}</td>
                  <td>{evt.eventType}</td>
                  <td>
                    {evt.activityLabel
                      ? `${evt.activityLabel} (${evt.activityId})`
                      : "(none)"}
                  </td>
                  <td>{evt.sessionId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
    maxWidth: 600,
    margin: "0 auto",
    fontFamily: "Arial, sans-serif",
  },
  section: {
    marginBottom: "1.5rem",
    border: "1px solid #ccc",
    padding: "0.75rem",
    borderRadius: 4,
  },
  btn: {
    marginRight: 8,
    padding: "6px 12px",
    cursor: "pointer",
  },
  activityList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  activityBtn: {
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: 4,
    border: "1px solid #333",
    backgroundColor: "#eee",
  },
  eventTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
};