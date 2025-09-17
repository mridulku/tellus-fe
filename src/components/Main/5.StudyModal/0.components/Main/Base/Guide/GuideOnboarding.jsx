/* ────────────────────────────────────────────────────────────────
   File:  src/components/GuideOnboarding.jsx
   Purpose:
     • Pick subjects → groups (tied to chapter selection behind the scenes)
     • Pick target date, daily minutes, mastery level
     • POST to PLAN_ENDPOINT to generate an adaptive plan
───────────────────────────────────────────────────────────────── */

import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import SuccessPlanCreation from "./SuccessPlanCreation";

import LockIcon from "@mui/icons-material/Lock";
import Loader from "./Loader";

import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress  ,
  Chip,
  Button,
  Grid,
  Paper,
  Slider,
  Stack,
  TextField,
  Tooltip,
  IconButton,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";

import CalendarMonthIcon        from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon           from "@mui/icons-material/AccessTime";
import AssignmentTurnedInIcon   from "@mui/icons-material/AssignmentTurnedIn";
import InfoIcon                 from "@mui/icons-material/Info";

/* ════════════════════════════════════════════════════════════════
   0.  CONSTANTS / STYLES
═════════════════════════════════════════════════════════════════ */
const ACCENT  = "#BB86FC";               // primary purple accent
const OFF_BG  = "rgba(255,255,255,.08)"; // muted card bg

/* emojis for subject headers (optional) */
const EMOJI = {
  physics:   "🔭",
  chemistry: "⚗️",
  biology:   "🧬",
};

/* ── which buckets the learner can click ─────────────── */
/* Keys = subject (lower-case).  Values = array of group labels.  */
const ALLOWED_GROUPS = {
  biology:   ["Human Physiology", "Plant Physiology", "Genetics & Evolution"],
  physics:   ["Mechanics", "Optics"],
  chemistry: ["Organic Chemistry - Basic", "Physical Chemistry"],
};

