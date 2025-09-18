import React, { useMemo, useState, useEffect } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import InstructionsRail from "./InstructionsRail";

// Task UIs
import SFTPrompt from "./tasks/SFTPrompt";
import SFTQAPair from "./tasks/SFTQAPair";
import RMPairwise from "./tasks/RMPairwise";
import RMScalar from "./tasks/RMScalar";
import RMMultiTurn from "./tasks/RMMultiTurn";
import RedTeam from "./tasks/RedTeam";

export default function TaskPlayer({
  project,
  annotations,
  onSubmit,
  onSkip,
  onFlag,
  onExit,
}) {
  const tasks = project.tasks || [];
  const firstIdx = tasks.findIndex((t) => !annotations[t.id]);
  const [idx, setIdx] = useState(firstIdx === -1 ? 0 : firstIdx);

  const task = useMemo(() => tasks[idx], [tasks, idx]);
  const doneCount = tasks.filter((t) => annotations[t.id]?.status === "done").length;

  const goNext = () => setIdx((i) => Math.min(i + 1, tasks.length - 1));
  const goPrev = () => setIdx((i) => Math.max(i - 1, 0));

  const submitAndAdvance = (payload) => {
    onSubmit(task.id, payload);
    if (idx < tasks.length - 1) goNext();
  };
  const skipAndAdvance = () => {
    onSkip(task.id);
    if (idx < tasks.length - 1) goNext();
  };
  const flagAndAdvance = () => {
    onFlag(task.id);
    if (idx < tasks.length - 1) goNext();
  };

  // Basic keyboard shortcuts (ignored when typing in inputs/textareas/contenteditable)
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        (e.target && e.target.isContentEditable);

      if (isEditable) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onExit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, tasks.length]);

  const renderTask = () => {
    if (!task) return <Typography>All tasks complete 🎉</Typography>;
    const common = {
      task,
      onSubmit: submitAndAdvance,
      meta: { index: idx, total: tasks.length, project }, // <= add this
      onSkip: skipAndAdvance,
      onFlag: flagAndAdvance,
    };
    switch (task.type) {
      case "SFT_PROMPT":
        return <SFTPrompt {...common} />;
      case "SFT_QA":
        return <SFTQAPair {...common} />;
      case "RM_PAIRWISE":
        return <RMPairwise {...common} />;
      case "RM_SCALAR":
        return <RMScalar {...common} />;
      case "RM_DIALOG":
        return <RMMultiTurn {...common} />;
      case "RED_TEAM":
        return <RedTeam {...common} />;
      default:
        return <Typography>Unknown task type.</Typography>;
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Left: sticky instruction rail */}
      <Grid item xs={12} md={4} lg={3}>
        <InstructionsRail
          project={project}
          task={task}
          idx={idx}
          total={tasks.length}
          doneCount={doneCount}
          onPrev={goPrev}
          onNext={goNext}
          onExit={onExit}
        />
      </Grid>

      {/* Right: main task UI */}
      <Grid item xs={12} md={8} lg={9}>
        <Card>
          <CardContent>
            {renderTask()}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}