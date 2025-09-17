// CumulativeRevision.jsx
import React from "react";

export default function CumulativeRevision({ examId, activity, userId }) {
  return (
    <div style={{ color: "#fff" }}>
      <h2>Cumulative Revision (Dummy)</h2>
      <p>Exam ID: {examId}</p>
      <pre>{JSON.stringify(activity, null, 2)}</pre>
      <p>User ID: {userId}</p>
    </div>
  );
}