import React from "react";

export default function StageModal({ subchapter, stageName, timeline, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2>{`${subchapter.subchapterName} - ${stageName} Timeline`}</h2>

        <div style={{ marginBottom: "1rem" }}>
          {timeline.length === 0 ? (
            <p style={{ fontStyle: "italic" }}>No attempts yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {timeline.map((attempt, idx) => (
                <AttemptDetail attempt={attempt} key={idx} />
              ))}
            </div>
          )}
        </div>

        <button style={styles.closeButton} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

// You could also pull this out into another file if you want
function AttemptDetail({ attempt }) {
  const prefix = attempt.actionType === "quiz" ? "Q:" : "R:";
  let suffix = "";
  switch (attempt.result) {
    case "pass":
      suffix = " (Pass)";
      break;
    case "fail":
      suffix = " (Fail)";
      break;
    case "done":
      suffix = " (Done)";
      break;
    case "not-started":
      suffix = " (Not Started)";
      break;
    default:
      suffix = "";
  }
  const heading = `${prefix} ${attempt.label}${suffix}`;

  return (
    <div style={styles.attemptBox}>
      <strong>{heading}</strong>
      <div style={{ marginLeft: "16px" }}>
        {attempt.conceptsTested && attempt.conceptsTested.length > 0 ? (
          attempt.conceptsTested.map((c, i) => {
            let conceptResult =
              c.pass === true ? "Pass" : c.pass === false ? "Fail" : "Not Tested";
            return (
              <div key={i} style={{ marginLeft: "8px" }}>
                - {c.name} =&gt; {conceptResult}
              </div>
            );
          })
        ) : (
          <em>No concept data</em>
        )}
      </div>
    </div>
  );
}

const styles = {
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "#333",
    color: "#fff",
    padding: "1rem",
    width: "400px",
    borderRadius: "8px",
  },
  closeButton: {
    backgroundColor: "#555",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    cursor: "pointer",
    borderRadius: "4px",
  },
  attemptBox: {
    backgroundColor: "#444",
    padding: "8px",
    borderRadius: "4px",
  },
};