import React, { useState } from "react";
import { db } from "../../../../../../firebase"; // Adjust path if needed
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/** 
 * passThresholds: For each stage, how high a ratio to consider "passed."
 * We assume 1.0 means 100% correct on that concept to mark "Completed."
 */
const passThresholds = {
  remember: 1.0,
  understand: 1.0,
  apply: 1.0,
  analyze: 1.0,
};

/**
 * AdaptivePlanConceptLoader
 * -------------------------
 * This component loads:
 *  1) Chapters -> subchapters -> subchapterConcepts
 *  2) reading_demo (to mark reading status)
 *  3) quizzes_demo + quizSubmissions (to see concept-level correctness)
 *  4) revisions_demo (optional timeline data)
 *
 * Then displays a table of concept-level rows, plus *two new columns*:
 *   - Exam Score (examPresenceScore)
 *   - Guideline Score (guidelinePresenceScore)
 *
 * We also show subchapter-level totals at the bottom of each table,
 * and a global total at the very end.
 */
export default function AdaptivePlanConceptLoader() {
  // Basic user input for loading
  const [bookId, setBookId] = useState("");
  const [planId, setPlanId] = useState("");
  const [userId, setUserId] = useState("");

  // Main data structure
  const [chapters, setChapters] = useState([]);
  const [status, setStatus] = useState("");

  // ============== handleLoadData ==============
  const handleLoadData = async () => {
    try {
      setStatus("Loading data from Firestore...");
      setChapters([]);

      // 1) Load chapters_demo for (bookId, userId)
      const chaptersRef = collection(db, "chapters_demo");
      const qChapters = query(
        chaptersRef,
        where("bookId", "==", bookId),
        where("userId", "==", userId)
      );
      const chaptersSnap = await getDocs(qChapters);

      // We'll store the result in tempChapters
      const tempChapters = [];

      // For each chapter doc...
      for (const chapterDoc of chaptersSnap.docs) {
        const chapterData = chapterDoc.data();
        const chapterId = chapterDoc.id;
        const parsedChapterName = parseName(chapterData.name || "");

        // 2) For each chapter => fetch subchapters from subchapters_demo
        const subchaptersRef = collection(db, "subchapters_demo");
        const qSubs = query(subchaptersRef, where("chapterId", "==", chapterId));
        const subchaptersSnap = await getDocs(qSubs);

        // Build an array of subchapters
        const subchaptersArray = [];
        for (const subDoc of subchaptersSnap.docs) {
          const sData = subDoc.data();
          const subId = subDoc.id;
          const parsedSubName = parseName(sData.name || "");

          // 2a) For each subchapter => fetch subchapterConcepts
          const subchapterConceptsRef = collection(db, "subchapterConcepts");
          const qConcepts = query(
            subchapterConceptsRef,
            where("subChapterId", "==", subId)
          );
          const conceptSnap = await getDocs(qConcepts);
          const conceptArray = conceptSnap.docs.map((cDoc) => {
            const cData = cDoc.data();
            return {
              id: cDoc.id,
              ...cData,
            };
          });

          // Sort the concepts by some field if desired
          // conceptArray.sort((a, b) => ... ) if you want

          subchaptersArray.push({
            id: subId,
            ...sData,
            _parsedName: parsedSubName,
            concepts: conceptArray,
          });
        }

        // Sort subchapters by numeric order if you like
        subchaptersArray.sort((a, b) => a._parsedName.order - b._parsedName.order);

        tempChapters.push({
          id: chapterId,
          ...chapterData,
          _parsedName: parsedChapterName,
          subchapters: subchaptersArray,
        });
      }

      // Sort chapters
      tempChapters.sort((a, b) => a._parsedName.order - b._parsedName.order);

      // 3) reading_demo => see which subchapters user has read
      const readingRef = collection(db, "reading_demo");
      const qReading = query(
        readingRef,
        where("userId", "==", userId),
        where("planId", "==", planId)
      );
      const readingSnap = await getDocs(qReading);

      // Build a map: readingRecordsMap[subChapterId] = array of reading docs
      const readingRecordsMap = {};
      readingSnap.forEach((docSnap) => {
        const rd = docSnap.data();
        const scId = rd.subChapterId;
        if (!readingRecordsMap[scId]) {
          readingRecordsMap[scId] = [];
        }
        readingRecordsMap[scId].push({ id: docSnap.id, ...rd });
      });

      // 4) quizzes_demo => quizMap[subChapterId][stage] = array of quiz attempt docs
      const quizRef = collection(db, "quizzes_demo");
      const qQuiz = query(
        quizRef,
        where("userId", "==", userId),
        where("planId", "==", planId)
      );
      const quizSnap = await getDocs(qQuiz);

      const quizMap = {};
      quizSnap.forEach((docSnap) => {
        const qData = docSnap.data();
        const scId = qData.subchapterId;
        const stg = qData.quizType; // "remember","understand","apply","analyze"
        if (!quizMap[scId]) {
          quizMap[scId] = {};
        }
        if (!quizMap[scId][stg]) {
          quizMap[scId][stg] = [];
        }
        quizMap[scId][stg].push({ id: docSnap.id, ...qData });
      });

      // Sort quiz attempts by descending attemptNumber
      for (const scId of Object.keys(quizMap)) {
        for (const stage of Object.keys(quizMap[scId])) {
          quizMap[scId][stage].sort((a, b) => b.attemptNumber - a.attemptNumber);
        }
      }

      // 5) revisions_demo => if you want timelines
      const revisionRef = collection(db, "revisions_demo");
      const qRevision = query(
        revisionRef,
        where("userId", "==", userId),
        where("planId", "==", planId)
      );
      const revisionSnap = await getDocs(qRevision);

      const revisionMap = {};
      revisionSnap.forEach((docSnap) => {
        const rData = docSnap.data();
        const scId = rData.subchapterId;
        const stg = rData.revisionType;
        if (!revisionMap[scId]) {
          revisionMap[scId] = {};
        }
        if (!revisionMap[scId][stg]) {
          revisionMap[scId][stg] = [];
        }
        revisionMap[scId][stg].push({ id: docSnap.id, ...rData });
      });

      // 6) Combine data => for each subchapter + concept
      tempChapters.forEach((ch) => {
        ch.subchapters.forEach((sub) => {
          // reading => is subchapter read?
          const readArr = readingRecordsMap[sub.id] || [];
          sub.readingRecords = readArr;
          // If there's at least one reading doc, we call subchapter "read"
          sub.isRead = readArr.length > 0;

          // We'll build stage-based quizRecords for the *subchapter*, 
          // but we need to do concept-level checks
          sub.quizRecords = {};
          sub.revisionRecords = {};
          ["remember", "understand", "apply", "analyze"].forEach((stage) => {
            sub.quizRecords[stage] = quizMap[sub.id]?.[stage] || [];
            sub.revisionRecords[stage] = revisionMap[sub.id]?.[stage] || [];
          });

          // Now let's annotate each concept with concept-level stage statuses
          sub.concepts.forEach((conceptObj) => {
            conceptObj.stageStatus = {};

            // Mark reading based on subchapter reading
            conceptObj.isRead = sub.isRead;

            // For each stage => figure out if concept is Not Started, WIP, or Completed
            ["remember", "understand", "apply", "analyze"].forEach((stage) => {
              conceptObj.stageStatus[stage] = computeConceptStageStatus(
                sub.quizRecords[stage],
                conceptObj.name,  
                stage
              );
            });

            // OPTIONAL: if conceptObj has examPresenceScore or guidelinePresenceScore,
            // let's ensure we have numeric defaults
            conceptObj.examPresenceScore = conceptObj.examPresenceScore || 0;
            conceptObj.guidelinePresenceScore = conceptObj.guidelinePresenceScore || 0;
          });
        });
      });

      setChapters(tempChapters);
      setStatus("Data loaded successfully!");
    } catch (err) {
      console.error("Error loading data", err);
      setStatus(`Error: ${err.message}`);
    }
  };

  // We also want a global total across all chapters
  // We'll compute it once in render. If you want it dynamic, you can store in state.
  const { globalExamScore, globalGuidelineScore } = computeGlobalScores(chapters);

  return (
    <div style={styles.container}>
      <h1>Adaptive Plan Concept Loader</h1>
      <p style={{ marginBottom: "0.5rem" }}>
        Enter Book ID, Plan ID, User ID, then click <b>Load Data</b>.
        This will display a <em>concept-level</em> breakdown for each subchapter,
        plus "Exam Score" and "Guideline Score" columns.
      </p>

      <div style={styles.inputRow}>
        <label>Book ID: </label>
        <input
          type="text"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.inputRow}>
        <label>Plan ID: </label>
        <input
          type="text"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          style={styles.input}
        />
      </div>
      <div style={styles.inputRow}>
        <label>User ID: </label>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={styles.input}
        />
      </div>

      <button onClick={handleLoadData} style={styles.loadButton}>
        Load Data
      </button>

      {status && <div style={styles.statusBox}>{status}</div>}

      {/* Now render each chapter */}
      {chapters.map((chapter) => (
        <ChapterSection key={chapter.id} chapter={chapter} />
      ))}

      {/* Finally, show global totals across all chapters */}
      {chapters.length > 0 && (
        <div style={{ marginTop: "1rem", backgroundColor: "#333", padding: "0.5rem" }}>
          <h2>Global Totals</h2>
          <p>
            <b>Total Exam Score:</b> {globalExamScore.toFixed(2)}
          </p>
          <p>
            <b>Total Guideline Score:</b> {globalGuidelineScore.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * computeGlobalScores
 *  - Summation of examPresenceScore and guidelinePresenceScore across ALL concepts
 */
function computeGlobalScores(chapters) {
  let globalExamScore = 0;
  let globalGuidelineScore = 0;

  chapters.forEach((ch) => {
    ch.subchapters.forEach((sub) => {
      sub.concepts.forEach((c) => {
        globalExamScore += c.examPresenceScore || 0;
        globalGuidelineScore += c.guidelinePresenceScore || 0;
      });
    });
  });

  return { globalExamScore, globalGuidelineScore };
}

function ChapterSection({ chapter }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={styles.chapterContainer}>
      <div style={styles.chapterHeader} onClick={() => setExpanded(!expanded)}>
        <h2 style={{ margin: 0 }}>
          {expanded ? "▼" : "▶"} {chapter._parsedName.label}
        </h2>
      </div>
      {expanded && (
        <div>
          {chapter.subchapters.map((sub) => (
            <SubchapterBlock key={sub.id} subchapter={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubchapterBlock({ subchapter }) {
  const [expanded, setExpanded] = useState(true);

  // compute subchapter-level totals (exam/guideline) for all concepts
  const { subExamTotal, subGuidelineTotal } = computeSubchapterTotals(subchapter.concepts);

  return (
    <div style={styles.subchapterContainer}>
      <div
        style={styles.subchapterHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <h3 style={{ margin: 0 }}>
          {expanded ? "▼" : "▶"} {subchapter._parsedName.label}
        </h3>
      </div>
      {expanded && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Concept</th>
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Remember</th>
                <th style={styles.th}>Understand</th>
                <th style={styles.th}>Apply</th>
                <th style={styles.th}>Analyze</th>

                {/* NEW columns */}
                <th style={styles.th}>Exam Score</th>
                <th style={styles.th}>Guideline Score</th>
              </tr>
            </thead>
            <tbody>
              {subchapter.concepts.map((conceptObj) => (
                <ConceptRow
                  key={conceptObj.id}
                  concept={conceptObj}
                  subchapter={subchapter}
                />
              ))}

              {/* Subchapter-level totals row */}
              <tr>
                <td colSpan={6} style={styles.subchapterTotalCell}>
                  <b>Subchapter Totals:</b>
                </td>
                <td style={styles.td}>
                  <b>{subExamTotal.toFixed(2)}</b>
                </td>
                <td style={styles.td}>
                  <b>{subGuidelineTotal.toFixed(2)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * computeSubchapterTotals => sum exam/guideline scores across subchapter's concepts
 */
function computeSubchapterTotals(concepts) {
  let subExamTotal = 0;
  let subGuidelineTotal = 0;
  concepts.forEach((c) => {
    subExamTotal += c.examPresenceScore || 0;
    subGuidelineTotal += c.guidelinePresenceScore || 0;
  });
  return { subExamTotal, subGuidelineTotal };
}

function ConceptRow({ concept, subchapter }) {
  // "concept" has fields like { name, examPresenceScore, guidelinePresenceScore, stageStatus, isRead, ... }
  return (
    <tr>
      <td style={styles.subchapterTd}>{concept.name || concept.id}</td>
      <td style={styles.td}>
        {concept.isRead ? (
          <div style={styles.readIndicator}>Read</div>
        ) : (
          <div style={styles.notReadIndicator}>Not Read</div>
        )}
      </td>
      {/* 4 stages */}
      <td style={styles.td}>
        {renderConceptStageCell(concept.stageStatus.remember, subchapter, concept, "remember")}
      </td>
      <td style={styles.td}>
        {renderConceptStageCell(concept.stageStatus.understand, subchapter, concept, "understand")}
      </td>
      <td style={styles.td}>
        {renderConceptStageCell(concept.stageStatus.apply, subchapter, concept, "apply")}
      </td>
      <td style={styles.td}>
        {renderConceptStageCell(concept.stageStatus.analyze, subchapter, concept, "analyze")}
      </td>

      {/* NEW columns: Exam Score, Guideline Score */}
      <td style={styles.td}>{(concept.examPresenceScore || 0).toFixed(2)}</td>
      <td style={styles.td}>{(concept.guidelinePresenceScore || 0).toFixed(2)}</td>
    </tr>
  );
}

/**
 * renderConceptStageCell
 *  - "Not Started" / "WIP" / "Completed"
 *  - Possibly an info button for timeline
 */
function renderConceptStageCell(status, sub, concept, stage) {
  if (status === "Not Started") {
    return <div style={styles.notReadIndicator}>Not Started</div>;
  }
  if (status === "Work in Progress") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div style={styles.workInProgressIndicator}>WIP</div>
        <ConceptInfoPopover type="stage" sub={sub} conceptName={concept.name} stage={stage} />
      </div>
    );
  }
  // "Completed"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={styles.readIndicator}>Completed</div>
      <ConceptInfoPopover type="stage" sub={sub} conceptName={concept.name} stage={stage} />
    </div>
  );
}

/**
 * ConceptInfoPopover => for showing timeline details if user clicks "i"
 */
function ConceptInfoPopover({ type, sub, conceptName, stage }) {
  const [show, setShow] = useState(false);

  const toggleShow = (e) => {
    e.stopPropagation();
    setShow(!show);
  };

  return (
    <div style={styles.infoPopoverContainer}>
      <div style={styles.infoButton} onClick={toggleShow}>
        i
      </div>
      {show && (
        <div style={styles.infoOverlay} onClick={(e) => e.stopPropagation()}>
          {type === "stage" && renderConceptTimeline(sub.quizRecords[stage], sub.revisionRecords[stage], conceptName, stage)}
        </div>
      )}
    </div>
  );
}

/**
 * renderConceptTimeline => build timeline specifically for this concept, filtering quizSubmission
 */
function renderConceptTimeline(quizArr, revArr, conceptName, stage) {
  if (!quizArr || !quizArr.length) {
    return <div>No quiz attempts yet for stage: {stage}</div>;
  }
  // Ascending attemptNumber
  const ascQuizzes = [...quizArr].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const timelineItems = [];

  ascQuizzes.forEach((quizDoc) => {
    const submissionArray = quizDoc.quizSubmission || [];
    const conceptItem = submissionArray.find(
      (qItem) => (qItem.conceptName || "").toLowerCase() === conceptName.toLowerCase()
    );
    if (conceptItem) {
      const passed = parseFloat(conceptItem.score) >= 1.0;
      timelineItems.push({
        type: "quiz",
        attemptNumber: quizDoc.attemptNumber,
        passed,
        score: conceptItem.score,
        timestamp: quizDoc.timestamp,
      });
      // see if there's a matching revision
      const matchingRev = (revArr || []).find((r) => r.revisionNumber === quizDoc.attemptNumber);
      if (matchingRev) {
        timelineItems.push({
          type: "revision",
          attemptNumber: matchingRev.revisionNumber,
          timestamp: matchingRev.timestamp,
        });
      }
    }
  });

  if (!timelineItems.length) {
    return (
      <div>
        This concept (<b>{conceptName}</b>) wasn't tested in the quiz attempts for stage: {stage}
      </div>
    );
  }

  return (
    <div>
      <h4>Concept Timeline: {conceptName} / {stage}</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {timelineItems.map((item, i) => (
          <TimelineBox item={item} key={i} />
        ))}
      </div>
    </div>
  );
}

function TimelineBox({ item }) {
  const { type, attemptNumber, passed, score, timestamp } = item;
  let label = "";
  let bgColor = "#888";

  if (type === "quiz") {
    label = `Q${attemptNumber} (${score})`;
    bgColor = passed ? "#2ecc71" : "#e74c3c";
  } else if (type === "revision") {
    label = `R${attemptNumber}`;
    bgColor = "#3498db";
  }

  let timeString = "";
  if (timestamp?.seconds) {
    const d = new Date(timestamp.seconds * 1000);
    timeString = d.toLocaleString();
  }

  return (
    <div style={{ ...styles.timelineBox, backgroundColor: bgColor }}>
      <div>{label}</div>
      {timeString && <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>{timeString}</div>}
    </div>
  );
}

/**
 * computeConceptStageStatus
 * -------------------------
 * For a given stage's quizAttempts array, see if conceptName was tested:
 *  - If never tested => "Not Started"
 *  - If tested & correct at least once => "Completed"
 *  - Else => "Work in Progress"
 */
function computeConceptStageStatus(quizAttempts, conceptName, stage) {
  if (!quizAttempts || !quizAttempts.length) {
    return "Not Started";
  }

  let foundAny = false;
  let foundCorrect = false;

  quizAttempts.forEach((attempt) => {
    const submissionArray = attempt.quizSubmission || [];
    submissionArray.forEach((qItem) => {
      if ((qItem.conceptName || "").toLowerCase() === conceptName.toLowerCase()) {
        foundAny = true;
        if (parseFloat(qItem.score) >= 1.0) {
          foundCorrect = true;
        }
      }
    });
  });

  if (!foundAny) return "Not Started";
  if (foundCorrect) return "Completed";
  return "Work in Progress";
}

/**
 * parseName => "1. Chapter Title" => { order: 1, label: "1. Chapter Title" }
 */
function parseName(name = "") {
  const pattern = /^(\d+)\.\s*(.*)$/;
  const match = name.trim().match(pattern);
  if (match) {
    return {
      order: parseInt(match[1], 10),
      label: name,
    };
  } else {
    return { order: 9999, label: name };
  }
}

// ============== Styles ==============
const styles = {
  container: {
    padding: "1rem",
    backgroundColor: "#222",
    color: "#fff",
    fontFamily: "sans-serif",
    minHeight: "100vh",
  },
  inputRow: {
    marginBottom: "0.5rem",
  },
  input: {
    marginLeft: "0.5rem",
    padding: "4px",
    width: "250px",
  },
  loadButton: {
    marginTop: "0.5rem",
    padding: "6px 12px",
    cursor: "pointer",
  },
  statusBox: {
    marginTop: "1rem",
    marginBottom: "1rem",
    backgroundColor: "#333",
    padding: "8px",
    borderRadius: "4px",
  },

  // Chapter
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

  // Subchapter
  subchapterContainer: {
    margin: "0.5rem 1rem",
    border: "1px solid #444",
    borderRadius: "4px",
    backgroundColor: "#2b2b2b",
  },
  subchapterHeader: {
    display: "flex",
    justifyContent: "space-between",
    cursor: "pointer",
    padding: "0.4rem 1rem",
    backgroundColor: "#3c3c3c",
  },
  tableWrapper: {
    overflowX: "auto",
    padding: "0.5rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  th: {
    border: "1px solid #666",
    padding: "8px",
    backgroundColor: "#555",
    textAlign: "left",
  },
  td: {
    border: "1px solid #666",
    padding: "8px",
    verticalAlign: "top",
    backgroundColor: "#222",
    textAlign: "center",
  },
  subchapterTd: {
    border: "1px solid #666",
    padding: "8px",
    verticalAlign: "top",
    backgroundColor: "#111",
    textAlign: "left",
  },
  subchapterTotalCell: {
    border: "1px solid #666",
    padding: "8px",
    backgroundColor: "#111",
    textAlign: "right",
  },

  // Indicators
  readIndicator: {
    color: "lightgreen",
    fontWeight: "bold",
  },
  notReadIndicator: {
    color: "red",
    fontWeight: "bold",
  },
  workInProgressIndicator: {
    color: "yellow",
    fontWeight: "bold",
  },

  // Info popover
  infoPopoverContainer: {
    position: "relative",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  infoButton: {
    backgroundColor: "#666",
    color: "#fff",
    borderRadius: "50%",
    width: "16px",
    height: "16px",
    fontSize: "0.7rem",
    textAlign: "center",
    lineHeight: "16px",
  },
  infoOverlay: {
    position: "absolute",
    top: "20px",
    left: 0,
    backgroundColor: "#333",
    border: "1px solid #555",
    borderRadius: "4px",
    padding: "8px",
    zIndex: 9999,
    minWidth: "200px",
  },

  // Timeline
  timelineBox: {
    minWidth: "60px",
    padding: "6px",
    borderRadius: "4px",
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
};