/* ════════════════════════════════════════════════════════════════
   1.  COMPONENT
═════════════════════════════════════════════════════════════════ */
export default function GuideOnboarding() {
  /* ───── Redux selectors ───── */
  const userId   = useSelector((s) => s.auth?.userId);
  const examType = useSelector((s) => s.exam?.examType);

  /* ───── Wizard state (step switch) ───── */
  const [step, setStep] = useState(0);               // 0: topics, 1: goal/minutes

  /* ───── BookId lookup (Firestore read) ───── */
  const [bookId,   setBookId]   = useState(null);
  const [bookErr,  setBookErr]  = useState(null);
  const [loadingBook, setLB]    = useState(false);

  const [planDoc,  setPlanDoc]  = useState(null);    // ← new

  

  useEffect(() => {
    if (!userId || !examType) return;

    (async () => {
      setLB(true); setBookErr(null);
      try {
        const { doc, getDoc, updateDoc } = await import("firebase/firestore");
        const firebase        = await import("../../../../../../../firebase");

        const snap = await getDoc(doc(firebase.db, "users", userId));
        if (!snap.exists()) throw new Error("User doc not found");

        const fieldMap = {
          NEET:  "clonedNeetBook",
          TOEFL: "clonedToeflBooks",
        };

        const entry = snap.data()[fieldMap[(examType || "").toUpperCase()]];
        const id =
          Array.isArray(entry) ? entry?.[0]?.newBookId : entry?.newBookId;

        if (!id) throw new Error("newBookId missing");
        setBookId(id);
      } catch (e) {
        setBookErr(typeof e === "string" ? e : e.message);
      } finally {
        setLB(false);
      }
    })();
  }, [userId, examType]);

  /* ───── Chapter list (API fetch) ───── */
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  const [chapters, setChapters]   = useState([]);     // [{ id, title, subject, grouping, selected }]
  const [chapErr, setChapErr]     = useState(null);
  const [loadingCh, setLoadingCh] = useState(false);
  const [topicErr, setTopicErr] = useState(null);





  useEffect(() => {
    if (!userId || !bookId) return;

    (async () => {
      setLoadingCh(true); setChapErr(null);
      try {
        const res  = await axios.get(`${backendURL}/api/process-book-data`, {
          params: { userId, bookId },
        });
        const list = res.data?.chapters ?? [];

         const cooked = list.map((c) => ({
             id:        c.id,
             title:     c.name,
             subject:   c.subject  || "Unknown",
             grouping:  c.grouping || "Other",
             selected:  false,         // ← default OFF ✅
             isLocked: !ALLOWED_GROUPS[(c.subject || "").toLowerCase()]
                     ?.includes(c.grouping),   // true ⟹ locked
           }));

        setChapters(cooked);
      } catch (e) {
        setChapErr(typeof e === "string" ? e : e.message);
      } finally {
        setLoadingCh(false);
      }
    })();
  }, [userId, bookId, backendURL]);

  /* ───── Subject → Group lookup (memoised) ───── */
  const subjectsMap = useMemo(() => {
    const map = {};
    chapters.forEach((c, idx) => {
      const subj = c.subject;
      const grp  = c.grouping;
      (map[subj]      = map[subj] || {});
      (map[subj][grp] = map[subj][grp] || []).push(idx);
    });
    return map;
  }, [chapters]);

  /* ───── Plan-option local state ───── */
  const [targetDate,       setTargetDate]       = useState("");
  const [dailyMinutes,     setDailyMinutes]     = useState(30);
  const [masteryLevel]     = useState("mastery"); // mastery | revision | glance

  /* ───── Goal cards state (fresh / brush / diagnose) ───── */
  const [goal, setGoal] = useState("fresh");

  /* ───── Generate-plan call state ───── */
  const [creating, setCreating] = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [genErr,   setGenErr]   = useState(null);

  const [fakePct, setFakePct] = useState(0);   // visual progress 0–100

  // ⬇︎  drop this useEffect block anywhere in the component
useEffect(() => {
  if (!creating) {                     // request finished → reset
    setFakePct(0);
    return;
  }

  /* every 400 ms add 3 %   ( ≈ 13 s to reach 100 ) */
  const id = setInterval(() => {
    setFakePct((p) => (p >= 97 ? 97 : p + 3));   // never show 100 %
  }, 400);

  return () => clearInterval(id);      // cleanup on un-mount / done
}, [creating]);

  const PLAN_ENDPOINT =
    "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";

  /* ════════════════════════════════════════════════════════════
       Helper: build request body from current selections
  ════════════════════════════════════════════════════════════ */
  function buildBody() {
      /* derive selected-chapter IDs */
      const selected = chapters.filter((c) => c.selected);
      const chapterIds =
        selected.length === chapters.length ? null : selected.map((c) => c.id);
    
      /* derive quiz / revise minutes from mastery level */
      const qrMap = { mastery: 5, revision: 3, glance: 1 };
      const qr    = qrMap[masteryLevel] ?? 1;
    
      /* generate a default target date = today + 6 months */
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      const targetDateISO = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    
      return {
        userId,
        bookId,
        targetDate: targetDateISO,           // always present
        dailyReadingTime: dailyMinutes,
        planType: masteryLevel,
        quizTime: qr,
        reviseTime: qr,
        ...(chapterIds ? { selectedChapters: chapterIds } : {}),
      };
    }

  async function handleGenerate() {
    if (!bookId) return;
    if (!chapters.some((c) => c.selected)) {
      setGenErr("Please keep at least one chapter selected.");
      return;
    }

    setCreating(true); setSuccess(false); setGenErr(null);
    try {
      const { data } = await axios.post(PLAN_ENDPOINT, buildBody(), {
        headers: { "Content-Type": "application/json" },
      });
      setPlanDoc(data?.planDoc || null);             // ← save it
      setSuccess(true);


         /* ★★★  mark the learner as onboarded  ★★★ */
   {
     const { doc, setDoc } = await import("firebase/firestore");
     const firebase        = await import("../../../../../../../firebase");

     await setDoc(
       doc(firebase.db, "learnerPersonas", userId),   // ← correct collection
       { isOnboarded: true },                         //  simple flat field
       { merge: true }                                //  keep existing data
     );
   }




    } catch (e) {
      const msg = e.response?.data?.error ||
                  e.response?.data?.message ||
                  e.message;
      setGenErr(msg);
    } finally {
      setCreating(false);
    }
  }

  /* ════════════════════════════════════════════════════════════
       UI BUILDERS
  ════════════════════════════════════════════════════════════ */

  /* -- GoalCard subcomponent ----------------------------------- */
  function GoalCard({ id, emoji, title, desc, disabled = false }) {
    const active = goal === id;
    return (
      <Paper
      onClick={() => !disabled && setGoal(id)}      // ignore clicks when disabled
        elevation={0}
        sx={{
          p: 2,
          flex: 1,
          cursor: "pointer",
          bgcolor: disabled
          ? "rgba(255,255,255,.12)"
          : active
            ? ACCENT
            : OFF_BG,
          color: active ? "#000" : "#fff",
          border: `1px solid ${active ? ACCENT : "#666"}`,
          transition: ".2s",
          "&:hover": { borderColor: ACCENT },
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "1.8rem" }}>{emoji}</Typography>
        <Typography sx={{ fontWeight: "bold" }}>{title}</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          {desc}
        </Typography>
      </Paper>
    );
  }

  /* -- STEP 0  : subject → group picker ------------------------ */
  const StepTopics = (
    <>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 3 }}>
        1&nbsp;&nbsp;Pick the areas you’d like to cover
      </Typography>

      {Object.entries(subjectsMap).map(([subj, groups]) => (
        <Box key={subj} sx={{ mb: 3 }}>
          {/* subject header */}
          <Typography
            sx={{
              fontWeight: "bold",
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              textTransform: "capitalize",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>
              {EMOJI[subj.toLowerCase()] || "📘"}
            </span>
            {subj}
          </Typography>

          {/* group chips */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {Object.entries(groups).map(([grpLabel, idxArr]) => {
              const allOn = idxArr.every((i) => chapters[i].selected);

              function toggleGroup() {
                  if (locked) return;              // <- early-exit
  setChapters((prev) =>
                  prev.map((c, i) =>
                    idxArr.includes(i)
                      ? { ...c, selected: !allOn }
                      : c
                  )
                );
              }

              const locked = chapters[idxArr[0]].isLocked;   // any one entry works


              return (
  <Chip
    key={grpLabel}
    label={grpLabel}
    icon={locked ? <LockIcon sx={{ fontSize: 14 }} /> : undefined}
    onClick={locked ? undefined : toggleGroup}
    disabled={locked}
    variant={allOn && !locked ? "filled" : "outlined"}
    sx={{
      cursor: locked ? "not-allowed" : "pointer",
      bgcolor: allOn && !locked ? ACCENT : "transparent",
      borderColor: locked ? "#555" : ACCENT,
      "& .MuiChip-label": {
        color: locked ? "#777" : allOn ? "#000" : "#fff",
        fontStyle: locked ? "italic" : "normal",
      },
    }}
  />
);
            })}
          </Box>
        </Box>
      ))}

      {/* nav button */}
      <Box sx={{ textAlign: "right", mt: 4 }}>
        <Button
          variant="contained"
          sx={{ bgcolor: ACCENT, fontWeight: "bold" }}
           onClick={() => {
              if (chapters.some(c => c.selected && !c.isLocked)) {
                 setTopicErr(null);
                 setStep(1);
               } else {
                 setTopicErr("Please select at least one unit before continuing.");
               }
             }}
        >
          Next
        </Button>
      </Box>
    </>
  );

  /* -- STEP 1 : goal & daily minutes --------------------------- */
  const StepGoal = (
    <>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        2&nbsp;&nbsp;Set your goal & daily budget
      </Typography>

      {/* goal cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <GoalCard
            id="fresh"
            emoji="📚"
            title="Start fresh"
            desc="Cover everything from scratch"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GoalCard
            id="brush"
            emoji="📝"
            title="Quick brush-up"
            desc="(coming soon)"
            disabled
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <GoalCard
            id="diagnose"
            emoji="❓"
            title="Not sure – diagnose me"
            desc="(coming soon)"
            disabled
          />
        </Grid>
      </Grid>

      {/* minutes slider */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Daily study budget
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Slider
          min={5}
          max={120}
          step={5}
          value={dailyMinutes}
          onChange={(_, v) => setDailyMinutes(v)}
          sx={{ flex: 1, color: ACCENT }}
        />
        <Typography sx={{ width: 60, textAlign: "right" }}>
          {dailyMinutes} m
        </Typography>
      </Box>

      {/* mastery radio */}
      

      {/* nav */}
      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => setStep(0)}
          sx={{ borderColor: ACCENT, color: "#fff" }}
        >
          Back
        </Button>
        <Button
          variant="contained"
          disabled={creating || !bookId || loadingBook || loadingCh}
          sx={{ bgcolor: ACCENT, fontWeight: "bold" }}
          onClick={handleGenerate}
        >
           {creating ? (
     <Box sx={{ width: "100%" }}>
       <LinearProgress
         variant="determinate"
         value={fakePct}
         sx={{
           "& .MuiLinearProgress-bar": { transition: "transform 0.4s linear" },
           height: 6, borderRadius: 3, bgcolor: "#664bb0"
         }}
       />
       <Typography
         variant="caption"
         sx={{ mt: 0.5, display: "block", color: "#eee" }}
       >
         Generating plan… {fakePct}%
       </Typography>
   </Box>
 ) : (
   "Generate Plan"
 )}
        </Button>
      </Stack>

      
      {genErr && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {genErr}
        </Alert>
      )}
    </>
  );

  /* ════════════════════════════════════════════════════════════
       RENDER WRAPPER
  ════════════════════════════════════════════════════════════ */
 

    /* 1️⃣  Early-exit while we are still fetching ----------------- */
  if (loadingBook || loadingCh) {
    return (
      <Box
        sx={{
          maxWidth: 760,
          mx: "auto",
          my: 8,
          textAlign: "center",
          color: "#fff",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold", mb: 4 }}>
         {examType ? `${examType} Plan Setup` : "Loading…"}
        </Typography>

        <Loader
          type="bar"
          accent={ACCENT}
          fullScreen={false}
          message={
            loadingBook
              ? "Fetching your cloned book…"
              : "Loading chapter metadata…"
          }
        />
      </Box>
    );
  }

  /* 2️⃣  Normal wizard once everything is ready ---------------- */
  if (success) {
    return (
      <SuccessPlanCreation
        planDoc={planDoc}
        onClose={() => setSuccess(false)}
      />
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 760,
        mx: "auto",
        my: 4,
        px: 3,
        py: 4,
        bgcolor: "#000",
        color: "#fff",
        border: `1px solid ${OFF_BG}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        {examType} Plan Setup
      </Typography>
      {bookErr && <Alert severity="error" sx={{ mb: 2 }}>{bookErr}</Alert>}
      {chapErr && <Alert severity="error" sx={{ mb: 2 }}>{chapErr}</Alert>}

      {step === 0 ? StepTopics : StepGoal}
    </Box>
  );
 }