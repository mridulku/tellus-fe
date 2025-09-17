/* ────────────────────────────────────────────────────────────────
   File:  src/components/GuideCarousel.jsx          (a.k.a. “Your
          plan is ready” summary slide)                         
   • Pure presentational – give it a `planDoc` prop or it falls  
     back to MOCK_PLAN (handy for Storybook / local testing)     
   • No Redux imports from parents; mount / un-mount anywhere    
───────────────────────────────────────────────────────────────── */
import React from "react";

import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import {
  /* fetchPlan,   ⟵  ❌  no longer needed here */
  setCurrentIndex,
} from "../../../../../../../store/planSlice";   // ← adjust the path if needed

import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Button,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import QuizIcon from "@mui/icons-material/Quiz";

/* ───────────────────────────  visual constants  ────────────────────────── */
const ACCENT  = "#BB86FC";
const OFF_BG  = "rgba(255,255,255,.08)";   /* card border */
const OFF_BOX = "rgba(255,255,255,.06)";   /* inner paper */

const EMOJI = { physics: "🔭", chemistry: "⚗️", biology: "🧬" };

/* ───────────────────────────  local mock (delete in prod)  ─────────────── */
const MOCK_PLAN = {
  level: "mastery",
  wpmUsed: 200,
  dailyReadingTimeUsed: 30,
  quizTime: 1, // 1 min × concept
  selectedChapters: [
    { id: "c1", title: "Mechanics", subject: "physics", grouping: "Mechanics" },
    { id: "c2", title: "Optics",    subject: "physics", grouping: "Optics" },
    { id: "c3", title: "Thermo",    subject: "physics", grouping: "Thermodynamics" },
    { id: "c4", title: "Organic",   subject: "chemistry", grouping: "Organic" },
    { id: "c5", title: "Botany",    subject: "biology",   grouping: "Botany" },
  ],
  sessions: [
    {
      sessionLabel: "1",
      activities: [
        { type: "READ", subChapterName: "1 · Kinematics", timeNeeded: 10 },
        { type: "QUIZ", quizStage: "remember", subChapterName: "1 · Kinematics", timeNeeded: 1 },
      ],
    },
    {
      sessionLabel: "2",
      activities: [
        { type: "READ", subChapterName: "2 · Dynamics", timeNeeded: 12 },
        { type: "QUIZ", quizStage: "remember", subChapterName: "2 · Dynamics", timeNeeded: 1 },
      ],
    },
    {
      sessionLabel: "3",
      activities: [
        { type: "READ", subChapterName: "Thermo Intro", timeNeeded: 8 },
        { type: "QUIZ", quizStage: "remember", subChapterName: "Thermo Intro", timeNeeded: 1 },
      ],
    },
  ],
};

/* ───────────────────────────  helper: subject/group map  ──────────────── */
function groupSubjGrp(chapters = []) {
  const out = {};
  chapters.forEach((c) => {
    const subj = (c.subject || "unknown").toLowerCase();
    const grp  = c.grouping || "Other";
    (out[subj]      = out[subj] || {});
    (out[subj][grp] = true);
  });
  return out;
}

