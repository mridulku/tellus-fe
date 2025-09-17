// File: DayActivities.jsx  (dual-view, attempt buckets + new status logic) 2025-05-01
import React, { useMemo } from "react";
import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import ActivityAccordion from "./ActivityAccordion";

/* ---------- quick admin check ---------- */
const ADMIN_UIDS = ["acbhbtiODoPPcks2CP6ZdmZ"];

/* ---------- icon & colour presets ---------- */
const STAGE_META = {
  READ:        { icon: "📖", color: "#BB86FC", label: "Read" },
  REMEMBER:    { icon: "🧠", color: "#80DEEA", label: "Remember" },
  UNDERSTAND:  { icon: "🤔", color: "#FFD54F", label: "Understand" },
  APPLY:       { icon: "🔧", color: "#AED581", label: "Apply" },
  ANALYSE:     { icon: "🔬", color: "#F48FB1", label: "Analyse" },
    CUMULATIVEQUIZ:      { icon: "📊", color: "#FF7043", label: "Cumulative Quiz" },
  CUMULATIVEREVISION:  { icon: "🔁", color: "#64B5F6", label: "Cumulative Revision" },
};

const ICON_BOOK    = "📚";
const ICON_CHAPTER = "📄";
const ICON_CLOCK   = "⏱";

/* status colours */
const CLR_COMPLETE = "#4CAF50";
const CLR_PARTIAL  = "#FFB300";
const CLR_NONE     = "#E53935";

/* helper: Firestore / epoch → ms */
const tsMs = (t) =>
  t?._seconds ? t._seconds * 1e3 :
  t?.seconds  ? t.seconds  * 1e3 :
  0;

