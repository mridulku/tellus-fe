import React, { useState } from "react";
import StageModal from "./StageModal";

/**
 * The plan data has:
 *   bookName
 *   chapters => each chapter => subchapters => readingStatus + timeline arrays for Understand/Analyze/Apply
 *     timeline item => { actionType: 'quiz'|'revision', label:'Quiz 1', result:'pass'|'fail'|'done'|'not-started', conceptsTested:[ {name:'Concept A', pass:true|false|null}, ...] }
 */

const mockPlanData = {
  bookName: "TOEFL Masterbook with Modal View",
  chapters: [
    {
      chapterName: "Chapter 1",
      subchapters: [
        {
          subchapterName: "Subchapter 1.1",
          readingStatus: "Done",
          understandTimeline: [
            {
              actionType: "quiz",
              label: "Quiz 1",
              result: "fail",
              conceptsTested: [
                { name: "Concept A", pass: true },
                { name: "Concept B", pass: false },
              ],
            },
            {
              actionType: "revision",
              label: "Revision 1",
              result: "done",
              conceptsTested: [{ name: "Concept B", pass: true }],
            },
            {
              actionType: "quiz",
              label: "Quiz 2",
              result: "pass",
              conceptsTested: [{ name: "Concept B", pass: true }],
            },
          ],
          analyzeTimeline: [
            {
              actionType: "quiz",
              label: "Quiz 1",
              result: "pass",
              conceptsTested: [
                { name: "Concept X", pass: true },
                { name: "Concept Y", pass: true },
              ],
            },
          ],
          applyTimeline: [],
        },
        {
          subchapterName: "Subchapter 1.2",
          readingStatus: "In Progress",
          understandTimeline: [
            {
              actionType: "quiz",
              label: "Quiz 1",
              result: "fail",
              conceptsTested: [
                { name: "Concept A", pass: false },
                { name: "Concept B", pass: false },
              ],
            },
          ],
          analyzeTimeline: [],
          applyTimeline: [],
        },
      ],
    },
    {
      chapterName: "Chapter 2",
      subchapters: [
        {
          subchapterName: "Subchapter 2.1",
          readingStatus: "Not Started",
          understandTimeline: [],
          analyzeTimeline: [],
          applyTimeline: [],
        },
        {
          subchapterName: "Subchapter 2.2",
          readingStatus: "Done",
          understandTimeline: [
            {
              actionType: "quiz",
              label: "Quiz 1",
              result: "pass",
              conceptsTested: [
                { name: "Concept AAA", pass: true },
                { name: "Concept BBB", pass: true },
              ],
            },
          ],
          analyzeTimeline: [
            {
              actionType: "quiz",
              label: "Quiz 1",
              result: "fail",
              conceptsTested: [{ name: "Concept B", pass: false }],
            },
          ],
          applyTimeline: [
            {
              actionType: "quiz",
              label: "Quiz 1",
              result: "not-started",
              conceptsTested: [],
            },
          ],
        },
      ],
    },
  ],
};

