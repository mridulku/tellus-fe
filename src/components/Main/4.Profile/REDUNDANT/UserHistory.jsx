// src/components/DetailedBookViewer/UserHistory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

function UserHistory({ userId, colorScheme = {} }) {
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  // Adjust or remove if you prefer a different approach
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  useEffect(() => {
    if (!userId) {
      setActivityLog([]);
      return;
    }

    const fetchActivities = async () => {
      setLoadingActivities(true);
      setError(null);
      try {
        const url = `${backendURL}/api/user-activities?userId=${userId}`;
        const response = await axios.get(url);
        if (response.data.success) {
          setActivityLog(response.data.data); // array of events
        } else {
          setError("Failed to fetch user activities.");
        }
      } catch (err) {
        console.error("Error fetching user activities:", err);
        setError(err.message);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [userId, backendURL]);

  return (
    <div
      style={{
        backgroundColor: colorScheme.cardBg || "#2F2F2F",
        borderRadius: "8px",
        padding: "20px",
        border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
      }}
    >
      <h3 style={{ marginTop: 0, color: colorScheme.textColor || "#FFFFFF" }}>
        Activity Log
      </h3>

      {loadingActivities && <p>Loading user activities...</p>}
      {error && (
        <p style={{ color: colorScheme.errorColor || "#FF5555" }}>
          Error: {error}
        </p>
      )}

      {!loadingActivities && !error && activityLog.length === 0 && (
        <p style={{ fontStyle: "italic" }}>No recent activity found.</p>
      )}

      {!loadingActivities && !error && activityLog.length > 0 && (
        <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
          {activityLog.map((item) => (
            <li key={item._id || item.id} style={logItemStyle(colorScheme)}>
              <div style={logDateStyle}>
                {item.timestamp
                  ? new Date(item.timestamp).toLocaleString()
                  : "No timestamp"}
              </div>
              <div style={logContentStyle}>
                <strong>{item.eventType}</strong>{" "}
                {item.subChapterId && (
                  <>
                    on subChapter <em>{item.subChapterId}</em>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Inline style objects for log items:
const logItemStyle = (colorScheme) => ({
  marginBottom: "15px",
  paddingLeft: "10px",
  borderLeft: `2px solid ${colorScheme.accent || "#FFD700"}`,
});

const logDateStyle = {
  fontSize: "0.85rem",
  fontStyle: "italic",
  marginBottom: "2px",
};

const logContentStyle = {
  fontSize: "0.95rem",
};

export default UserHistory;