/* =================================================================== */
export default function DayActivities({
  activities = [],
  subchapterStatusMap,
  onOpenPlanFetcher,
  planId,
  userId,
  sessionDateISO,            // "YYYY-MM-DD"
  ...rest
}) {
  /* ---------- admin / user split ---------- */
  const reduxUid = useSelector((s) => s.auth?.userId);
  const uid      = userId || reduxUid;
  const isAdmin  = ADMIN_UIDS.includes(uid);

  if (isAdmin) {
    return (
      <Box>
        {activities.map((a, i) => (
          <ActivityAccordion key={i} index={i} activity={a} {...rest} />
        ))}
      </Box>
    );
  }

  /* ================= USER CARD GRID ================= */
  const tasks = useMemo(
    () =>
      activities.map((act) => {
        /* 1. stage key & meta ---------------------------------- */
        const stageKey =
          act.type.toLowerCase() === "read"
            ? "read"
            : (act.quizStage || "").toLowerCase();

        const meta =
          STAGE_META[(stageKey || "").toUpperCase()] || {
            icon: "❓",
            color: "#888",
            label: stageKey,
          };

        /* 2. aggregator slices --------------------------------- */
        const subObj  = subchapterStatusMap?.[act.subChapterId] ?? {};
        const stageObj= subObj.quizStagesData?.[stageKey] ?? {};
        const statsArr= stageObj.allAttemptsConceptStats ?? [];

        /* concept mastery % (quiz only) */
        const conceptMap = new Map();
        statsArr.forEach((att) =>
          (att.conceptStats || []).forEach((cs) => {
            if (
              !conceptMap.has(cs.conceptName) ||
              conceptMap.get(cs.conceptName) !== "PASS"
            ) {
              conceptMap.set(cs.conceptName, cs.passOrFail);
            }
          })
        );
        const total    = conceptMap.size;
        const mastered = [...conceptMap.values()].filter((v) => v === "PASS").length;
        const pct      = total ? Math.round((mastered / total) * 100) : 0;

        /* reading completion ----------------------------------- */
        let readDone = false;
        let readingPct = 0;
        if (meta.label === "Read") {
          const rSum = subObj.readingSummary || {};
          readDone   = !!(act.completed || rSum.completed || rSum.dateCompleted);
          readingPct = readDone
            ? 100
            : typeof rSum.percent === "number"
            ? Math.round(rSum.percent)
            : 0;
        }

        /* 3. attempt lists + next-activity --------------------- */
        let attemptsSoFar = [];
        let nextActivity  = null;
        let attBefore=[] , attToday=[] , attAfter=[];

        if (meta.label !== "Read") {
          const quizAtt = stageObj.quizAttempts     ?? [];
          const revAtt  = stageObj.revisionAttempts ?? [];

          const combined = [
            ...quizAtt.map((o) => ({ ...o, type: "quiz"     })),
            ...revAtt .map((o) => ({ ...o, type: "revision" })),
          ].sort((a, b) => tsMs(a.timestamp) - tsMs(b.timestamp));

          const labelOf = (at) =>
            `${at.type === "quiz" ? "Q" : "R"}${
              at.attemptNumber || at.revisionNumber || 1
            }`;

          attemptsSoFar = combined.map(labelOf);

          /* progress <100% → figure next activity */
          const progressPct = pct;
          if (progressPct < 100) {
            const qCount = quizAtt.length;
            const rCount = revAtt.length;

            if (qCount === 0 && rCount === 0)       nextActivity = "Q1";
            else if (qCount === rCount)            nextActivity = `Q${qCount + 1}`;
            else if (qCount === rCount + 1)        nextActivity = `R${qCount}`;
          }

          /* bucket by date */
          if (sessionDateISO) {
            combined.forEach((at) => {
              const dISO = new Date(tsMs(at.timestamp))
                             .toISOString().slice(0, 10);
              const lbl  = labelOf(at);
              if (dISO < sessionDateISO)        attBefore.push(lbl);
              else if (dISO === sessionDateISO) attToday .push(lbl);
              else                              attAfter .push(lbl);
            });
          }
        }

        /* 4. status logic -------------------------------------- */
        const deferred = !!act.deferred;

        let status;            // 'completed' | 'partial' | 'notstarted'
        if (meta.label === "Read") {
          status = readDone ? "completed" : "notstarted";
        } else {
          if (pct === 100 && !deferred)          status = "completed";
          else if (pct < 100 && attToday.length) status = "partial";
          else                                   status = "notstarted";
        }

        return {
          id: act.activityId,
          meta,
          status,
          deferred,
          _rawActivity: act,

          subch:   act.subChapterName || act.subChapterId,
          book:    act.bookName       || "—",
          chapter: act.chapterName    || "—",

          pct:       meta.label === "Read" ? readingPct : pct,
          mastered,
          total,
          spentMin: Math.round((act.timeSpent || 0) / 60),
          expMin:   act.timeNeeded || 0,

          conceptList: [...conceptMap.entries()].map(([name, res]) => ({
            name,
            ok: res === "PASS",
          })),

          attemptsSoFar,
          nextActivity,
          attBefore,
          attToday,
          attAfter,
        };
      }),
    [activities, subchapterStatusMap, sessionDateISO]
  );

  /* ---------- UI ---------- */
  const openFetcher = (t) =>
    onOpenPlanFetcher?.(planId, t._rawActivity);
    

  return (
    <Box sx={{ mt: 1 }}>
      <SummaryBar tasks={tasks} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 1.5,
        }}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} t={t} onOpen={() => openFetcher(t)} />
        ))}
      </Box>
    </Box>
  );
}

