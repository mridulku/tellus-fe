import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Tooltip,
  IconButton
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import InfoIcon from "@mui/icons-material/Info";

/**
 * DemoDayChapterTimeline
 * ----------------------
 * A dummy UI that shows:
 *  - 2 or 3 "days" (sessions)
 *  - Each day has 1-2 "chapters"
 *  - Each chapter has sub-chapters
 *  - Each sub-chapter has a mini timeline (e.g. [Read] -> [Understand] -> [Apply] -> [Analyze])
 *    Some steps might be "done," some "in progress," some "not started."
 *  - On hover, we show a tooltip with dummy date/time or explanation
 *
 * All displayed in a dark background with card-based layout.
 */
export default function DemoDayChapterTimeline() {
  // Example data: 2 days, each day has chapters, each chapter has subChaps
  // each subChap has an array of stage states.
  const [days] = useState([
    {
      dayId: "1",
      dayName: "Day 1 (Today)",
      chapters: [
        {
          chapterId: "C1",
          chapterName: "Chapter 1: Introduction",
          subChapters: [
            {
              subChapterId: "SC101",
              subChapterName: "Basics of Motion",
              stages: [
                { label: "Read", done: true, doneDate: "2025-03-10", tooltip: "Reading completed" },
                { label: "Understand", done: true, doneDate: "2025-03-11", tooltip: "Concept quiz passed" },
                { label: "Apply", done: false, tooltip: "Scenario tasks not yet done" },
                { label: "Analyze", done: false, tooltip: "Higher-level tasks locked" }
              ],
            },
            {
              subChapterId: "SC102",
              subChapterName: "Reference Frames",
              stages: [
                { label: "Read", done: true, doneDate: "2025-03-10", tooltip: "Reading completed" },
                { label: "Understand", done: false, tooltip: "Awaiting conceptual quiz" },
                { label: "Apply", done: false },
                { label: "Analyze", done: false }
              ],
            },
          ],
        },
        {
          chapterId: "C2",
          chapterName: "Chapter 2: Fundamental Forces",
          subChapters: [
            {
              subChapterId: "SC201",
              subChapterName: "Gravity Basics",
              stages: [
                { label: "Read", done: false },
                { label: "Understand", done: false },
                { label: "Apply", done: false },
                { label: "Analyze", done: false },
              ],
            },
          ],
        },
      ],
    },
    {
      dayId: "2",
      dayName: "Day 2 (Tomorrow)",
      chapters: [
        {
          chapterId: "C3",
          chapterName: "Chapter 5: Energy",
          subChapters: [
            {
              subChapterId: "SC501",
              subChapterName: "Kinetic & Potential",
              stages: [
                { label: "Read", done: true, doneDate: "2025-03-11" },
                { label: "Understand", done: true, doneDate: "2025-03-11" },
                { label: "Apply", done: true, doneDate: "2025-03-12" },
                { label: "Analyze", done: false, tooltip: "Try advanced tasks" },
              ],
            },
          ],
        },
      ],
    },
  ]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 3,
        background: "linear-gradient(135deg, #121212 0%, #1c1c1c 100%)",
      }}
    >
      <Typography variant="h5" sx={{ color: "#fff", mb: 3, fontWeight: "bold" }}>
        Demo: Day-by-Day Plan with Mini Timeline
      </Typography>

      <Grid container spacing={3}>
        {days.map((day) => (
          <Grid item xs={12} key={day.dayId}>
            <Card
              sx={{
                backgroundColor: "#1e1e1e",
                borderRadius: 2,
                border: "1px solid #333",
              }}
            >
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: "bold", color: "#fff", mb: 1 }}
                >
                  {day.dayName}
                </Typography>

                {/* For each chapter in this day */}
                {day.chapters.map((chap) => (
                  <ChapterCard
                    key={chap.chapterId}
                    chapter={chap}
                  />
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// A component for each chapter's sub-chapters
function ChapterCard({ chapter }) {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #444",
        borderRadius: 2,
        backgroundColor: "#2c2c2c",
        mb: 2,
      }}
    >
      <Typography variant="body1" sx={{ fontWeight: "bold", color: "#fff", mb: 1 }}>
        {chapter.chapterName}
      </Typography>

      {chapter.subChapters.map((sub) => (
        <SubChapterRow key={sub.subChapterId} subChapter={sub} />
      ))}
    </Box>
  );
}

// Sub-chapter row that shows the mini timeline for each stage
function SubChapterRow({ subChapter }) {
  const { subChapterName, stages } = subChapter;

  // We can display the sub-chapter name, then a horizontal mini timeline
  return (
    <Box
      sx={{
        backgroundColor: "#3d3d3d",
        border: "1px solid #555",
        borderRadius: 2,
        p: 1.5,
        mb: 1,
      }}
    >
      <Typography variant="body2" sx={{ color: "#fff", fontWeight: "bold", mb: 1 }}>
        {subChapterName}
      </Typography>

      {/* The timeline: a horizontal row of stage "dots" with lines in between */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {stages.map((stage, index) => {
          // if done => check icon, else empty circle
          const IconComp = stage.done ? CheckCircleIcon : RadioButtonUncheckedIcon;

          return (
            <React.Fragment key={`${subChapter.subChapterId}-${stage.label}`}>
              {/* Stage Dot */}
              <Tooltip
                arrow
                title={
                  <div style={{ color: "#fff" }}>
                    <strong>{stage.label}</strong>
                    <br />
                    {stage.done ? (stage.doneDate ? `Done on ${stage.doneDate}` : "Completed") : "Not done"}
                    <br />
                    {stage.tooltip || ""}
                  </div>
                }
              >
                <Box
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: stage.done ? "#FFD700" : "#888",
                  }}
                  onClick={() => {
                    // We can handle the click if we want to open a details popup or fetch data
                    console.log("Clicked stage:", stage.label, "done?", stage.done);
                  }}
                >
                  <IconComp sx={{ fontSize: 20 }} />
                </Box>
              </Tooltip>

              {/* if not last item => line in between */}
              {index < stages.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: "2px",
                    backgroundColor: "#888",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </Box>
  );
}