// src/components/Main/0.tellus/annotator/OnboardingWidget.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Button,
  Collapse,
  IconButton,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

/**
 * Props (all optional):
 * - state: { emailVerified, profileCompleted, warmupDone, approved }
 * - setState: fn to update the state above
 * - onStartWarmup: fn to kick off warm-up tasks
 *
 * If no state/setState are provided, this component will manage its own state in localStorage.
 */
const LS_KEY = "annotator.onboarding.v1";
const DEFAULT = {
  emailVerified: false,
  profileCompleted: false,
  warmupDone: false,
  approved: false,
};

export default function OnboardingWidget({
  state: externalState,
  setState: externalSetState,
  onStartWarmup,
  initiallyOpen = false,
}) {
  // Fallback-local state if parent didn’t pass one
  const [internalState, setInternalState] = useState(() => {
    if (externalState) return externalState;
    try {
      return { ...DEFAULT, ...(JSON.parse(localStorage.getItem(LS_KEY) || "{}")) };
    } catch {
      return DEFAULT;
    }
  });

  const state = externalState ?? internalState;
  const setState = externalSetState ?? setInternalState;

  // Persist only when we’re using internal state
  useEffect(() => {
    if (!externalSetState) {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    }
  }, [state, externalSetState]);

  // Compact/collapsible UI so it doesn’t dominate the dashboard
  const [open, setOpen] = useState(initiallyOpen);

  // Defensive destructuring (prevents “cannot read … of undefined”)
  const {
    emailVerified = false,
    profileCompleted = false,
    warmupDone = false,
    approved = false,
  } = state || DEFAULT;

  const steps = useMemo(
    () => [
      {
        key: "emailVerified",
        label: "Verify email",
        done: emailVerified,
        actionLabel: emailVerified ? "Verified" : "Send link",
        onClick: () => setState((s) => ({ ...s, emailVerified: true })),
      },
      {
        key: "profileCompleted",
        label: "Complete profile",
        done: profileCompleted,
        actionLabel: profileCompleted ? "Done" : "Open profile",
        onClick: () => setState((s) => ({ ...s, profileCompleted: true })),
      },
      {
        key: "warmupDone",
        label: "Finish warm-up tasks",
        done: warmupDone,
        actionLabel: warmupDone ? "Completed" : "Start warm-up",
        onClick: () => {
          if (typeof onStartWarmup === "function") {
            onStartWarmup();
          } else {
            // If no handler, just mark as done for the demo
            setState((s) => ({ ...s, warmupDone: true }));
          }
        },
      },
      {
        key: "approved",
        label: "Await approval",
        done: approved,
        actionLabel: approved ? "Approved" : "Mark approved (demo)",
        onClick: () => setState((s) => ({ ...s, approved: true })),
      },
    ],
    [emailVerified, profileCompleted, warmupDone, approved, onStartWarmup, setState]
  );

  const completed = steps.filter((s) => s.done).length;
  const pct = Math.round((completed / steps.length) * 100);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            Onboarding
          </Typography>
          <Chip
            size="small"
            label={`${completed}/${steps.length}`}
            color={completed === steps.length ? "success" : "default"}
          />
          <IconButton size="small" onClick={() => setOpen((v) => !v)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ mt: 1, mb: open ? 1 : 0 }}
        />

        <Collapse in={open}>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {steps.map((s) => (
              <Box
                key={s.key}
                sx={{
                  p: 1,
                  border: "1px solid #eee",
                  borderRadius: 1,
                  bgcolor: s.done ? "grey.50" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ flex: 1, textDecoration: s.done ? "line-through" : "none" }}
                >
                  {s.label}
                </Typography>
                <Button
                  size="small"
                  variant={s.done ? "outlined" : "contained"}
                  color={s.done ? "inherit" : "primary"}
                  onClick={s.onClick}
                >
                  {s.actionLabel}
                </Button>
              </Box>
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}