export default function Child3() {
  const [planData] = useState(mockPlanData);

  // For the modal:
  //  - selectedSubchapter => which subchap
  //  - selectedStage => "Understand" | "Analyze" | "Apply"
  //  - timeline => the array of attempts for that stage
  const [modalInfo, setModalInfo] = useState(null);

  const closeModal = () => setModalInfo(null);

  return (
    <div style={styles.container}>
      <h1>Book: {planData.bookName}</h1>

      {planData.chapters.map((chapter, cIdx) => (
        <ChapterSection
          key={cIdx}
          chapter={chapter}
          onOpenStageModal={(subchapter, stageName, timeline) => {
            // store in local state => show modal
            setModalInfo({ subchapter, stageName, timeline });
          }}
        />
      ))}

      {/* Conditionally show the modal (pulled out into its own component file) */}
      {modalInfo && (
        <StageModal
          subchapter={modalInfo.subchapter}
          stageName={modalInfo.stageName}
          timeline={modalInfo.timeline}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/**
 * Collapsible chapter => table of subchapters
 */
function ChapterSection({ chapter, onOpenStageModal }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={styles.chapterContainer}>
      <div style={styles.chapterHeader} onClick={() => setExpanded(!expanded)}>
        <h2 style={{ margin: 0 }}>
          {expanded ? "▼" : "▶"} {chapter.chapterName}
        </h2>
      </div>
      {expanded && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Subchapter</th>
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Understand</th>
                <th style={styles.th}>Analyze</th>
                <th style={styles.th}>Apply</th>
              </tr>
            </thead>
            <tbody>
              {chapter.subchapters.map((sub, sIdx) => (
                <tr key={sIdx}>
                  <td style={styles.subchapterTd}>{sub.subchapterName}</td>
                  <td style={styles.readingTd}>
                    {renderReadingCell(sub.readingStatus)}
                  </td>
                  <td style={styles.td}>
                    {renderStageCell("Understand", sub, onOpenStageModal)}
                  </td>
                  <td style={styles.td}>
                    {renderStageCell("Analyze", sub, onOpenStageModal)}
                  </td>
                  <td style={styles.td}>
                    {renderStageCell("Apply", sub, onOpenStageModal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// --------------------------------------
// Stage logic => lock / pass / or "View" button
// --------------------------------------
function renderStageCell(stageName, sub, onOpenStageModal) {
  // locked?
  const locked = isStageLocked(stageName, sub);
  if (locked) return <LockedStage />;

  // otherwise => is pass or in progress or no attempts?
  const timeline = getTimeline(stageName, sub);
  const hasPass = timeline.some((t) => t.result === "pass");

  if (hasPass) {
    return (
      <div style={styles.passBox}>
        <span style={{ marginRight: "6px" }}>✓</span>
        <span>Completed</span>
        <button
          style={styles.viewButton}
          onClick={() => onOpenStageModal(sub, stageName, timeline)}
        >
          View
        </button>
      </div>
    );
  } else {
    // no pass => either "No Activity" or "In progress"
    if (!timeline.length) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "6px",
            alignItems: "center",
          }}
        >
          <div style={{ fontStyle: "italic", color: "#aaa" }}>No Activity</div>
          <button
            style={styles.viewButton}
            onClick={() => onOpenStageModal(sub, stageName, timeline)}
          >
            Start
          </button>
        </div>
      );
    } else {
      // we have attempts but no pass => "In progress"
      return (
        <div style={styles.inProgressBox}>
          In Progress
          <button
            style={styles.viewButton}
            onClick={() => onOpenStageModal(sub, stageName, timeline)}
          >
            View
          </button>
        </div>
      );
    }
  }
}

/** 
 * Return timeline array for that stage
 */
function getTimeline(stageName, sub) {
  switch (stageName) {
    case "Understand":
      return sub.understandTimeline || [];
    case "Analyze":
      return sub.analyzeTimeline || [];
    case "Apply":
      return sub.applyTimeline || [];
    default:
      return [];
  }
}

/** 
 * If stageName='Understand', locked if reading != 'Done'
 * If stageName='Analyze', locked if no pass in Understand
 * If stageName='Apply', locked if no pass in Analyze
 */
function isStageLocked(stageName, sub) {
  switch (stageName) {
    case "Understand":
      return sub.readingStatus !== "Done";
    case "Analyze":
      return !hasPass(sub.understandTimeline);
    case "Apply":
      return !hasPass(sub.analyzeTimeline);
    default:
      return false;
  }
}

/** 
 * hasPass => checks if timeline has item.result==='pass'
 */
function hasPass(timelineItems = []) {
  return timelineItems.some((item) => item.result === "pass");
}

// --------------------------------------
// Reading cell
// --------------------------------------
function renderReadingCell(status) {
  switch (status) {
    case "Done":
      return <div style={styles.doneBox}>Done</div>;
    case "In Progress":
      return <div style={styles.inProgressBox}>In Progress</div>;
    case "Not Started":
      return <div style={styles.notStartedBox}>Not Started</div>;
    default:
      return <div style={styles.unknownBox}>{status}</div>;
  }
}

/** A locked stage icon */
function LockedStage() {
  return (
    <div style={styles.lockedBox}>
      <span role="img" aria-label="lock">
        🔒
      </span>{" "}
      Locked
    </div>
  );
}

// ===========================
//  Styles
// ===========================
const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#222",
    color: "#fff",
    fontFamily: "sans-serif",
    minHeight: "100vh",
  },
  chapterContainer: {
    marginBottom: "1rem",
    border: "1px solid #444",
    borderRadius: "6px",
    backgroundColor: "#333",
  },
  chapterHeader: {
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    padding: "0.5rem 1rem",
    backgroundColor: "#444",
  },
  tableWrapper: {
    overflowX: "auto",
    padding: "0.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },
  th: {
    border: "1px solid #666",
    padding: "8px",
    backgroundColor: "#555",
    textAlign: "left",
  },
  subchapterTd: {
    border: "1px solid #666",
    padding: "8px",
    verticalAlign: "top",
    backgroundColor: "#222",
  },
  readingTd: {
    border: "1px solid #666",
    padding: "8px",
    verticalAlign: "top",
    backgroundColor: "#222",
  },
  td: {
    border: "1px solid #666",
    padding: "8px",
    verticalAlign: "top",
  },

  lockedBox: {
    backgroundColor: "#777",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-flex",
    gap: "4px",
  },
  passBox: {
    backgroundColor: "#2ecc71",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-flex",
    gap: "6px",
    alignItems: "center",
  },
  inProgressBox: {
    backgroundColor: "#f1c40f",
    color: "#000",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-flex",
    gap: "6px",
    alignItems: "center",
  },
  notStartedBox: {
    backgroundColor: "#999",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    textAlign: "center",
  },
  unknownBox: {
    backgroundColor: "#444",
    color: "#fff",
    padding: "4px",
    borderRadius: "4px",
  },

  viewButton: {
    backgroundColor: "#444",
    color: "#fff",
    border: "1px solid #777",
    marginLeft: "8px",
    padding: "4px 8px",
    cursor: "pointer",
    borderRadius: "4px",
  },
};