/* =====================================================================
   TaskCard – colours itself by status
===================================================================== */
function TaskCard({ t, onOpen }) {
  const { meta, status, deferred } = t;

  /* border / bg colour */
  const border =
    status === "completed" ? CLR_COMPLETE :
    status === "partial"   ? CLR_PARTIAL  :
                             CLR_NONE;
  const bg =
    status === "completed" ? "rgba(76,175,80,.15)"  :
    status === "partial"   ? "rgba(255,152,0,.15)"  :
                             "rgba(229,57,53,.15)";

  /* badge text */
  const badge =
    status === "completed" ? "Completed"      :
    status === "partial"   ? "Partially done" :
                             "Not started";

  const conceptTip = t.total
    ? (
        <Box sx={{ fontSize: 12 }}>
          {t.conceptList.map((c) => (
            <Box key={c.name}>
              {c.ok ? "✅" : "❌"} {c.name}
            </Box>
          ))}
        </Box>
      )
    : "No concepts";

  return (
    <Box
      onClick={onOpen}
      sx={{
        p: 1.2,
        cursor: "pointer",
        bgcolor: bg,
        border: `2px solid ${border}`,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        height: 305,   /* taller to fit extra line(s) */
        transition: "transform .15s",
        "&:hover": { transform: "translateY(-3px)" },
      }}
    >
      {/* header */}
      <Tooltip title={t.subch}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: ".88rem",
            color: meta.color,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            mb: 0.6,
          }}
        >
          {t.subch}
        </Typography>
      </Tooltip>

      {/* status badge */}
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: border }}>
        {badge}
      </Typography>
      {deferred && (
        <Typography sx={{ fontSize: 11, color: "#ccc" }}>
          Deferred to next day
        </Typography>
      )}

      {/* core rows */}
      <Row icon={meta.icon} label={meta.label} bold color={meta.color} />
      <Row icon={ICON_BOOK}    label={t.book} />
      <Row icon={ICON_CHAPTER} label={t.chapter} />
      <Row icon={ICON_CLOCK}   label={`${t.spentMin}/${t.expMin} min`} />

      <Box sx={{ flex: 1 }} />

      {/* progress bar (quizzes only) */}
      {meta.label !== "Read" && (
        <>
          <LinearProgress
            variant="determinate"
            value={t.pct}
            sx={{
              height: 6,
              borderRadius: 2,
              bgcolor: "#333",
              "& .MuiLinearProgress-bar": { bgcolor: meta.color },
            }}
          />
          <Box
            sx={{
              mt: 0.4,
              fontSize: 11,
              display: "flex",
              justifyContent: "space-between",
              color: "#fff",
            }}
          >
            <span>{t.pct}%</span>
            <Tooltip title={conceptTip} arrow>
              <span style={{ cursor: "help", textDecoration: "underline" }}>
                {t.mastered}/{t.total} concepts
              </span>
            </Tooltip>
          </Box>

          {/* attempt section */}
          <Box sx={{ mt: 0.8, fontSize: 11, lineHeight: 1.35 }}>
            <div>
              <strong>Attempts so far:&nbsp;</strong>
              {t.attemptsSoFar.length ? t.attemptsSoFar.join(", ") : "—"}
            </div>
            {t.nextActivity && (
              <div>
                <strong>Next activity:&nbsp;</strong>{t.nextActivity}
              </div>
            )}

            {/* buckets */}
            {t.attBefore.length + t.attToday.length + t.attAfter.length > 0 && (
              <Box sx={{ mt: 0.6 }}>
                <div>
                  <strong>Before:&nbsp;</strong>
                  {t.attBefore.length ? t.attBefore.join(", ") : "—"}
                </div>
                <div>
                  <strong>This day:&nbsp;</strong>
                  {t.attToday.length ? t.attToday.join(", ") : "—"}
                </div>
                <div>
                  <strong>Later:&nbsp;</strong>
                  {t.attAfter.length ? t.attAfter.join(", ") : "—"}
                </div>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

/* ---------- Summary bar ---------- */
function SummaryBar({ tasks }) {
  const total       = tasks.length;
  const completed   = tasks.filter((t) => t.status === "completed").length;
  const spentMin    = tasks.reduce((s, t) => s + t.spentMin, 0);

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1,
        bgcolor: "#262626",
        border: "1px solid #555",
        borderRadius: 2,
        display: "flex",
        justifyContent: "space-between",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span>{completed} / {total} tasks completed</span>
      <span>{spentMin} min spent</span>
    </Box>
  );
}

/* ---------- tiny helper row ---------- */
function Row({ icon, label, bold = false, color = "#fff" }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 0.3 }}>
      <Box sx={{ width: 18, textAlign: "center", mr: 0.6 }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: bold ? 700 : 400,
          color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}