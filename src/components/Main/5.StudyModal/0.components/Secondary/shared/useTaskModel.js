import { useMemo } from "react";

/* ---------- stage meta ---------- */
const STAGE_META = {
  READ:       { icon: "📖", color: "#BB86FC", label: "Read" },
  REMEMBER:   { icon: "🧠", color: "#80DEEA", label: "Remember" },
  UNDERSTAND: { icon: "🤔", color: "#FFD54F", label: "Understand" },
  APPLY:      { icon: "🔧", color: "#AED581", label: "Apply" },
  ANALYSE:    { icon: "🔬", color: "#F48FB1", label: "Analyse" },
  CUMULATIVEQUIZ:     { icon: "📊", color: "#FF7043", label: "Cumulative Quiz" },
  CUMULATIVEREVISION: { icon: "🔁", color: "#64B5F6", label: "Cumulative Rev." },
};

/* ---------- utilities ---------- */
const tsMs = (t) =>
  t?._seconds ? t._seconds * 1e3 :
  t?.seconds  ? t.seconds  * 1e3 :
  0;

function buildConceptStats(arr = []) {
  const map = new Map();
  arr.forEach((att) =>
    (att.conceptStats || []).forEach((c) => {
      if (!map.has(c.conceptName) || map.get(c.conceptName) !== "PASS") {
        map.set(c.conceptName, c.passOrFail);
      }
    })
  );
  return map;
}

/* ===================================================================
   useTaskModel
   • Converts raw activities + aggregator maps into render-ready objects
   • A task is "loading" until both:
       1) subchapterMap[subChapterId] exists   AND
       2) timeMap[activityId] is not undefined
=================================================================== */
export default function useTaskModel(
  activities = [],
  subchapterStatusMap = {},
  timeMap = {},
  sessionDateISO = null
) {
  return useMemo(
    () =>
      activities.map((act, idx) => {
        /* ---------- stage meta ---------- */
        let stageKey;
        if ((act.type || "").toLowerCase() === "read") {
          stageKey = "read";
        } else {
          stageKey = (act.quizStage || "")
            .replace(/[\s_]+/g, "")
            .toLowerCase(); // e.g. "cumulativequiz"
        }
        const meta =
          STAGE_META[(stageKey || "").toUpperCase()] || {
            icon: "❓",
            color: "#888",
            label: stageKey,
          };

        const isCum =
          stageKey === "cumulativequiz" || stageKey === "cumulativerevision";

        /* ---------- aggregator slices ---------- */
        let subObj   = null;
        let stageObj = {};
        let statsArr = [];

        if (!isCum) {
          subObj   = subchapterStatusMap?.[act.subChapterId];
          stageObj = subObj?.quizStagesData?.[stageKey] ?? {};
          statsArr = stageObj.allAttemptsConceptStats ?? [];
        }

        /* ---------- concept mastery ---------- */
        const conceptMap   = isCum ? new Map() : buildConceptStats(statsArr);
        const totalConcept = conceptMap.size;
        const mastered     = isCum
          ? 0
          : [...conceptMap.values()].filter((v) => v === "PASS").length;
        const quizPct      = totalConcept
          ? Math.round((mastered / totalConcept) * 100)
          : 0;

        /* ---------- reading progress ---------- */
        const readSum   = subObj?.readingSummary || {};
        const readingPct = act.completed
          ? 100
          : typeof readSum.percent === "number"
          ? Math.round(readSum.percent)
          : 0;

        let pct;
        if (meta.label === "Read")            pct = readingPct;
        else if (isCum)                       pct = act.completed ? 100 : 0;
        else                                   pct = quizPct;

        /* ---------- attempts & buckets (quiz only) ---------- */
        let attemptsSoFar = [];
        let nextActivity  = null;
        let attBefore = [],
            attToday  = [],
            attAfter  = [];

        if (!isCum && meta.label !== "Read") {
          const q   = stageObj.quizAttempts     ?? [];
          const r   = stageObj.revisionAttempts ?? [];
          const all = [
            ...q.map((o) => ({ ...o, type: "quiz" })),
            ...r.map((o) => ({ ...o, type: "revision" })),
          ].sort((a, b) => tsMs(a.timestamp) - tsMs(b.timestamp));

          const tag = (at) =>
            `${at.type === "quiz" ? "Q" : "R"}${at.attemptNumber || at.revisionNumber || 1}`;
          attemptsSoFar = all.map(tag);

          /* next-activity recommendation (normal quizzes only) */
          if (pct < 100) {
            const qCnt = q.length,
                  rCnt = r.length;
            if (qCnt === 0 && rCnt === 0) nextActivity = "Q1";
            else if (qCnt === rCnt)       nextActivity = `Q${qCnt + 1}`;
            else if (qCnt === rCnt + 1)   nextActivity = `R${qCnt}`;
          }

          /* date buckets */
          if (sessionDateISO) {
            all.forEach((at) => {
              const dISO = new Date(tsMs(at.timestamp)).toISOString().slice(0, 10);
              const lb   = tag(at);
              if (dISO < sessionDateISO)         attBefore.push(lb);
              else if (dISO === sessionDateISO)  attToday .push(lb);
              else                               attAfter .push(lb);
            });
          }
        }

        /* ---------- overall status ---------- */
        const hasAgg =
          isCum
            ? true                                      // cumulative tasks need no aggregator
            : meta.label === "Read"
            ? true
            : !!subObj && timeMap[act.activityId] !== undefined;

        let status;
        if (!hasAgg)            status = "loading";
        else if (pct === 100)   status = "completed";
        else if (pct > 0)       status = "partial";
        else                    status = "notstarted";

        /* ---------- return render-ready object ---------- */
        return {
          /* navigation */
          flatIndex: act.flatIndex ?? idx,
          id       : act.activityId,

          /* flags */
          meta,
          status,
          isCumulative : isCum,
          locked       : (act.aggregatorStatus || "").toLowerCase() === "locked",
          deferred     : !!act.deferred,

          /* labels */
          subch  : act.subChapterName || act.subChapterId,
          book   : act.bookName       || "—",
          chapter: act.chapterName    || "—",

          /* timing */
          spentMin: Math.round((timeMap[act.activityId] || 0) / 60),
          expMin  : act.timeNeeded || (isCum ? 5 : 0),

          /* progress & concepts */
          pct,
          mastered,
          total: totalConcept,
          conceptList: [...conceptMap.entries()].map(([name, res]) => ({
            name,
            ok: res === "PASS",
          })),

          /* attempts */
          attemptsSoFar,
          nextActivity,
          attBefore,
          attToday,
          attAfter,
        };
      }),
    [activities, subchapterStatusMap, timeMap, sessionDateISO]
  );
}