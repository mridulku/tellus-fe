// PlanUsageHistory.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";

import RawView from "./Subs/RawView";


import PlanView from "./Subs/PlanView";
import PlanView2 from "./Subs/PlanView2";





import TimeCalc from "./Subs/TimeCalc"; // <-- NEW import
import PlanLog from "./Subs/PlanLog"; // <-- NEW import






import { buildReadingStats } from "./Subs/buildReadingStats"; // Optional if you had that logic extracted

export default function PlanUsageHistory({
  db,
  userId,
  planId,
  planData = null,
  bookId = "",          // <-- we add a new prop for bookId
  colorScheme = {},
}) {
  // -- State for loading/error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -- We still show day-based usage => "RAW" & "TIMELINE"
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

  // readingStats => { [subChapterId]: { totalTimeSpentMinutes, completionDate } }
  const [readingStats, setReadingStats] = useState({});

  // tabs: "RAW", "TIMELINE", "PLAN", "LIBRARY"
  const [activeTab, setActiveTab] = useState("RAW");

  function toDateStr(timestamp) {
    if (!timestamp || !timestamp.seconds) return "UnknownDate";
    const dateObj = new Date(timestamp.seconds * 1000);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    if (!db || !planId || !userId) {
      return;
    }

    setLoading(true);
    setError(null);

    // clear old
    setDailyRecords([]);
    setReadingActs([]);
    setQuizActs([]);
    setRevisionActs([]);
    setReadingCompletions([]);
    setQuizCompletions([]);
    setRevisionCompletions([]);
    setReadingStats({});
    setDateOptions([]);
    setSelectedDate("");

    async function fetchAllData() {
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
            id: docSnap.id,
            dateStr: d.dateStr || "UnknownDate",
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setDailyRecords(dailyArr);

        // 2) readingSubActivity
        const readSubQ = query(
          collection(db, "readingSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const readSubSnap = await getDocs(readSubQ);
        const readActsArr = readSubSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Reading",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || "",
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setReadingActs(readActsArr);

        // 3) quizTimeSubActivity
        const quizSubQ = query(
          collection(db, "quizTimeSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const quizSubSnap = await getDocs(quizSubQ);
        const quizActsArr = quizSubSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Quiz",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || "",
            quizStage: d.quizStage || "",
            attemptNumber: d.attemptNumber || null,
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setQuizActs(quizActsArr);

        // 4) reviseTimeSubActivity
        const revSubQ = query(
          collection(db, "reviseTimeSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const revSubSnap = await getDocs(revSubQ);
        const revActsArr = revSubSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Revision",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || "",
            quizStage: d.quizStage || "",
            attemptNumber: d.revisionNumber || null,
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setRevisionActs(revActsArr);

        // ======= COMPLETIONS =======
        // reading_demo
        const readDemoQ = query(
          collection(db, "reading_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const readDemoSnap = await getDocs(readDemoQ);
        const readCompArr = readDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            dateStr: toDateStr(d.timestamp),
            timestamp: d.timestamp || null,
            subChapterId: d.subChapterId || "",
            readingStartTime: d.readingStartTime || null,
            readingEndTime: d.readingEndTime || null,
            productReadingPerformance: d.productReadingPerformance || "",
          };
        });
        setReadingCompletions(readCompArr);

        // quizzes_demo
        const quizDemoQ = query(
          collection(db, "quizzes_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const quizDemoSnap = await getDocs(quizDemoQ);
        const quizCompArr = quizDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            dateStr: toDateStr(d.timestamp),
            timestamp: d.timestamp || null,
            subChapterId: d.subchapterId || "",
            quizType: d.quizType || "",
            attemptNumber: d.attemptNumber || 1,
            score: d.score || "",
            quizSubmission: d.quizSubmission || [],
          };
        });
        setQuizCompletions(quizCompArr);

        // revisions_demo
        const revDemoQ = query(
          collection(db, "revisions_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const revDemoSnap = await getDocs(revDemoQ);
        const revCompArr = revDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            dateStr: toDateStr(d.timestamp),
            timestamp: d.timestamp || null,
            subChapterId: d.subchapterId || "",
            revisionNumber: d.revisionNumber || null,
            revisionType: d.revisionType || "",
          };
        });
        setRevisionCompletions(revCompArr);

        // unify dateStr
        const dateSet = new Set();
        dailyArr.forEach((r) => dateSet.add(r.dateStr));
        readActsArr.forEach((r) => dateSet.add(r.dateStr));
        quizActsArr.forEach((r) => dateSet.add(r.dateStr));
        revActsArr.forEach((r) => dateSet.add(r.dateStr));
        readCompArr.forEach((r) => dateSet.add(r.dateStr));
        quizCompArr.forEach((r) => dateSet.add(r.dateStr));
        revCompArr.forEach((r) => dateSet.add(r.dateStr));

        const finalDates = Array.from(dateSet).sort();
        setDateOptions(finalDates);
        if (finalDates.length > 0) {
          setSelectedDate(finalDates[0]);
        }

        // Build readingStats => time lumps + completion
        const readingStatsObj = buildReadingStats(readActsArr, readCompArr);
        setReadingStats(readingStatsObj);

      } catch (err) {
        console.error("Error fetching usage data:", err);
        setError(err.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [db, planId, userId]);

  // Filter lumps & completions by selectedDate
  const chosenDailyRecord = dailyRecords.find((dr) => dr.dateStr === selectedDate) || null;
  const readingActsForDate = readingActs.filter((ra) => ra.dateStr === selectedDate);
  const quizActsForDate    = quizActs.filter((qa) => qa.dateStr === selectedDate);
  const revisionActsForDate= revisionActs.filter((rv) => rv.dateStr === selectedDate);

  const readingCompletionsForDate = readingCompletions.filter((rc) => rc.dateStr === selectedDate);
  const quizCompletionsForDate    = quizCompletions.filter((qc) => qc.dateStr === selectedDate);
  const revisionCompletionsForDate= revisionCompletions.filter((rvc) => rvc.dateStr === selectedDate);

  // Build timeline
  function buildTimelineEvents() {
    const events = [];
    function toJsDateObj(ts) {
      if (!ts || !ts.seconds) return null;
      return new Date(ts.seconds * 1000);
    }
    // reading
    for (const rc of readingCompletionsForDate) {
      const d = toJsDateObj(rc.timestamp);
      if (d) {
        events.push({
          type: "Reading",
          docId: rc.docId,
          subChapterId: rc.subChapterId,
          eventTime: d,
          detail: `Started reading subchapter ${rc.subChapterId}`,
        });
      }
    }
    // quiz
    for (const qc of quizCompletionsForDate) {
      const d = toJsDateObj(qc.timestamp);
      if (d) {
        events.push({
          type: "Quiz",
          docId: qc.docId,
          subChapterId: qc.subChapterId,
          eventTime: d,
          detail: `Quiz #${qc.attemptNumber}, score=${qc.score}`,
        });
      }
    }
    // revision
    for (const rvc of revisionCompletionsForDate) {
      const d = toJsDateObj(rvc.timestamp);
      if (d) {
        events.push({
          type: "Revision",
          docId: rvc.docId,
          subChapterId: rvc.subChapterId,
          eventTime: d,
          detail: `Revision #${rvc.revisionNumber}, type=${rvc.revisionType}`,
        });
      }
    }
    events.sort((a, b) => a.eventTime - b.eventTime);
    return events;
  }
  const timelineEvents = buildTimelineEvents();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Plan Usage History</h2>

      {(!planId || !userId) && (
        <p style={{ color: "red" }}>No valid userId or planId provided.</p>
      )}

      {loading && <p style={styles.infoText}>Loading...</p>}
      {error && <p style={{ ...styles.infoText, color: "red" }}>{error}</p>}

      {!loading && !error && dateOptions.length === 0 && planId && userId && (
        <p style={styles.infoText}>No records found for this plan.</p>
      )}

      {dateOptions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "8px" }}>Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.selectDropdown}
          >
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tab row => now has 4 tabs */}
      <div style={styles.tabRow}>
        <div style={tabStyle(activeTab === "RAW")} onClick={() => setActiveTab("RAW")}>
          Raw View
        </div>
       


        <div style={tabStyle(activeTab === "PLAN")} onClick={() => setActiveTab("PLAN")}>
          Plan View
        </div>

        <div style={tabStyle(activeTab === "PLAN2")} onClick={() => setActiveTab("PLAN2")}>
          Plan View 2
        </div>



        
        <div style={tabStyle(activeTab === "TIMECALC")} onClick={() => setActiveTab("TIMECALC")}>
          TimeCalc
        </div>
        <div style={tabStyle(activeTab === "PLANLOG")} onClick={() => setActiveTab("PLANLOG")}>
          PlanLog
        </div>
        
       


        



        



      </div>

      {/* If no data => show message (only RAW/TIMELINE) */}
      {activeTab !== "PLAN" && activeTab !== "LIBRARY" && selectedDate &&
        readingActsForDate.length === 0 &&
        quizActsForDate.length === 0 &&
        revisionActsForDate.length === 0 &&
        readingCompletionsForDate.length === 0 &&
        quizCompletionsForDate.length === 0 &&
        revisionCompletionsForDate.length === 0 && (
          <p style={styles.infoText}>
            No activities/completions found for {selectedDate}.
          </p>
        )
      }

      {/* RENDER child components based on tab */}
      {activeTab === "RAW" && (
        <RawView
          selectedDate={selectedDate}
          dailyRecord={chosenDailyRecord}
          readingActsForDate={readingActsForDate}
          quizActsForDate={quizActsForDate}
          revisionActsForDate={revisionActsForDate}
          readingCompletionsForDate={readingCompletionsForDate}
          quizCompletionsForDate={quizCompletionsForDate}
          revisionCompletionsForDate={revisionCompletionsForDate}
        />
      )}

  

      {activeTab === "PLAN" && (
        <PlanView
          planId={planId}
          userId={userId}
          plan={planData}
          readingStats={readingStats}
          colorScheme={colorScheme}
        />
      )}

      {activeTab === "PLAN2" && (
        <PlanView2
          planId={planId}
          userId={userId}
          plan={planData}
          readingStats={readingStats}
          colorScheme={colorScheme}
        />
      )}

      

      {activeTab === "TIMECALC" && (
        <TimeCalc
          db={db}
          userId={userId}
          planId={planId}
          readingStats={readingStats}
          bookId={bookId}  // The key: pass the bookId for chapters
        />
      )} 


      {activeTab === "PLANLOG" && (
        <PlanLog
          db={db}
          userId={userId}
          planId={planId}
          readingStats={readingStats}
          bookId={bookId}  // The key: pass the bookId for chapters
        />
      )}   

  












    </div>
  );

  function tabStyle(isActive) {
    return {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: "1px solid #ccc",
      borderBottom: isActive ? "none" : "1px solid #ccc",
      borderRadius: "6px 6px 0 0",
      marginRight: "5px",
      backgroundColor: isActive ? "#eee" : "#f9f9f9",
    };
  }
}

const styles = {
  container: {
    padding: "16px",
    borderRadius: "6px",
    maxWidth: "900px",
    margin: "40px auto",
    fontFamily: "'Roboto', sans-serif",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    color: "#000"
  },
  title: {
    marginTop: 0,
    marginBottom: "1rem",
    textAlign: "center",
  },
  infoText: {
    fontSize: "0.95rem",
    marginBottom: "1rem",
  },
  selectDropdown: {
    padding: "6px 8px",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  tabRow: {
    display: "flex",
    marginBottom: "1rem",
  },
};