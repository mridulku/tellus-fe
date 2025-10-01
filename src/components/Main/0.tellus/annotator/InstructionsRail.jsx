// src/components/Main/0.tellus/annotator/InstructionsRail.jsx
import React from "react";
import {
  Box, Card, CardContent, Typography, Divider, Stack,
  Button, Collapse, Link, LinearProgress
} from "@mui/material";

function currencyINR(cents = 0) { return `₹${(cents / 100).toFixed(2)}`; }

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
  const [showExamples, setShowExamples] = React.useState(false);
  const pct = total > 0 ? Math.round(((idx + 1) / total) * 100) : 0;

  return (
    <Card sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
      <CardContent>
        {/* Title & one-line desc */}
        <Typography variant="h6">{project?.name}</Typography>
        {project?.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {project.description}
          </Typography>
        )}

        {/* Small cues */}
        {(project?.payPerTaskCents || project?.avgMinutesPerTask) && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {project?.payPerTaskCents ? `≈ ${currencyINR(project.payPerTaskCents)}/task` : ""}
            {project?.payPerTaskCents && project?.avgMinutesPerTask ? " • " : ""}
            {project?.avgMinutesPerTask ? `~${project.avgMinutesPerTask} min/task` : ""}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Overview (compact, no tabs) */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Overview</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {project?.guidelines ||
              `Keep it clear, concise, and neutral. Prefer simple wording.
If the prompt is unsafe, refuse briefly and suggest a safe alternative.`}
          </Typography>
        </Box>

        {/* Optional examples (collapsed by default) */}
        {!!(project?.examples?.length) && (
          <Box sx={{ mt: 1.5 }}>
            <Link component="button" variant="body2" onClick={() => setShowExamples(v => !v)}>
              {showExamples ? "Hide examples" : "Show examples"}
            </Link>
            <Collapse in={showExamples} unmountOnExit>
              <Stack spacing={1.25} sx={{ mt: 1 }}>
                {project.examples.slice(0, 2).map((ex, i) => (
                  <Box key={i} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "grey.50" }}>
                    <Typography variant="subtitle2">{ex.title || `Example ${i + 1}`}</Typography>
                    {ex.input && (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                        <b>Input:</b> {ex.input}
                      </Typography>
                    )}
                    {ex.output && (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                        <b>Ideal:</b> {ex.output}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Progress + simple nav (big enough to hit) */}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          {`Task ${Math.min(idx + 1, total)} of ${total}`} • Completed: {doneCount}
        </Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ mb: 1 }} />

        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={onPrev} disabled={idx === 0}>Prev</Button>
          <Button size="small" onClick={onNext} disabled={idx >= total - 1}>Next</Button>
          <Button size="small" variant="outlined" onClick={onExit}>Exit</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}