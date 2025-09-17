// File: AdminPanel.jsx

import React from "react";
import PlanUsageHistory from "./PlanUsageHistory"; // same directory as original

export default function AdminPanel({
  db,
  plan,
  planId,
  bookId,
  userId,
  colorScheme,
}) {
  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "12px",
    fontSize: "1.2rem",
    color: colorScheme.heading || "#FFD700",
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={headingStyle}>Admin Panel</h3>
      <PlanUsageHistory
        db={db} 
        bookId={bookId}
        userId={userId}
        planId={planId}
        planData={plan}
        colorScheme={colorScheme}
      />
    </div>
  );
}