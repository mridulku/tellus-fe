/* ────────────────────────────────────────────────────────────────
   File:  src/components/1.SelectionPanel/PlanSelector.jsx
   v5 – progress badge & days-left kept but commented out
───────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  Box, Typography, IconButton, Grid,
  Card, CardContent, Chip, Tooltip
} from "@mui/material";
import AddIcon       from "@mui/icons-material/Add";

import {
  doc, getDoc /* , getFirestore */    // getFirestore no longer needed
} from "firebase/firestore";
import {db} from "../../../../firebase";   // default export = Firestore instance

/* ─── Accent palette & placeholder pools ─────────────────────── */
const ACCENTS  = ["#BB86FC", "#F48FB1", "#80DEEA", "#AED581", "#FFB74D"];
const SUBJECTS = [
  "Physics", "Chemistry", "Biology",
  "Maths", "English", "Reasoning",
  "Reading", "Listening", "Speaking", "Writing"
];
const LEVELS  = ["Mastery", "Revision", "Glance"];
const EMOJIS  = ["📘", "📙", "📗", "📕", "📒"];

const pick = (arr, idx) => arr[idx % arr.length];

/* deterministic helpers so placeholder content is stable */
function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/* fallback meta (name / progress / etc.) – still random for now */
function createMeta(planId) {
  const seed = Math.abs(hashCode(planId));
  const main  = SUBJECTS[seed % SUBJECTS.length];
  const level = LEVELS[(seed >> 3) % LEVELS.length];
  const days  = 10 + Math.floor(seededRand(seed) * 80);          // 10-90
  const mins  = 15 + Math.floor(seededRand(seed + 42) * 10) * 5; // 15-60
  const progress = Math.floor(seededRand(seed + 99) * 100);      // 0-99

  // up to 2 extra subjects
  const others = SUBJECTS
    .filter(s => s !== main)
    .sort((a, b) => hashCode(a + planId) - hashCode(b + planId))
    .slice(0, Math.floor(seededRand(seed + 7) * 3));             // 0-2

  return {
    name     : `${main} ${level} Plan`,
    daysLeft : days,
    dailyMin : mins,
    subjects : [main, ...others],
    progress,
    groupings: [],           // ← will be replaced by real data if available
  };
}

/* ───────────────────────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────────────────────────── */
export default function PlanSelector({
  planIds          = [],
  selectedPlanId   = "",
  onPlanSelect     = () => {},
  onOpenOnboarding = () => {},
}) {
  const [metaMap, setMetaMap] = useState({});

  /* --- fetch real plan docs once ------------------------------------ */
  useEffect(() => {
    if (!planIds.length) return;

    (async () => {
      const m = {};
      await Promise.all(
        planIds.map(async (pid) => {
          m[pid] = createMeta(pid);  // placeholder

          try {
            const snap = await getDoc(doc(db, "adaptive_demo", pid));
            if (!snap.exists()) return;

            const plan = snap.data() || {};

            /* unique grouping list */
            const groupingList = Array.from(
              new Set(
                (plan.subjects || [])
                  .flatMap((s) => s.groupings || [])
              )
            );

            m[pid].groupings = groupingList;
            if (plan.planName)             m[pid].name     = plan.planName;
            if (plan.dailyReadingTimeUsed) m[pid].dailyMin = plan.dailyReadingTimeUsed;
            // daysLeft / progress still placeholder (and now hidden)
          } catch (e) {
            console.warn("PlanSelector: failed to fetch plan", pid, e);
          }
        })
      );
      setMetaMap(m);
    })();
  }, [planIds]);

  /* --- render ------------------------------------------------------- */
  return (
    <Box sx={styles.wrapper}>
           {/* 
      ───────────────────────────────────────────────
      HEADER ROW TEMPORARILY HIDDEN
      (un-comment to restore the “My Plans” title
      and the green “＋” button)
      ───────────────────────────────────────────────
      <Box sx={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          My Plans
        </Typography>
        <IconButton
          size="small"
          sx={{ color: "#4CAF50" }}
          onClick={onOpenOnboarding}
          title="Create / Upload material"
        >
          <AddIcon />
        </IconButton>
      </Box>
      */}

      {/* Content */}
      {planIds.length === 0 ? (
        <Typography sx={{ opacity: 0.8 }}>No plans yet.</Typography>
      ) : (
        <Grid container spacing={1.5}>
          {planIds.map((pid, idx) => {
            const meta = metaMap[pid];
            if (!meta) return null;  // first render

            const accent = pick(ACCENTS, idx);
            const emoji  = pick(EMOJIS,  idx);
            const isSel  = pid === selectedPlanId;

            /* ----- chip display list ---------------------------- */
            const groupings = meta.groupings || [];
            const firstTwo  = groupings.slice(0, 2);
            const extraCnt  = groupings.length - firstTwo.length;
            const extraList = groupings.slice(2);

            return (
              <Grid item xs={12} key={pid}>
                <Card
                  onClick={() => onPlanSelect(pid)}
                  sx={{
                    bgcolor: "#1a1a1a",
                    color: "#fff",
                    cursor: "pointer",
                    border: `2px solid ${isSel ? accent : "#444"}`,
                    "&:hover": { borderColor: accent },
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    {/* Top row (icon + name + progress badge) */}
                    <Box sx={styles.topRow}>
                      <Box sx={{ fontSize: "1.5rem", mr: 1 }}>{emoji}</Box>

                      <Typography
                        sx={styles.nameText}
                        title={meta.name}
                      >
                        {meta.name}
                      </Typography>

                      {/*
                      ── Progress % badge – hidden for now ─────────────
                      <Box
                        sx={{
                          ml: "auto",
                          fontSize: ".8rem",
                          fontWeight: 700,
                          color: accent,
                        }}
                      >
                        {meta.progress}%
                      </Box>
                      ──────────────────────────────────────────────────
                      */}
                    </Box>

                    {/* Subtitle */}
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {/*
                        ⏰ {meta.daysLeft} d ·
                      */}
                      ⏰ {meta.dailyMin} min/day
                    </Typography>

                    {/* Chip row – real groupings */}
                    {groupings.length > 0 && (
                      <Box sx={styles.chipRow}>
                        {firstTwo.map((g) => (
                          <Chip
                            key={g}
                            size="small"
                            label={g}
                            sx={styles.chip}
                          />
                        ))}

                        {extraCnt > 0 && (
                          <Tooltip title={extraList.join(", ")}>
                            <Chip
                              size="small"
                              label={`+${extraCnt}`}
                              sx={styles.chip}
                            />
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

/* ───────────────────────────────────────────────────────────────
   Styles (unchanged)
──────────────────────────────────────────────────────────────── */
const styles = {
  wrapper: {
    height: "100%",
    p: 1.8,
    boxSizing: "border-box",
    color: "#fff",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 2,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    mb: 0.5,
  },
  nameText: {
    fontWeight: "bold",
    fontSize: ".9rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "70%",
  },
  chipRow: {
    mt: 0.8,
    display: "flex",
    flexWrap: "wrap",
    gap: 0.5,
  },
  chip: {
    bgcolor: "#333",
    color: "#fff",
    fontSize: 11,
    height: 20,
  },
};