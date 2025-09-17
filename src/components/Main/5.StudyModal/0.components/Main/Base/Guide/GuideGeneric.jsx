// File: GuideGeneric.jsx
import React from "react";

export default function GuideGeneric({ examId, activity, userId }) {
  return (
    <div style={styles.container}>
      <h2>Guide: Generic</h2>
      <p style={{ marginTop: 8 }}>
        No recognized guideType was specified. This is a fallback placeholder.
      </p>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#222",
    padding: "16px",
    borderRadius: "4px",
    color: "#fff",
  },
};