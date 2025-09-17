// src/components/HIDDIT/PlanRender.jsx

import React from "react";
import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import QuizIcon from "@mui/icons-material/Quiz";
import RepeatIcon from "@mui/icons-material/Repeat";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import InfoIcon from "@mui/icons-material/Info";

// (Optional) We can remove PlanFetcher import entirely if it's unused:
// import PlanFetcher from "../../PlanFetcher"; // Adjust path if needed

/**
 * PlanRender
 * Step 2: Show final plan data, let user confirm.
 *
 * Props:
 *  - isCreatingPlan (bool)
 *  - isFetchingPlan (bool)
 *  - serverError (string or null)
 *  - serverPlan (object or null)
 *  - aggregated (object or null)
 *  - planSummary (object) => { feasible, reason, etc. }
 */
export default function PlanRender({
  isCreatingPlan,
  isFetchingPlan,
  serverError,
  serverPlan,
  aggregated,
  planSummary,
}) {
  function formatTimestamp(ts) {
    if (!ts) return "N/A";
    if (typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    }
    if (ts._seconds) {
      const millis = ts._seconds * 1000;
      return new Date(millis).toLocaleString();
    }
    return String(ts);
  }

  return (
    <Box sx={{ color: "#fff" }}>
      {(isCreatingPlan || isFetchingPlan) && (
        <Box textAlign="center" mb={2}>
          <CircularProgress sx={{ color: "#B39DDB" }} />
          <Typography variant="body2" sx={{ mt: 1, color: "#fff" }}>
            {isCreatingPlan
              ? "Creating plan on backend..."
              : "Fetching plan from server..."}
          </Typography>
        </Box>
      )}

      {serverError && (
        <Typography variant="body1" sx={{ color: "#f44336" }}>
          {serverError}
        </Typography>
      )}

      {serverPlan && aggregated && !isFetchingPlan && !isCreatingPlan && (
        <>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", textAlign: "center", color: "#fff" }}
          >
            Your Plan is Ready!
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: "center", fontStyle: "italic", color: "#ccc" }}
          >
            Plan ID: {serverPlan.id}
          </Typography>

          <Box
            display="flex"
            flexWrap="wrap"
            justifyContent="center"
            gap={2}
            mt={2}
          >
            <InfoCard
              icon={<CalendarMonthIcon sx={{ fontSize: "2rem" }} />}
              label="Target Date"
              value={serverPlan.targetDate || "N/A"}
            />
            <InfoCard
              icon={<AssignmentTurnedInIcon sx={{ fontSize: "2rem" }} />}
              label="Mastery Level"
              value={serverPlan.level || "N/A"}
            />
            <InfoCard
              icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
              label="Unique Chapters"
              value={aggregated.uniqueChapterCount}
            />
            <InfoCard
              icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
              label="Unique SubChapters"
              value={aggregated.uniqueSubChapterCount}
            />
            <InfoCard
              icon={<AccessTimeIcon sx={{ fontSize: "2rem" }} />}
              label="Total Plan Time"
              value={`${aggregated.totalPlanTime} min`}
            />
            <InfoCard
              icon={<AutoStoriesIcon sx={{ fontSize: "2rem" }} />}
              label="Reading"
              value={`${aggregated.readTime} min`}
            />
            <InfoCard
              icon={<QuizIcon sx={{ fontSize: "2rem" }} />}
              label="Quiz"
              value={`${aggregated.quizTime} min`}
            />
            <InfoCard
              icon={<RepeatIcon sx={{ fontSize: "2rem" }} />}
              label="Revise"
              value={`${aggregated.reviseTime} min`}
            />
            <InfoCard
              icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
              label="Created At"
              value={formatTimestamp(serverPlan.createdAt)}
            />
          </Box>

          <Box textAlign="center" mt={3}>
            {planSummary.feasible ? (
              <Typography sx={{ color: "#4caf50", fontWeight: "bold" }}>
                Your plan seems feasible!
              </Typography>
            ) : (
              <Typography sx={{ color: "#f44336", fontWeight: "bold" }}>
                This plan may not be feasible. {planSummary.reason}
              </Typography>
            )}
          </Box>

          {/* No PlanFetcher usage here => let parent handle opening the new Redux-based plan view. */}
        </>
      )}

      {!isCreatingPlan &&
        !isFetchingPlan &&
        !serverError &&
        !serverPlan && (
          <Typography variant="body2" fontStyle="italic" sx={{ color: "#ccc" }}>
            No plan data available.
          </Typography>
        )}
    </Box>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <Paper
      elevation={3}
      sx={{
        width: 170,
        height: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 1,
        backgroundColor: "#2e2e2e",
        color: "#fff",
      }}
    >
      <Box textAlign="center" mb={1} sx={{ color: "#B39DDB" }}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Paper>
  );
}