/* ════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════════════════ */
export default function SuccessPlanCreation({ planDoc = MOCK_PLAN, onClose = () => {} }) {
  /* ── de-structure props with safe defaults ── */
  const {
    level               = "–",
    wpmUsed             = 200,
    dailyReadingTimeUsed= 30,
    quizTime            = 1,
    selectedChapters    = [],
    sessions            = [],
  } = planDoc;

  /* ── redux handles ── */
  const dispatch     = useDispatch();
  const userId       = useSelector((s) => s.auth?.userId);
  const planId       = useSelector((s) => s.plan?.planDoc?.id);
  const currentIndex = useSelector((s) => s.plan?.currentIndex);

  /* ── advance to next activity (without re-loading the new plan) ── */
  async function handleStart() {
    const oldIndex = currentIndex;
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`,
        {
          userId,
          planId,
          activityId: "GUIDE_CAROUSEL_ID", // placeholder — replace with real ID if you track this slide
          completionStatus: "complete",
        }
      );

      /* ------------------------------------------------------------------
       *  ⚠️  IMPORTANT  ⚠️
       *  We **do not** dispatch fetchPlan() here any more.
       *  That call was pushing the newly-created plan into the global
       *  plan slice while the study modal is still mounted, which made the
       *  player auto-start.  All we really want is to finish the wizard
       *  and let the parent decide what to do next.
       * ------------------------------------------------------------------ */

      dispatch(setCurrentIndex(oldIndex + 1));  // advance local guide index
    } catch (err) {
      console.error("Error finishing carousel guide:", err);
      dispatch(setCurrentIndex(oldIndex + 1));
    }

    /* optional callback supplied by parent */
    typeof onClose === "function" && onClose();
  }

  const subjGrp = groupSubjGrp(selectedChapters);

  /* ─────────────────────  small sub-components  ───────────────────── */

  /* Assumptions row */
  const MetricsRow = () => (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
      <Tooltip title="Reading time for any sub-chapter = words ÷ WPM">
        <Chip
          icon={<MenuBookIcon sx={{ color: "#000" }} />}
          label={`Reading ≈ words ÷ ${wpmUsed}`}
          sx={{ bgcolor: ACCENT, "& .MuiChip-label": { fontWeight: 500, color: "#000" } }}
        />
      </Tooltip>

      <Tooltip title="Max minutes we’ll schedule for you per day">
        <Chip
          icon={<AccessTimeIcon sx={{ color: "#000" }} />}
          label={`Daily budget ${dailyReadingTimeUsed} m`}
          sx={{ bgcolor: ACCENT, "& .MuiChip-label": { fontWeight: 500, color: "#000" } }}
        />
      </Tooltip>

      <Tooltip title="Each concept quiz is budgeted at this many minutes">
        <Chip
          icon={<QuizIcon sx={{ color: "#000" }} />}
          label={`Quiz ${quizTime} m × concept`}
          sx={{ bgcolor: ACCENT, "& .MuiChip-label": { fontWeight: 500, color: "#000" } }}
        />
      </Tooltip>
    </Box>
  );

  /* Topics block */
  const TopicsCovered = () => {
    const flatPieces = Object.entries(subjGrp).map(([subj, groups]) => {
      const grpLabels = Object.keys(groups).join(" • ");
      return `${EMOJI[subj] || "📘"} ${subj[0].toUpperCase() + subj.slice(1)}: ${grpLabels}`;
    });
    const flatText = flatPieces.join("  |  ");

    /* one-liner version */
    if (flatText.length <= 110)
      return (
        <Typography variant="body2" sx={{ color: "#ccc", fontWeight: 500, mb: 2, lineHeight: 1.4 }}>
          {flatText}
        </Typography>
      );

    /* fallback chip list */
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
        {Object.entries(subjGrp).map(([subj, groups]) => (
          <Box key={subj} sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontWeight: "bold", textTransform: "capitalize" }}>
              {EMOJI[subj] || "📘"} {subj}
            </Typography>
            {Object.keys(groups).map((g) => (
              <Chip
                key={g}
                label={g}
                size="small"
                sx={{ bgcolor: ACCENT, "& .MuiChip-label": { fontWeight: 500, color: "#000" } }}
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  };

  /* Sessions preview (first 3 days) */
  const SessionsPreview = () => {
    const META = {
      READ: {
        chip: "Read",
        icon: <MenuBookIcon sx={{ fontSize: 16, color: "#000" }} />,
        color: "#4FC3F7",
      },
      QUIZ: {
        chip: (a) => `${a.quizStage?.charAt(0).toUpperCase() + a.quizStage?.slice(1)} Quiz`,
        icon: <QuizIcon sx={{ fontSize: 16, color: "#000" }} />,
        color: "#FFD54F",
      },
    };

    const ActivityRow = (a, idx) => {
      const m = META[a.type] || {};
      const chipLabel = typeof m.chip === "function" ? m.chip(a) : m.chip;

      return (
        <Box
          key={idx}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            mb: 0.6,
            overflow: "hidden",
          }}
        >
          <Chip
            icon={m.icon}
            label={chipLabel}
            size="small"
            sx={{
              bgcolor: m.color || ACCENT,
              "& .MuiChip-label": { color: "#000", fontWeight: 600 },
            }}
          />

          <Typography
            variant="body2"
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 460,
              color: "#ddd",
            }}
            title={a.subChapterName}
          >
            {a.subChapterName}
          </Typography>
        </Box>
      );
    };

    return (
      <Paper variant="outlined" sx={{ bgcolor: OFF_BOX, p: 2 }}>
        <Typography sx={{ fontWeight: "bold", mb: 1, color: "#fff" }}>
          First&nbsp;3&nbsp;days at a glance
        </Typography>

        {sessions.slice(0, 3).map((s) => {
          const acts   = s.activities || [];
          const preview= acts.slice(0, 3);
          const extra  = acts.length - preview.length;

          return (
            <Box key={s.sessionLabel} sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: "#fff", mb: 0.5 }}>
                Day&nbsp;{s.sessionLabel}
              </Typography>

              {preview.map(ActivityRow)}

              {extra > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Chip
                    icon={<MoreHorizIcon sx={{ fontSize: 16, color: "#fff" }} />}
                    label={`+${extra} more`}
                    size="small"
                    sx={{
                      bgcolor: "#333",
                      "& .MuiChip-label": { color: "#fff", fontWeight: 500 },
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}

        {sessions.length > 3 && (
          <Typography variant="caption" sx={{ color: "#aaa" }}>
            …plus {sessions.length - 3} more day(s)
          </Typography>
        )}
      </Paper>
    );
  };

  /* ─────────────────────  render  ───────────────────── */
  return (
    <Box
      sx={{
        maxWidth: 820,
        mx: "auto",
        my: 4,
        p: 4,
        bgcolor: "#000",
        color: "#fff",
        border: `1px solid ${OFF_BG}`,
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0,0,0,0.45)",
      }}
    >
      {/* header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <CheckCircleIcon sx={{ color: ACCENT, fontSize: 30 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: "bold", lineHeight: 1.1 }}>
            Your plan is ready!
          </Typography>
          <Typography variant="body2" sx={{ color: "#bbb" }}>
            We made the following assumptions to craft it ↴
          </Typography>
        </Box>
      </Box>

      {/* assumptions */}
      <MetricsRow />
      <Divider sx={{ mb: 2, bgcolor: "#333" }} />

      {/* topics */}
      <Typography sx={{ fontWeight: "bold", mb: 0.5 }}>Topics covered</Typography>
      <TopicsCovered />
      <Divider sx={{ mb: 2, bgcolor: "#333" }} />

      {/* sessions preview */}
      <SessionsPreview />

      {/* CTA */}
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Button
          variant="contained"
          sx={{ bgcolor: ACCENT, fontWeight: "bold" }}
          onClick={handleStart}
        >
          Start learning
        </Button>
      </Box>
    </Box>
  );
}