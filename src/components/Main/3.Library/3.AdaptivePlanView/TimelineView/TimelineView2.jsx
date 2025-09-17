// File: TimelineView2.jsx
import React from "react";

// If you want a specific order for stages:
const STAGES_ORDER = ["reading", "remember", "understand", "apply", "analyze"];

/**
 * TimelineView2
 * -------------
 * Props:
 *   - selectedDate (string)
 *   - readingActsForDate     (array of lumps for reading time)
 *   - quizActsForDate        (array of lumps for quiz time)
 *   - revisionActsForDate    (array of lumps for revision time)
 *   - readingCompletionsForDate   (array of reading completions)
 *   - quizCompletionsForDate      (array of quiz completions)
 *   - revisionCompletionsForDate  (array of revision completions)
 *
 * This component merges all that data into a table showing, for each (subChapterId, stage):
 *   - total time spent on this day
 *   - attempts (quiz or revision)
 *   - any completion status (read done? quiz pass? revision done?).
 */
export default function TimelineView2({
  selectedDate = "",
  readingActsForDate = [],
  quizActsForDate = [],
  revisionActsForDate = [],
  readingCompletionsForDate = [],
  quizCompletionsForDate = [],
  revisionCompletionsForDate = [],
}) {
  if (!selectedDate) {
    return <p style={styles.infoText}>No date selected.</p>;
  }

  // 1) Build a dictionary of subChapter -> stage -> usage info
  //    The "stage" for reading is "reading".
  //    The "stage" for quiz lumps is quizStage (like "remember"|"understand"|"apply"|"analyze").
  //    The "stage" for revision lumps is revisionType or quizStage as well.
  //    We store lumps as timeSpent, attemptNumber arrays, etc.

  // We'll accumulate an object shape like:
  // {
  //   [subChapterId]: {
  //     [stage]: {
  //       timeSpent: number,
  //       quizAttempts: array of {attemptNumber, score?}
  //       revisionAttempts: array of {revisionNumber, ...}
  //       readingDone: boolean,
  //       quizCompletions: array of {score, attemptNumber, etc.}
  //       revisionCompletions: array of {...}
  //     }
  //   }
  // }

  const usageMap = {};

  function ensureSubChStage(subChId, stageKey) {
    if (!usageMap[subChId]) {
      usageMap[subChId] = {};
    }
    if (!usageMap[subChId][stageKey]) {
      usageMap[subChId][stageKey] = {
        timeSpent: 0,
        quizAttempts: [],
        revisionAttempts: [],
        readingDone: false,
        quizCompletions: [],
        revisionCompletions: [],
      };
    }
  }

  // 2a) Gather lumps: readingActsForDate => stage="reading"
  readingActsForDate.forEach((rec) => {
    const { subChapterId, totalSeconds } = rec;
    if (!subChapterId) return;
    const stageKey = "reading";
    ensureSubChStage(subChapterId, stageKey);
    usageMap[subChapterId][stageKey].timeSpent += totalSeconds;
  });

  // 2b) quizActsForDate => stage = quizStage
  quizActsForDate.forEach((rec) => {
    const { subChapterId, totalSeconds, quizStage, attemptNumber } = rec;
    if (!subChapterId || !quizStage) return;
    const stageKey = quizStage.toLowerCase();
    ensureSubChStage(subChapterId, stageKey);
    usageMap[subChapterId][stageKey].timeSpent += totalSeconds;
    usageMap[subChapterId][stageKey].quizAttempts.push({
      attemptNumber,
      time: totalSeconds,
    });
  });

  // 2c) revisionActsForDate => stage = quizStage or revisionType
  revisionActsForDate.forEach((rec) => {
    const { subChapterId, totalSeconds, quizStage, attemptNumber } = rec;
    if (!subChapterId || !quizStage) return;
    const stageKey = quizStage.toLowerCase();
    ensureSubChStage(subChapterId, stageKey);
    usageMap[subChapterId][stageKey].timeSpent += totalSeconds;
    usageMap[subChapterId][stageKey].revisionAttempts.push({
      revisionNumber: attemptNumber,
      time: totalSeconds,
    });
  });

  // 3) Completions:
  // 3a) readingCompletions => set readingDone=true
  readingCompletionsForDate.forEach((rec) => {
    const { subChapterId } = rec;
    if (!subChapterId) return;
    ensureSubChStage(subChapterId, "reading");
    usageMap[subChapterId]["reading"].readingDone = true;
  });

  // 3b) quizCompletions => push them in usageMap
  quizCompletionsForDate.forEach((qc) => {
    const { subChapterId, quizType, attemptNumber, score } = qc;
    if (!subChapterId || !quizType) return;
    const stageKey = quizType.toLowerCase();
    ensureSubChStage(subChapterId, stageKey);
    usageMap[subChapterId][stageKey].quizCompletions.push({
      attemptNumber,
      score,
    });
  });

  // 3c) revisionCompletions => push them in usageMap
  revisionCompletionsForDate.forEach((rc) => {
    const { subChapterId, revisionType, revisionNumber } = rc;
    if (!subChapterId || !revisionType) return;
    const stageKey = revisionType.toLowerCase();
    ensureSubChStage(subChapterId, stageKey);
    usageMap[subChapterId][stageKey].revisionCompletions.push({
      revisionNumber,
    });
  });

  // 4) Now we turn usageMap into an array of rows:
  // We want to show rows for each subChapter across each stage that actually has data
  // or we can forcibly show all stages for a subChapter if you prefer. For brevity, let's only show stages that appear.
  const rows = [];
  Object.keys(usageMap).forEach((subChId) => {
    const subChStages = usageMap[subChId];
    Object.keys(subChStages).forEach((stageKey) => {
      rows.push({
        subChapterId: subChId,
        stage: stageKey,
        data: subChStages[stageKey],
      });
    });
  });

  // Sort rows by subChapterId, then by stage in a custom order
  rows.sort((a, b) => {
    if (a.subChapterId < b.subChapterId) return -1;
    if (a.subChapterId > b.subChapterId) return 1;
    // then stage order
    const aStageIdx = STAGES_ORDER.indexOf(a.stage);
    const bStageIdx = STAGES_ORDER.indexOf(b.stage);
    if (aStageIdx === -1 && bStageIdx === -1) {
      // both not recognized => compare strings
      return a.stage.localeCompare(b.stage);
    } else if (aStageIdx === -1) {
      // a stage not recognized => put it last
      return 1;
    } else if (bStageIdx === -1) {
      return -1;
    } else {
      return aStageIdx - bStageIdx;
    }
  });

  if (rows.length === 0) {
    return (
      <p style={styles.infoText}>
        No usage data found for {selectedDate}.
      </p>
    );
  }

  // 5) Render as a table
  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={styles.sectionTitle}>Detailed Timeline 2 for {selectedDate}</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Subchapter</th>
            <th style={styles.th}>Stage</th>
            <th style={styles.th}>Time Spent (sec)</th>
            <th style={styles.th}>Reading Done?</th>
            <th style={styles.th}>Quiz Attempts</th>
            <th style={styles.th}>Quiz Completions</th>
            <th style={styles.th}>Revision Attempts</th>
            <th style={styles.th}>Revision Completions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const { subChapterId, stage, data } = row;
            const { timeSpent, readingDone, quizAttempts, quizCompletions, revisionAttempts, revisionCompletions } = data;
            // Build strings for quiz attempts, completions, etc.
            const quizAttemptStr = quizAttempts
              .map((qa) => `#${qa.attemptNumber} (${qa.time}s)`)
              .join(", ");
            const quizCompletionStr = quizCompletions
              .map((qc) => `#${qc.attemptNumber}, score=${qc.score}`)
              .join("; ");
            const revisionAttemptStr = revisionAttempts
              .map((ra) => `#${ra.revisionNumber} (${ra.time}s)`)
              .join(", ");
            const revisionCompletionStr = revisionCompletions
              .map((rc) => `#${rc.revisionNumber}`)
              .join(", ");

            return (
              <tr key={idx} style={styles.tr}>
                <td style={styles.td}>{subChapterId}</td>
                <td style={styles.td}>{stage}</td>
                <td style={styles.td}>{timeSpent}</td>
                <td style={styles.td}>{readingDone ? "Yes" : "No"}</td>
                <td style={styles.td}>{quizAttemptStr}</td>
                <td style={styles.td}>{quizCompletionStr}</td>
                <td style={styles.td}>{revisionAttemptStr}</td>
                <td style={styles.td}>{revisionCompletionStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// -------------- styles --------------
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "8px",
  },
  th: {
    border: "1px solid #ccc",
    backgroundColor: "#eee",
    padding: "8px",
    fontWeight: "bold",
    textAlign: "left",
  },
  tr: {
    borderBottom: "1px solid #ccc",
  },
  td: {
    border: "1px solid #ccc",
    padding: "8px",
  },
};