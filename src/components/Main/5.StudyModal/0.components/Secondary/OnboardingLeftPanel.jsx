// File: OnboardingLeftPanel.jsx
// -----------------------------------------------------------------------------
// Same behaviour as before, but the header row
// (hamburger + “Onboarding Plan” label) is gone.
// -----------------------------------------------------------------------------


import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

import {
  Box,
  Typography,
  List,
  ListItemButton,
  Tooltip,
} from "@mui/material";

import LockIcon          from "@mui/icons-material/Lock";
import ViewCarouselIcon  from "@mui/icons-material/ViewCarousel"; // Welcome
import SchoolIcon        from "@mui/icons-material/School";        // Plan Creation
import MenuBookIcon      from "@mui/icons-material/MenuBook";      // Reading + UBT
import QuizIcon          from "@mui/icons-material/Quiz";          // Quiz


/* ═════════════════════ Helper: label + icon mapping ═════════════════════ */

function deriveDisplay(act) {
  const rawType      = (act.type || "").toLowerCase();
  const rawGuideType = (act.guideType || "").toLowerCase();

  if (rawGuideType === "carousel")
    return { label: "Welcome",            icon: <ViewCarouselIcon fontSize="small" sx={{ mr: 0.6 }} /> };
  if (rawGuideType === "onboarding")
    return { label: "Plan Creation",      icon: <SchoolIcon fontSize="small" sx={{ mr: 0.6 }} /> };
  if (rawGuideType === "reading")
    return { label: "Understand Bloom's Taxonomy", icon: <MenuBookIcon fontSize="small" sx={{ mr: 0.6 }} /> };
  if (rawType === "read")
    return { label: "Reading",            icon: <MenuBookIcon fontSize="small" sx={{ mr: 0.6 }} /> };
  if (rawGuideType === "remember")
    return { label: "Quiz",               icon: <QuizIcon fontSize="small" sx={{ mr: 0.6 }} /> };

  return { label: rawGuideType || rawType, icon: null };
}

function getActivityStyle(selected) {
  return selected
      ? { bg: "#9b59b6", fg: "#fff" }   // accentPurple
    : { bg: "#555",    fg: "#fff" };
}


/* ═════════════════════ Layout styles ═══════════════════════════════════ */

const containerSx = {
  height: "100%",
  bgcolor: "#1A1A1A",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};


/* ═════════════════════ Component ═══════════════════════════════════════ */

export default function OnboardingLeftPanel() {
  const dispatch = useDispatch();
  const { planDoc, flattenedActivities, currentIndex, status } = useSelector(
    (state) => state.plan
  );

  if (status !== "succeeded" || !planDoc) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2">No plan loaded yet.</Typography>
      </Box>
    );
  }

  const allActs = flattenedActivities || [];

  return (
    <Box sx={containerSx}>
      {/* ───────────────────────── Step list ────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <List dense sx={{ p: 0 }}>
          {allActs.map((act, idx) => {
            const isSel       = act.flatIndex === currentIndex;
            const { bg, fg }  = getActivityStyle(isSel);
            const { label, icon } = deriveDisplay(act);
            const locked      = (act.aggregatorStatus || "").toLowerCase() === "locked";

            return (
              <Box
                key={idx}
                sx={{
                  position: "relative",
                  mb:       0.8,
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <Tooltip title={label} arrow disableInteractive>
                  <ListItemButton
                    sx={{
                      bgcolor: bg,
                      color:   fg,
                      py:      1,
                      px:      1,
                      "&:hover": { bgcolor: "#444" },
                    }}
                    onClick={() => dispatch(setCurrentIndex(act.flatIndex))}
                  >
                    {/* Step number */}
                    <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", mr: 1 }}>
                      Step&nbsp;{idx + 1}
                    </Typography>

                    {/* Icon + label */}
                    {icon}
                    <Typography
                      noWrap
                      sx={{ fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {label}
                    </Typography>
                  </ListItemButton>
                </Tooltip>

                {/* lock overlay if needed */}
                {locked && (
                  <Box
                    sx={{
                      position:   "absolute",
                      inset:      0,
                      bgcolor:    "rgba(0,0,0,0.4)",
                      display:    "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px",
                      pointerEvents: "none",
                    }}
                  >
                    <LockIcon sx={{ color: "#fff", opacity: 0.8, fontSize: 30 }} />
                  </Box>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
    </Box>
  );
}