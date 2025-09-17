import React, { useState } from "react";
import { db } from "../../../../../../firebase"; // Adjust path if needed
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Each stage requires 100% correct to pass
const passThresholds = {
  remember: 1.0,
  understand: 1.0,
  apply: 1.0,
  analyze: 1.0,
};

export default function AdaptivePlanLoader() {
  const [bookId, setBookId] = useState("");
  const [planId, setPlanId] = useState("");
  const [userId, setUserId] = useState("");

  const [chapters, setChapters] = useState([]);
  const [status, setStatus] = useState("");

  // ============== handleLoadData ==============
  const handleLoadData = async () => {
    try {
      setStatus("Loading data from Firestore...");
      setChapters([]);

      // 1) Load chapters_demo
      const chaptersRef = collection(db, "chapters_demo");
      const qChapters = query(
        chaptersRef,
        where("bookId", "==", bookId),
        where("userId", "==", userId)
      );
      const chaptersSnap = await getDocs(qChapters);

      const tempChapters = [];

      for (const chapterDoc of chaptersSnap.docs) {
        const chapterData = chapterDoc.data();
        const chapterId = chapterDoc.id;
        const parsedChapterName = parseName(chapterData.name || "");

        // 2) For each chapter => subchapters_demo
        const subchaptersRef = collection(db, "subchapters_demo");
        const qSubs = query(subchaptersRef, where("chapterId", "==", chapterId));
        const subchaptersSnap = await getDocs(qSubs);

        const subchaptersArray = subchaptersSnap.docs.map((subDoc) => {
          const sData = subDoc.data();
          const parsedSubName = parseName(sData.name || "");
          return {
            id: subDoc.id,
            ...sData,
            _parsedName: parsedSubName,
          };
        });

        // Sort subchapters
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
      const qReading = query(readingRef,
        where("userId", "==", userId),
        where("planId", "==", planId)
      );
      const readingSnap = await getDocs(qReading);

      // readingRecordsMap[subChapterId] = array of reading docs
      const readingRecordsMap = {};
      readingSnap.forEach((docSnap) => {
        const rd = docSnap.data();
        const scId = rd.subChapterId;

        if (!readingRecordsMap[scId]) {
          readingRecordsMap[scId] = [];
        }
        readingRecordsMap[scId].push({
          id: docSnap.id,
          ...rd,
        });
      });

      // 4) quizzes_demo => quizMap[subChapterId][stage] = [quiz attempts...]
      const quizRef = collection(db, "quizzes_demo");
      const qQuiz = query(quizRef,
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

      // Sort each stage by descending attemptNumber
      for (const scId of Object.keys(quizMap)) {
        for (const stage of Object.keys(quizMap[scId])) {
          quizMap[scId][stage].sort((a, b) => b.attemptNumber - a.attemptNumber);
        }
      }

      // 5) revisions_demo => revisionMap[subChapterId][stage] = [revisions...]
      const revisionRef = collection(db, "revisions_demo");
      const qRevision = query(revisionRef,
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

      // 6) Combine all => mark isRead, stageStatus. Also attach readingRecords, quizRecords, revisionRecords so we can show them
      tempChapters.forEach((ch) => {
        ch.subchapters.forEach((sub) => {
          // reading
          const readArr = readingRecordsMap[sub.id] || [];
          sub.readingRecords = readArr;
          sub.isRead = readArr.length > 0; // if we have at least one reading doc

          // For each stage => compute "Not Started", "Work in Progress", "Completed"
          sub.stageStatus = {};
          sub.quizRecords = {};
          sub.revisionRecords = {};

          ["remember", "understand", "apply", "analyze"].forEach((stage) => {
            const qArr = quizMap[sub.id]?.[stage] || [];
            const rArr = revisionMap[sub.id]?.[stage] || [];

            // store them so we can build timeline
            sub.quizRecords[stage] = qArr;
            sub.revisionRecords[stage] = rArr;

            sub.stageStatus[stage] = computeStageStatus(qArr, rArr, stage);
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

  return (
    <div style={styles.container}>
      <h1>Adaptive Plan Loader (Demo)</h1>

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
        <small style={{ marginLeft: 8 }}>
          (Used to check reading_demo, quizzes_demo, revisions_demo)
        </small>
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

      {chapters.map((chapter) => (
        <ChapterSection key={chapter.id} chapter={chapter} />
      ))}
    </div>
  );
}

/** 
 * computeStageStatus
 *  - If no quiz attempts => "Not Started"
 *  - Else check the *latest* quiz attempt. If pass => "Completed", else "Work in Progress"
 */
function computeStageStatus(quizArr, revArr, stage) {
  if (!quizArr.length) {
    return "Not Started";
  }
  const [latestQuiz] = quizArr; // sorted desc
  const ratio = parseScoreForRatio(latestQuiz.score);
  const passNeeded = passThresholds[stage] ?? 1.0;
  if (ratio >= passNeeded) return "Completed";
  return "Work in Progress";
}

function parseScoreForRatio(scoreString) {
  if (!scoreString) return 0;
  const trimmed = scoreString.trim();
  if (trimmed.endsWith("%")) {
    const numPart = trimmed.slice(0, -1);
    const parsed = parseFloat(numPart);
    return !isNaN(parsed) ? parsed / 100 : 0;
  }
  if (trimmed.includes("/")) {
    const [numStr, denomStr] = trimmed.split("/");
    const numericScore = parseFloat(numStr);
    const outOf = parseFloat(denomStr);
    if (!isNaN(numericScore) && !isNaN(outOf) && outOf > 0) {
      return numericScore / outOf;
    }
  }
  return 0;
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

/**
 * ChapterSection
 *  - Renders each chapter and a table of subchapters
 *  - For reading => "Read" or "Not Read" + info button if read
 *  - For each stage => "Not Started"/"WIP"/"Completed" + info button if WIP/Completed
 */
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
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Subchapter</th>
                <th style={styles.th}>Reading</th>
                <th style={styles.th}>Remember</th>
                <th style={styles.th}>Understand</th>
                <th style={styles.th}>Apply</th>
                <th style={styles.th}>Analyze</th>
              </tr>
            </thead>
            <tbody>
              {chapter.subchapters.map((sub) => (
                <tr key={sub.id}>
                  <td style={styles.subchapterTd}>{sub._parsedName.label}</td>
                  {/* Reading Column */}
                  <td style={styles.td}>
                    {sub.isRead ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <div style={styles.readIndicator}>Read</div>
                        {/* "i" button -> shows reading data */}
                        <InfoPopover type="reading" sub={sub} />
                      </div>
                    ) : (
                      <div style={styles.notReadIndicator}>Not Read</div>
                    )}
                  </td>
                  {/* 4 Stage Columns */}
                  <td style={styles.td}>
                    {renderStageCell(sub.stageStatus.remember, sub, "remember")}
                  </td>
                  <td style={styles.td}>
                    {renderStageCell(sub.stageStatus.understand, sub, "understand")}
                  </td>
                  <td style={styles.td}>
                    {renderStageCell(sub.stageStatus.apply, sub, "apply")}
                  </td>
                  <td style={styles.td}>
                    {renderStageCell(sub.stageStatus.analyze, sub, "analyze")}
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

/**
 * renderStageCell
 *  - Renders "Not Started"/"WIP"/"Completed"
 *  - If WIP or Completed, shows an "i" button that can display a timeline
 */
function renderStageCell(status, sub, stage) {
  if (status === "Not Started") {
    return <div style={styles.notReadIndicator}>Not Started</div>;
  }
  if (status === "Work in Progress") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div style={styles.workInProgressIndicator}>WIP</div>
        <InfoPopover type="stage" sub={sub} stage={stage} />
      </div>
    );
  }
  // "Completed"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <div style={styles.readIndicator}>Completed</div>
      <InfoPopover type="stage" sub={sub} stage={stage} />
    </div>
  );
}

/**
 * InfoPopover
 *  - Renders a small "i" button; on click, toggles an overlay with either:
 *    - Reading info (start/end times) if type="reading"
 *    - Timeline of quiz & revision attempts if type="stage"
 */
function InfoPopover({ type, sub, stage }) {
  const [show, setShow] = useState(false);

  const toggleShow = (e) => {
    e.stopPropagation();
    setShow(!show);
  };

  // We'll display either reading info or stage timeline
  return (
    <div style={styles.infoPopoverContainer}>
      <div style={styles.infoButton} onClick={toggleShow}>
        i
      </div>
      {show && (
        <div style={styles.infoOverlay} onClick={(e) => e.stopPropagation()}>
          {type === "reading" && renderReadingDetails(sub.readingRecords)}
          {type === "stage" && renderStageTimeline(sub.quizRecords[stage], sub.revisionRecords[stage], stage)}
        </div>
      )}
    </div>
  );
}

/**
 * renderReadingDetails
 *  - Show a simple list of reading docs (start, end, totalTime if wanted)
 */
function renderReadingDetails(readingRecords) {
  if (!readingRecords || !readingRecords.length) {
    return <div>No reading data found.</div>;
  }
  return (
    <div>
      <h4>Reading Records</h4>
      {readingRecords.map((rd, idx) => {
        const startTs = rd.readingStartTime?.seconds
          ? new Date(rd.readingStartTime.seconds * 1000)
          : null;
        const endTs = rd.readingEndTime?.seconds
          ? new Date(rd.readingEndTime.seconds * 1000)
          : null;

        return (
          <div key={idx} style={{ marginBottom: "0.5rem" }}>
            <div>Doc ID: {rd.id}</div>
            <div>
              Start: {startTs ? startTs.toLocaleString() : "N/A"}
            </div>
            <div>
              End: {endTs ? endTs.toLocaleString() : "N/A"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * renderStageTimeline
 *  - We build a timeline that merges quiz attempts + revision attempts in ascending attemptNumber
 */
function renderStageTimeline(quizArr, revArr, stage) {
  if (!quizArr || !quizArr.length) {
    return <div>No quiz attempts yet for stage: {stage}</div>;
  }

  // We have quizArr sorted DESC. Let's sort ascending for timeline
  const ascQuizzes = [...quizArr].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const timelineItems = [];

  // We'll assume pass threshold is 1.0 from passThresholds
  const passRatio = passThresholds[stage] || 1.0;

  ascQuizzes.forEach((quizDoc) => {
    const ratio = parseScoreForRatio(quizDoc.score);
    const passed = ratio >= passRatio;
    timelineItems.push({
      type: "quiz",
      attemptNumber: quizDoc.attemptNumber,
      passed,
      score: quizDoc.score,
      timestamp: quizDoc.timestamp,
    });
    const matchingRev = revArr.find((r) => r.revisionNumber === quizDoc.attemptNumber);
    if (matchingRev) {
      timelineItems.push({
        type: "revision",
        attemptNumber: matchingRev.revisionNumber,
        timestamp: matchingRev.timestamp,
      });
    }
  });

  return (
    <div>
      <h4>Stage Timeline: {stage}</h4>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {timelineItems.map((item, i) => (
          <TimelineBox item={item} key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * TimelineBox
 *  - Renders a small colored box for quiz or revision
 */
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
      {timeString && (
        <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>{timeString}</div>
      )}
    </div>
  );
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

  // Info "i" popup
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

  // Timeline box
  timelineBox: {
    minWidth: "60px",
    padding: "6px",
    borderRadius: "4px",
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
};