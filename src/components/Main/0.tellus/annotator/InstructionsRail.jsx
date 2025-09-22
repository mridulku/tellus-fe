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
  Tooltip,
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
    // Default policy/style tabs (can be overridden by project config if you add it later)
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

  const hasExamples = Array.isArray(project?.examples) && project.examples.length > 0;

  // Tab layout: [Guidelines, This Task, Rubrics, Shortcuts, (Examples?), ...extras]
  const baseTabs = ["Guidelines", "This Task", "Rubrics", "Shortcuts"];
  const allTabs = hasExamples ? [...baseTabs, "Examples", ...extras.map(e => e.label)] : [...baseTabs, ...extras.map(e => e.label)];
  const examplesIndex = hasExamples ? baseTabs.length : -1;
  const extrasStart = hasExamples ? baseTabs.length + 1 : baseTabs.length;

  return (
    <Card sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
      <CardContent>
        {/* Header chips */}
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          {project?.category && <Chip size="small" label={project.category} />}
          {project?.type && <Chip size="small" label={project.type} />}
          {project?.subtype && <Chip size="small" label={project.subtype} />}
          {/* Gamification indicator (opt-out visible) */}
          {project?.gamification?.enabled === false && (
            <Chip size="small" color="default" variant="outlined" label="Gamification OFF" />
          )}
        </Stack>

        {/* Title & desc */}
        <Typography variant="h6" sx={{ mr: 1 }}>{project?.name}</Typography>
        {project?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {project.description}
          </Typography>
        )}

        {/* Meta/version chips: policyVersion, uiVersion, modelId (optional) */}
        {(project?.policyVersion || project?.uiVersion || project?.modelId) && (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
            {project?.policyVersion && (
              <Chip size="small" color="info" variant="outlined" label={`Policy ${project.policyVersion}`} />
            )}
            <Chip size="small" color="info" variant="outlined" label={`UI ${project?.uiVersion || "annotator-0.1"}`} />
            {project?.modelId && (
              <Chip size="small" color="info" variant="outlined" label={`Model ${project.modelId}`} />
            )}
          </Stack>
        )}

        {/* Optional pay/time cues */}
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
          {allTabs.map((label, i) => <Tab key={i} label={label} />)}
        </Tabs>

        <Box sx={{ mt: 1 }}>
          {/* Guidelines */}
          {tab === 0 && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {project?.guidelines || "No guidelines provided."}
            </Typography>
          )}

          {/* This Task */}
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

          {/* Rubrics */}
          {tab === 2 && (
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {getDefaultRubrics(project)}
            </Typography>
          )}

          {/* Shortcuts */}
          {tab === 3 && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              Keyboard shortcuts:
              {"\n"}• ← / → : Previous / Next task (when not typing in a field)
              {"\n"}• Esc : Exit to project overview
              {"\n"}• Form actions remain inside the main panel (submit/skip/flag).
            </Typography>
          )}

          {/* Examples (optional) */}
          {hasExamples && tab === examplesIndex && (
            <Stack spacing={1.5}>
              {(project.examples || []).slice(0, 3).map((ex, i) => (
                <Box key={i} sx={{ p: 1, bgcolor: "grey.50", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                  <Typography variant="subtitle2">{ex.title || `Example ${i + 1}`}</Typography>
                  {ex.input && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                      <strong>Input:</strong> {ex.input}
                    </Typography>
                  )}
                  {ex.output && (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                      <strong>Ideal:</strong> {ex.output}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}

          {/* Extra tabs (Policy, Style, ...) */}
          {tab >= extrasStart && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
              {extras[tab - extrasStart]?.content}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Progress + nav */}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          Progress: {Math.min(idx + 1, total)}/{total} • Completed: {doneCount}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" onClick={onPrev} disabled={idx === 0}>Prev</Button>
          <Button size="small" onClick={onNext} disabled={idx >= total - 1}>Next</Button>
          <Tooltip title="Exit to Dashboard">
            <span>
              <Button size="small" variant="outlined" onClick={onExit}>Exit</Button>
            </span>
          </Tooltip>
        </Stack>
      </CardContent>
    </Card>
  );
}