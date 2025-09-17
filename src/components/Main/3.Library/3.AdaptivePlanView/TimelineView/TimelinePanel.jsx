// File: TimelinePanel/TimelinePanel.jsx
import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import ConstructionIcon from "@mui/icons-material/Construction";   // 🛠 tool icon


import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";

import TimelineView from "./TimelineView";
import TimelineView2 from "./TimelineView2";

export default function TimelinePanel({
  db,
  userId,
  planId,
  bookId = "",
  colorScheme = {},
}) {

    /* -----------------------------------------------------------
     TEMPORARY PLACEHOLDER – remove this block when timeline is
     ready to ship
  ----------------------------------------------------------- */
 /* TEMPORARY PLACEHOLDER – remove this block when timeline is ready to ship */
const PLACEHOLDER_ON = true;
if (PLACEHOLDER_ON) {
  return (
    <Box
      sx={{
        // CHANGED ↓ — make it transparent so it blends with the page
        bgcolor: "transparent",
        color:   "#fff",
        p: 4,

        // leave the rest as-is
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight: 240,
      }}
    >
      <ConstructionIcon sx={{ fontSize: 48, color: "#BB86FC" }} />
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        Timeline – Work in Progress
      </Typography>
      <Typography sx={{ opacity: 0.7 }}>
        Check back soon!
      </Typography>
    </Box>
  );
}




  // Loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For date dropdown
  const [dateOptions, setDateOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // lumps
  const [dailyRecords, setDailyRecords] = useState([]);
  const [readingActs, setReadingActs] = useState([]);
  const [quizActs, setQuizActs] = useState([]);
  const [revisionActs, setRevisionActs] = useState([]);

  // completions
  const [readingCompletions, setReadingCompletions] = useState([]);
  const [quizCompletions, setQuizCompletions] = useState([]);
  const [revisionCompletions, setRevisionCompletions] = useState([]);

  useEffect(() => {
    if (!db || !userId || !planId) {
      return;
    }

    setLoading(true);
    setError(null);

    async function fetchData() {
      try {
        // 1) dailyTimeRecords
        const dailyQ = query(
          collection(db, "dailyTimeRecords"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const dailySnap = await getDocs(dailyQ);
        const dailyArr = dailySnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            // preserve docId if you want
            docId: docSnap.id,
            dateStr: d.dateStr || "UnknownDate",
            totalSeconds: d.totalSeconds || 0,
          };
        });

        // 2) readingSubActivity
        const readQ = query(
          collection(db, "readingSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const readSnap = await getDocs(readQ);
        const readArr = readSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Reading",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || d.subchapterId || "", // normalize
            totalSeconds: d.totalSeconds || 0,
          };
        });

        // 3) quizTimeSubActivity
        const quizQ = query(
          collection(db, "quizTimeSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const quizSnap = await getDocs(quizQ);
        const quizArr = quizSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Quiz",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || d.subchapterId || "",
            quizStage: d.quizStage || "",
            attemptNumber: d.attemptNumber || null,
            totalSeconds: d.totalSeconds || 0,
          };
        });

        // 4) reviseTimeSubActivity
        const revQ = query(
          collection(db, "reviseTimeSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const revSnap = await getDocs(revQ);
        const revArr = revSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Revision",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || d.subchapterId || "",
            quizStage: d.quizStage || d.revisionType || "",
            attemptNumber: d.revisionNumber || null,
            totalSeconds: d.totalSeconds || 0,
          };
        });

        // ------- Completions --------
        // Here is where you must convert Firestore timestamps into dateStr
        // because these docs may NOT store dateStr directly.
        function toDateStr(timestamp) {
          if (!timestamp || !timestamp.seconds) return "UnknownDate";
          const dateObj = new Date(timestamp.seconds * 1000);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }

        // reading_demo
        const readingDemoQ = query(
          collection(db, "reading_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const readingDemoSnap = await getDocs(readingDemoQ);
        const readingComplArr = readingDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            timestamp: d.timestamp || null,
            dateStr: toDateStr(d.timestamp),
            subChapterId: d.subChapterId || d.subchapterId || "",
            // anything else you need
            readingStartTime: d.readingStartTime || null,
            readingEndTime: d.readingEndTime || null,
            productReadingPerformance: d.productReadingPerformance || "",
          };
        });

        // quizzes_demo
        const quizDemoQ = query(
          collection(db, "quizzes_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const quizDemoSnap = await getDocs(quizDemoQ);
        const quizComplArr = quizDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            timestamp: d.timestamp || null,
            dateStr: toDateStr(d.timestamp),
            subChapterId: d.subchapterId || d.subChapterId || "",
            quizType: d.quizType || "",
            attemptNumber: d.attemptNumber || 1,
            score: d.score || "",
            quizSubmission: d.quizSubmission || [],
          };
        });

        // revisions_demo
        const revDemoQ = query(
          collection(db, "revisions_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const revDemoSnap = await getDocs(revDemoQ);
        const revComplArr = revDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            timestamp: d.timestamp || null,
            dateStr: toDateStr(d.timestamp),
            subChapterId: d.subchapterId || d.subChapterId || "",
            revisionNumber: d.revisionNumber || null,
            revisionType: d.revisionType || "",
          };
        });

        // Store them
        setDailyRecords(dailyArr);
        setReadingActs(readArr);
        setQuizActs(quizArr);
        setRevisionActs(revArr);
        setReadingCompletions(readingComplArr);
        setQuizCompletions(quizComplArr);
        setRevisionCompletions(revComplArr);

        // Build date options from all .dateStr
        const allDateStrs = new Set();
        dailyArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));
        readArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));
        quizArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));
        revArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));

        readingComplArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));
        quizComplArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));
        revComplArr.forEach((obj) => obj.dateStr && allDateStrs.add(obj.dateStr));

        const sortedDates = Array.from(allDateStrs).sort();
        setDateOptions(sortedDates);
        if (sortedDates.length > 0) {
          setSelectedDate(sortedDates[0]);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch timeline data.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [db, userId, planId]);

  // ---------- Build arrays for selected date ----------
  function toJsDateObj(timestamp) {
    if (!timestamp || !timestamp.seconds) return null;
    return new Date(timestamp.seconds * 1000);
  }

  function buildTimelineEvents() {
    if (!selectedDate) return [];
    const events = [];

    // 1) reading completions for selectedDate
    readingCompletions
      .filter((rc) => rc.dateStr === selectedDate)
      .forEach((rc) => {
        const dObj = toJsDateObj(rc.timestamp);
        if (dObj) {
          events.push({
            type: "Reading",
            docId: rc.docId,
            subChapterId: rc.subChapterId,
            eventTime: dObj,
            detail: `Completed reading subchapter ${rc.subChapterId}`,
          });
        }
      });

    // 2) quiz completions
    quizCompletions
      .filter((qc) => qc.dateStr === selectedDate)
      .forEach((qc) => {
        const dObj = toJsDateObj(qc.timestamp);
        if (dObj) {
          events.push({
            type: "Quiz",
            docId: qc.docId,
            subChapterId: qc.subChapterId,
            eventTime: dObj,
            detail: `Quiz #${qc.attemptNumber}, Score=${qc.score}`,
          });
        }
      });

    // 3) revision completions
    revisionCompletions
      .filter((rv) => rv.dateStr === selectedDate)
      .forEach((rv) => {
        const dObj = toJsDateObj(rv.timestamp);
        if (dObj) {
          events.push({
            type: "Revision",
            docId: rv.docId,
            subChapterId: rv.subChapterId,
            eventTime: dObj,
            detail: `Revision #${rv.revisionNumber} (${rv.revisionType})`,
          });
        }
      });

    // Sort ascending by eventTime
    events.sort((a, b) => a.eventTime - b.eventTime);
    return events;
  }

  const timelineEvents = buildTimelineEvents();

  // lumps for TimelineView2
  const readingActsForDate = readingActs.filter((r) => r.dateStr === selectedDate);
  const quizActsForDate = quizActs.filter((q) => q.dateStr === selectedDate);
  const revisionActsForDate = revisionActs.filter((r) => r.dateStr === selectedDate);

  const readingCompletionsForDate = readingCompletions.filter((r) => r.dateStr === selectedDate);
  const quizCompletionsForDate = quizCompletions.filter((q) => q.dateStr === selectedDate);
  const revisionCompletionsForDate = revisionCompletions.filter((r) => r.dateStr === selectedDate);

  // ---------- Render ----------
  if (!planId || !userId) {
    return <div style={styles.errorText}>No valid userId/planId.</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Timeline</h2>
      {loading && <p>Loading timeline data...</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {!loading && dateOptions.length === 0 && (
        <p>No usage data found for this plan.</p>
      )}

      {dateOptions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "8px" }}>Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.select}
          >
            {dateOptions.map((dateStr) => (
              <option key={dateStr} value={dateStr}>
                {dateStr}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 1) TimelineView */}
      <TimelineView selectedDate={selectedDate} timelineEvents={timelineEvents} />

      {/* 2) TimelineView2 */}
      <TimelineView2
        selectedDate={selectedDate}
        readingActsForDate={readingActsForDate}
        quizActsForDate={quizActsForDate}
        revisionActsForDate={revisionActsForDate}
        readingCompletionsForDate={readingCompletionsForDate}
        quizCompletionsForDate={quizCompletionsForDate}
        revisionCompletionsForDate={revisionCompletionsForDate}
      />
    </div>
  );
}

const styles = {
  container: {
    // CHANGED ↓ — remove light card styling
    backgroundColor: "transparent",
    color:           "#fff",
    padding:         "1rem",

    // optional: flush with surroundings
    borderRadius:    0,
  },
  title: {
    margin: 0,
    marginBottom: "0.5rem",
    fontSize: "1.25rem",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
  },
  select: {
    padding: "6px",
    fontSize: "1rem",
  },
};