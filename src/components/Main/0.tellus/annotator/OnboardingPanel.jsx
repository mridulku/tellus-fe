import React, { useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Stack, Button, Chip, Divider, LinearProgress
} from "@mui/material";

const STEP_THRESHOLDS = { warmupTasks: 3 }; // mark warm-up as done after N saved tasks (demo)

export default function OnboardingPanel({ state, setState, onStartWarmup, completedCount }) {
  const steps = useMemo(() => ([
    {
      key: "emailVerified",
      title: "Verify email",
      desc: "Confirm your email to activate your account.",
      actionLabel: state.emailVerified ? "Verified" : "Mark Verified",
      onClick: () => setState(s => ({ ...s, emailVerified: true })),
      done: state.emailVerified,
    },
    {
      key: "profileCompleted",
      title: "Complete profile",
      desc: "Fill name and basics in Profile.",
      actionLabel: state.profileCompleted ? "Completed" : "Mark Completed",
      onClick: () => setState(s => ({ ...s, profileCompleted: true })),
      done: state.profileCompleted,
    },
    {
      key: "warmupDone",
      title: `Finish warm-up tasks (${Math.min(completedCount, STEP_THRESHOLDS.warmupTasks)}/${STEP_THRESHOLDS.warmupTasks})`,
      desc: "Do a few sample tasks to calibrate quality. You’ll get instant feedback.",
      actionLabel: state.warmupDone ? "Done" : "Resume Warm-up",
      onClick: () => state.warmupDone ? null : onStartWarmup?.(),
      done: state.warmupDone,
    },
    {
      key: "approved",
      title: "Request approval",
      desc: "After warm-up, request approval to access paid projects.",
      actionLabel: state.approved ? "Approved" : "Mark Approved",
      onClick: () => setState(s => ({ ...s, approved: true })),
      done: state.approved,
      disabled: !state.warmupDone,
    },
  ]), [state, setState, onStartWarmup, completedCount]);

  const total = steps.length;
  const done = steps.filter(s => s.done).length;
  const pct = Math.round((done / total) * 100);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Onboarding</Typography>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">Progress</Typography>
          <LinearProgress variant="determinate" value={pct} sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">{done}/{total} steps • {pct}%</Typography>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {steps.map(step => (
          <Card key={step.key} variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1">
                    {step.title} {step.done && <Chip size="small" color="success" label="Done" sx={{ ml: 1 }} />}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant={step.done ? "outlined" : "contained"}
                    disabled={step.disabled}
                    onClick={step.onClick}
                  >
                    {step.actionLabel}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary">
        Tip: This page is for demo onboarding only. In production, email verification, profile completion,
        and approvals would be handled via APIs; warm-up tasks would be assigned from a real queue.
      </Typography>
    </Box>
  );
}