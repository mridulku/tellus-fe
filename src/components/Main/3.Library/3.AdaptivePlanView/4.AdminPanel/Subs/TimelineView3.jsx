
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * TimelineView3
 * =============
 * 
 * Props:
 *   - db          => Firestore instance
 *   - userId      => string
 *   - planId      => string
 *   - plan        => an object with .sessions => each session has .activities
 *   - selectedDate => string, e.g. "2025-04-10"
 *
 * Behavior:
 *   1) For each session in the plan, we list each activity:
 *        type="READ" or "QUIZ" with aggregatorTask="READ"|"QUIZ1"|"QUIZ2" etc.
 *   2) We fetch lumps for reading, quizTime, reviseTime, as well as reading/quiz/revision completions for the selected date.
 *   3) If aggregatorTask is "QUIZ1", we link lumps with attemptNumber=1 only.
 *   4) Lumps that don't match aggregatorTask => appear in an "Extras" sub-row for that subchapter.
 */
export default function TimelineView3({
  db,
  userId = "",
  planId = "",
  plan = null,
  selectedDate = "",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  // We'll store lumps in arrays
  const [readingLumps, setReadingLumps] = useState([]);
  const [quizLumps, setQuizLumps]       = useState([]);
  const [reviseLumps, setReviseLumps]   = useState([]);

  useEffect(() => {
    if (!db || !userId || !planId || !selectedDate) return;
    if (!plan || !plan.sessions) return;

    setLoading(true);
    setError("");

    Promise.all([
      fetchReadingLumps(),
      fetchQuizLumps(),
      fetchReviseLumps(),
    ])
    .then(([rl, ql, rv]) => {
      setReadingLumps(rl);
      setQuizLumps(ql);
      setReviseLumps(rv);
      setLoading(false);
    })
    .catch(err => {
      console.error("TimelineView3 => fetch error:", err);
      setError(err.message || "Error fetching lumps");
      setLoading(false);
    });

    async function fetchReadingLumps() {
      const coll = collection(db, "readingSubActivity");
      const qRef = query(
        coll,
        where("userId","==", userId),
        where("planId","==", planId),
        where("dateStr","==", selectedDate)
      );
      const snap = await getDocs(qRef);
      return snap.docs.map(d => d.data());
    }
    async function fetchQuizLumps() {
      const coll = collection(db, "quizTimeSubActivity");
      const qRef = query(
        coll,
        where("userId","==", userId),
        where("planId","==", planId),
        where("dateStr","==", selectedDate)
      );
      const snap = await getDocs(qRef);
      return snap.docs.map(d => d.data());
    }
    async function fetchReviseLumps() {
      const coll = collection(db, "reviseTimeSubActivity");
      const qRef = query(
        coll,
        where("userId","==", userId),
        where("planId","==", planId),
        where("dateStr","==", selectedDate)
      );
      const snap = await getDocs(qRef);
      return snap.docs.map(d => d.data());
    }
  }, [db, userId, planId, plan, selectedDate]);

  if (!plan || !plan.sessions) {
    return <p>No plan or sessions found.</p>;
  }
  if (!selectedDate) {
    return <p>No date selected.</p>;
  }
  if (loading) {
    return <p>Loading lumps for {selectedDate}...</p>;
  }
  if (error) {
    return <p style={{color:"red"}}>{error}</p>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>TimelineView3 =&gt; aggregatorTask matching for {selectedDate}</h3>

      {plan.sessions.map((sess, idx) => {
        const actArr = sess.activities || [];
        if (!actArr.length) {
          return (
            <div key={sess.sessionLabel} style={styles.sessionBox}>
              <div style={styles.sessionHeader}>
                Day {sess.sessionLabel || (idx+1)} {'>'} No activities
              </div>
            </div>
          );
        }
        return (
          <SessionBox
            key={sess.sessionLabel}
            session={sess}
            sessionIndex={idx}
            readingLumps={readingLumps}
            quizLumps={quizLumps}
            reviseLumps={reviseLumps}
          />
        );
      })}
    </div>
  );
}

// A sub-component to render each plan "session"
function SessionBox({
  session,
  sessionIndex,
  readingLumps,
  quizLumps,
  reviseLumps,
}) {
  const label = session.sessionLabel || (sessionIndex+1);
  const acts = session.activities || [];

  return (
    <div style={styles.sessionBox}>
      <div style={styles.sessionHeader}>
        Day {label} {'>'} {acts.length} activities
      </div>
      <div style={styles.tableHeaderRow}>
        <div style={{width:"12%",fontWeight:"bold"}}>Type</div>
        <div style={{width:"15%",fontWeight:"bold"}}>Aggregator Task</div>
        <div style={{width:"30%",fontWeight:"bold"}}>Subchapter</div>
        <div style={{width:"10%",fontWeight:"bold"}}>Time (Main Attempt)</div>
        <div style={{width:"15%",fontWeight:"bold"}}>AggregatorStatus</div>
        <div style={{width:"18%",fontWeight:"bold"}}>Extra Info</div>
      </div>

      {acts.map((act, i2) => {
        const { type, aggregatorTask="", aggregatorStatus="", subChapterId, subChapterName } = act;

        // parse aggregatorTask => main attempt number
        const { stageType, attemptNumber } = parseAggregatorTask(aggregatorTask);

        // We'll find lumps that match exactly that subChapter, that "type" or "stageType", and that attemptNumber
        // For reading lumps => attemptNumber = 0
        let matchedTime = 0;
        let extraInfo   = "";

        if (stageType==="reading") {
          // gather lumps from readingLumps with subChapterId matching
          const lumps = readingLumps.filter(l => l.subChapterId===subChapterId);
          matchedTime = lumps.reduce((acc,l)=>acc+(l.totalSeconds||0),0);
        } else if (stageType==="quiz") {
          // gather lumps from quizLumps with subChapterId matching AND lumps.attemptNumber===attemptNumber
          const lumps = quizLumps.filter(l =>
            l.subChapterId===subChapterId && l.attemptNumber===attemptNumber
          );
          matchedTime = lumps.reduce((acc,l)=>acc+(l.totalSeconds||0),0);
        } else if (stageType==="unknown") {
          // aggregatorTask doesn't match "READ" or "QUIZ#"
          extraInfo="(unknown aggregator task)";
        }

        return (
          <div key={i2} style={styles.tableRow}>
            <div style={{width:"12%"}}><strong>{type}</strong></div>
            <div style={{width:"15%"}}>{aggregatorTask}</div>
            <div style={{width:"30%"}}>{subChapterName||subChapterId}</div>
            <div style={{width:"10%",textAlign:"right"}}>{matchedTime}</div>
            <div style={{width:"15%",textAlign:"center"}}>{aggregatorStatus||"-"}</div>
            <div style={{width:"18%"}}>{extraInfo}</div>
          </div>
        );
      })}

      <ExtrasRow
        session={session}
        readingLumps={readingLumps}
        quizLumps={quizLumps}
        reviseLumps={reviseLumps}
      />
    </div>
  );
}

/**
 * parseAggregatorTask
 * => aggregatorTask="READ" => {stageType:"reading", attemptNumber:0}
 * => aggregatorTask="QUIZ1" => {stageType:"quiz", attemptNumber:1}
 * => aggregatorTask="QUIZ2" => {stageType:"quiz", attemptNumber:2}
 * => else => {stageType:"unknown", attemptNumber:null}
 */
function parseAggregatorTask(aggTask) {
  const up = (aggTask||"").toUpperCase();
  if (up.startsWith("READ")) {
    return { stageType:"reading", attemptNumber:0 };
  }
  if (up.startsWith("QUIZ")) {
    const digits = up.replace(/\D/g,"");
    const attempt = parseInt(digits,10)||1;
    return { stageType:"quiz", attemptNumber:attempt };
  }
  // fallback
  return { stageType:"unknown", attemptNumber:null };
}

/**
 * ExtrasRow
 * => For lumps that do not match aggregator tasks in this session
 *    e.g. aggregatorTask says "QUIZ1" but lumps exist for attemptNumber=2 => show them
 */
function ExtrasRow({
  session,
  readingLumps,
  quizLumps,
  reviseLumps,
}) {
  // We'll find lumps for each subchapter in session.activities,
  // but which aggregatorTask doesn't match. Then we display them as "Extras."

  const subChapterIds = (session.activities||[]).map(a=>a.subChapterId);
  const aggregatorList = (session.activities||[]).map(a=>a.aggregatorTask.toUpperCase());

  // We'll produce a single "Extras" block with lumps that don't match aggregator tasks
  const extras = [];

  // 1) Reading lumps => aggregator says "READ" => attemptNumber=0
  // If aggregator doesn't contain "READ" => it's extra
  readingLumps.forEach((lump) => {
    const sc = lump.subChapterId;
    if (!subChapterIds.includes(sc)) return; // out of scope
    // see if aggregator tasks had "READ"
    const hadRead = aggregatorList.some(x => x.includes("READ"));
    if (!hadRead) {
      extras.push({
        type:"READ_LUMP",
        subChapterId: sc,
        totalSeconds: lump.totalSeconds||0,
        detail: "No aggregator=READ matched"
      });
    }
  });

  // 2) quiz lumps => aggregator might have "QUIZ1","QUIZ2"...
  quizLumps.forEach((lump) => {
    const sc = lump.subChapterId;
    if (!subChapterIds.includes(sc)) return;
    const attNum = lump.attemptNumber||1;
    // aggregator has QUIZ{attNum}?
    const matchingTask = aggregatorList.find(agg => {
      if (!agg.startsWith("QUIZ")) return false;
      const digits = agg.replace(/\D/g,"");
      const n = parseInt(digits,10)||1;
      return (n===attNum);
    });
    if (!matchingTask) {
      extras.push({
        type:"QUIZ_LUMP",
        subChapterId: sc,
        totalSeconds: lump.totalSeconds||0,
        detail:`No aggregatorTask=QUIZ${attNum}`
      });
    }
  });

  // 3) revision lumps => aggregator might have "QUIZ1" => lumps attemptNumber=1. If lumps is attemptNumber=2 => extra
  reviseLumps.forEach((lump)=>{
    const sc = lump.subChapterId;
    if (!subChapterIds.includes(sc)) return;
    const attNum = lump.attemptNumber||1;
    // aggregator has QUIZ{attNum}?
    const matchingTask = aggregatorList.find(agg => {
      if (!agg.startsWith("QUIZ")) return false;
      const digits = agg.replace(/\D/g,"");
      const n = parseInt(digits,10)||1;
      return (n===attNum);
    });
    if (!matchingTask) {
      extras.push({
        type:"REV_LUMP",
        subChapterId: sc,
        totalSeconds: lump.totalSeconds||0,
        detail:`No aggregatorTask=QUIZ${attNum} matched`
      });
    }
  });

  if (!extras.length) return null; // no extras

  return (
    <div style={{marginTop:"8px", background:"#f0f0f0"}}>
      <div style={{fontWeight:"bold", padding:"4px"}}>
        Extras (not matched to aggregator tasks):
      </div>
      {extras.map((ex, i) => (
        <div key={i} style={styles.tableRow}>
          <div style={{width:"12%"}}>{ex.type}</div>
          <div style={{width:"15%"}}>-</div>
          <div style={{width:"30%"}}>{ex.subChapterId}</div>
          <div style={{width:"10%", textAlign:"right"}}>{ex.totalSeconds}</div>
          <div style={{width:"15%"}}>-</div>
          <div style={{width:"18%"}}>{ex.detail}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    marginTop:"1rem",
  },
  title: {
    margin:"0.5rem 0",
    fontWeight:600,
    color:"#333",
    borderBottom:"1px solid #ccc",
    paddingBottom:"4px",
  },
  sessionBox: {
    marginBottom:"12px",
    border:"1px solid #ddd",
    borderRadius:"4px",
    backgroundColor:"#fafafa",
    paddingBottom:"6px",
  },
  sessionHeader: {
    background:"#eee",
    padding:"8px",
    borderRadius:"4px 4px 0 0",
    fontWeight:"bold",
  },
  tableHeaderRow: {
    display:"flex",
    borderBottom:"2px solid #ccc",
    paddingBottom:"4px",
    marginBottom:"6px",
  },
  tableRow: {
    display:"flex",
    borderBottom:"1px solid #eee",
    padding:"4px 0",
    alignItems:"center",
  },
};

/****************************************************************
HOW TO USE:
   <TimelineView3
     db={db}
     userId={userId}
     planId={planId}
     plan={planDoc}   // must have .sessions, each session has .activities
     selectedDate="2025-04-10"
   />
****************************************************************/