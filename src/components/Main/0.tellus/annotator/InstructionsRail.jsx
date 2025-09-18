import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Stack,
  Chip,
  Tabs,
  Tab,
  Button,
} from "@mui/material";

function currencyINR(cents = 0) {
  return `₹${(cents / 100).toFixed(2)}`;
}

function getDefaultRubrics(project) {
  if (project?.type === "RM") {
    return `Rating rubric (HHH):
• Helpfulness — Is the answer useful, complete, and actionable for the user’s request?
• Harmlessness — Avoids unsafe content; refuses prohibited requests politely.
• Honesty — No hallucinations or false claims; clearly states uncertainty.

Scoring hints:
• 7 = excellent; 4 = acceptable; 1 = very poor.
• Penalize confident wrong answers; reward safe refusals for disallowed prompts.`;
  }
  return `General quality guide:
• Be clear, concise, and on-topic.
• Follow any style/tone requirements.
• Cite or indicate uncertainty when needed.`;
}

function getTaskHint(task) {
  if (!task) return "";
  switch (task.type) {
    case "SFT_PROMPT":
      return "Write a high-quality response to the prompt following the project’s style guide.";
    case "SFT_QA":
      return "Author one good question and an ideal, self-contained answer.";
    case "RM_PAIRWISE":
      return "Compare candidates A vs B and choose the better overall per the rubric.";
    case "RM_SCALAR":
      return "Rate the single candidate on each rubric (1–7) and leave optional notes.";
    case "RM_DIALOG":
      return "Review the multi-turn exchange. Rate each assistant turn per rubric.";
    case "RED_TEAM":
      return "Propose an adversarial prompt/strategy and pick the more harmful candidate if any.";
    default:
      return "Complete the task as per instructions.";
  }
}

export default function InstructionsRail({
  project,
  task,
  idx,
  total,
  doneCount,
  onPrev,
  onNext,
  onExit,
}) {
  const [tab, setTab] = React.useState(0);

  const extras = useMemo(() => {
    const arr = [];
    // Policy/style defaults (optional; safe to customize later)
    arr.push({
      label: "Policy",
      content:
        "No PII. Refuse unsafe or prohibited content. Be polite and explain refusals briefly.",
    });
    arr.push({
      label: "Style",
      content:
        "Be concise, precise, and neutral. Prefer simple wording. Include brief rationale when helpful.",
    });
    return arr;
  }, []);

  return (
    <Card sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
      <CardContent>
        {/* Header chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          {project?.category && <Chip size="small" label={project.category} />}
          {project?.type && <Chip size="small" label={project.type} />}
          {project?.subtype && <Chip size="small" label={project.subtype} />}
        </Stack>

        {/* Title & desc */}
        <Typography variant="h6" sx={{ mr: 1 }}>{project?.name}</Typography>
        {project?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {project.description}
          </Typography>
        )}

        {/* Optional pay/time cues if present on project */}
        {(project?.payPerTaskCents || project?.avgMinutesPerTask) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {project?.payPerTaskCents ? `≈ ${currencyINR(project.payPerTaskCents)}/task` : ""}
            {project?.payPerTaskCents && project?.avgMinutesPerTask ? " • " : ""}
            {project?.avgMinutesPerTask ? `~${project.avgMinutesPerTask} min/task` : ""}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Tabs */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 36, "& .MuiTab-root": { minHeight: 36 } }}
        >
          <Tab label="Guidelines" />
          <Tab label="This Task" />
          <Tab label="Rubrics" />
          <Tab label="Shortcuts" />
          {extras.map((e, i) => <Tab key={i} label={e.label} />)}
        </Tabs>

        <Box sx={{ mt: 1 }}>
          {tab === 0 && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {project?.guidelines || "No guidelines provided."}
            </Typography>
          )}

          {tab === 1 && (
            <>
              {task?.instructions ? (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {task.instructions}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {getTaskHint(task)}
                </Typography>
              )}
            </>
          )}

          {tab === 2 && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {getDefaultRubrics(project)}
            </Typography>
          )}

          {tab === 3 && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              Keyboard shortcuts:
              {"\n"}• ← / → : Previous / Next task (when not typing in a field)
              {"\n"}• Esc : Exit to project overview
              {"\n"}• Form actions remain inside the main panel (submit/skip/flag).
            </Typography>
          )}

          {tab >= 4 && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {extras[tab - 4]?.content}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Progress + nav */}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Progress: {idx + 1}/{total} • Completed: {doneCount}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" onClick={onPrev} disabled={idx === 0}>Prev</Button>
          <Button size="small" onClick={onNext} disabled={idx === total - 1}>Next</Button>
          <Button size="small" variant="outlined" onClick={onExit}>Exit</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}