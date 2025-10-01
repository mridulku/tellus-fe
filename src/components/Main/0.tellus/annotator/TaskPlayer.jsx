import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  Alert,
  Button,
  Snackbar,
  LinearProgress,
} from "@mui/material";
import InstructionsRail from "./InstructionsRail";

// Task UIs
import SFTTask from "./tasks/SFTTask";
import RMPairwise from "./tasks/RMPairwise";
import RMScalar from "./tasks/RMScalar";
import RMMultiTurn from "./tasks/RMMultiTurn";
import RedTeam from "./tasks/RedTeam";

// --- Helpers --------------------------------------------------------------
const isToday = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

function evaluateGold(task, payload) {
  if (!task?.isGold || !task?.gold) return null;
  try {
    
    if (task.type === "RM_SCALAR") {
      const min = task?.gold?.expected?.min ?? 0;
      const h = payload?.scores?.help ?? 0;
      const s = payload?.scores?.harmless ?? 0;
      const o = payload?.scores?.honest ?? 0;
      return [h, s, o].every((v) => v >= min);
    }
      if (task.type === "SFT") {
     const mode = task?.sftMode || (task?.prompt ? "PROMPT" : "AUTHOR_QA");
     const must = (task?.gold?.rubric?.mustInclude || "").toLowerCase();
     if (!must) return null;
     if (mode === "PROMPT") {
       const txt = (payload?.response || "").toLowerCase();
       return txt.includes(must);
     }
     // AUTHOR_QA: simple check on answer; you can extend to question if needed
     const ans = (payload?.answer || "").toLowerCase();
     return ans.includes(must);
   }
  } catch {
    return null;
  }
  return null;
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem("annotator.session.v1") || "{}");
  } catch {
    return {};
  }
}
function saveSession(next) {
  try {
    localStorage.setItem("annotator.session.v1", JSON.stringify(next));
  } catch {}
}

function logSubmission(record) {
  try {
    const key = "annotator.submissions.v1";
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    prev.push(record);
    localStorage.setItem(key, JSON.stringify(prev));
  } catch {}
}

// --- Component ------------------------------------------------------------
export default function TaskPlayer({
  project,
  annotations,
  onSubmit,
  onSkip,
  onFlag,
  onExit,
}) {
  const tasks = project.tasks || [];

  // Initial index: resume from session if available, else first incomplete
  const firstIncomplete = tasks.findIndex((t) => !annotations[t.id]);
  const [idx, setIdx] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);

  // Try to restore saved pointer for this project
  useEffect(() => {
    const sess = loadSession();
    const saved = sess?.byProject?.[project.id]?.lastIdx;
    if (typeof saved === "number" && saved >= 0 && saved < tasks.length) {
      // If saved task already completed, try to jump to next incomplete after it
      const nextAfterSaved = tasks.slice(saved).findIndex((t) => !annotations[t.id]);
      if (nextAfterSaved !== -1) {
        setIdx(saved + nextAfterSaved);
      } else if (firstIncomplete !== -1) {
        setIdx(firstIncomplete);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Persist pointer on idx change
  useEffect(() => {
    const sess = loadSession();
    const next = {
      ...sess,
      byProject: {
        ...(sess.byProject || {}),
        [project.id]: { lastIdx: idx, updatedAt: Date.now() },
      },
    };
    saveSession(next);
  }, [idx, project.id]);

  const task = useMemo(() => tasks[idx], [tasks, idx]);
  const doneCount = tasks.filter((t) => annotations[t.id]?.status === "done").length;

  // In-session HUD metrics (per project)
  const payCents = project?.payPerTaskCents || 0;
  const earnedToday = tasks.reduce((sum, t) => {
    const a = annotations[t.id];
    return sum + (a?.status === "done" && isToday(a.timestamp) ? payCents : 0);
  }, 0);
  const doneToday = tasks.filter((t) => {
    const a = annotations[t.id];
    return a?.status === "done" && isToday(a.timestamp);
  }).length;
  const todayTarget = project?.todayTarget ?? project?.dailyTarget ?? 0;

  // Sensitive reveal (optional)
  const [revealed, setRevealed] = useState(!task?.sensitive?.blurUntilReveal);
  useEffect(() => {
    setRevealed(!task?.sensitive?.blurUntilReveal);
  }, [task?.sensitive?.blurUntilReveal, idx]);

  // Gold feedback snackbar
  const [goldSnack, setGoldSnack] = useState({ open: false, result: null });
  const closeGoldSnack = () => setGoldSnack({ open: false, result: null });

  const goNext = () => setIdx((i) => Math.min(i + 1, tasks.length - 1));
  const goPrev = () => setIdx((i) => Math.max(i - 1, 0));

  const submitAndAdvance = (payload) => {
    // Evaluate calibration if applicable
    const goldResult = evaluateGold(task, payload);
    if (goldResult != null) {
      setGoldSnack({ open: true, result: !!goldResult });
    }

    // Log submission (for demo/audit)
    logSubmission({
      ts: Date.now(),
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      taskType: task.type,
      status: "done",
      isGold: !!task?.isGold,
      goldCorrect: goldResult == null ? undefined : !!goldResult,
      policyVersion: project?.policyVersion || "policy-v1",
      uiVersion: project?.uiVersion || "annotator-0.1",
    });

    // Pass through (note: Annotator onSubmit updates annotations)
    onSubmit(task.id, payload, project);

    if (idx < tasks.length - 1) goNext();
  };

  const skipAndAdvance = (reasonPayload) => {
    logSubmission({
      ts: Date.now(),
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      taskType: task.type,
      status: "skipped",
      skip: reasonPayload || {},
      policyVersion: project?.policyVersion || "policy-v1",
      uiVersion: project?.uiVersion || "annotator-0.1",
    });
    onSkip(task.id, reasonPayload);   // keep {reason, notes}
    if (idx < tasks.length - 1) goNext();
  };

  const flagAndAdvance = (flagPayload) => {
    logSubmission({
      ts: Date.now(),
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      taskType: task.type,
      status: "flagged",
      flag: flagPayload || {},
      policyVersion: project?.policyVersion || "policy-v1",
      uiVersion: project?.uiVersion || "annotator-0.1",
    });
    onFlag(task.id, flagPayload);     // keep {reason, notes}
    if (idx < tasks.length - 1) goNext();
  };

  const renderTask = () => {
    if (!task) return <Typography>All tasks complete 🎉</Typography>;
        const common = {
      task,
      onSubmit: submitAndAdvance,
      meta: { index: idx, total: tasks.length, project },
      onSkip: (payload) => skipAndAdvance(payload),
      onFlag: (payload) => flagAndAdvance(payload),
    };
    switch (task.type) {
       case "SFT":        return <SFTTask {...common} />;
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
        {/* In-session HUD */}
        <Card sx={{ mb: 2 }}>
  <CardContent>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography variant="body2" color="text.secondary">
          Task {Math.min(idx + 1, tasks.length)} of {tasks.length}
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={tasks.length ? Math.round(((idx + 1) / tasks.length) * 100) : 0}
          />
        </Box>
      </Box>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          Today: {doneToday}/{todayTarget || "—"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Earned today: ₹{(earnedToday / 100).toFixed(2)}
        </Typography>
        {typeof project?.payPerTaskCents === "number" && (
          <Typography variant="caption" color="text.secondary">
            +₹{(project.payPerTaskCents / 100).toFixed(2)} / task
          </Typography>
        )}
      </Stack>
    </Stack>
  </CardContent>
</Card>

        {/* Policy hint banners (refusal expected / sensitive reveal) */}
        {task?.policyHint === "refusal_expected" && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Refusal expected: Provide a brief, polite refusal and a safe alternative if possible.
          </Alert>
        )}
        {task?.policyHint && task?.policyHint !== "refusal_expected" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Policy hint: {String(task.policyHint).replace(/_/g, " ")}
          </Alert>
        )}
        {task?.sensitive?.blurUntilReveal && !revealed && (
          <Alert severity="info" sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>This task may contain sensitive content. Click “Reveal” to proceed.</span>
            <Button size="small" variant="contained" onClick={() => setRevealed(true)}>Reveal</Button>
          </Alert>
        )}

        <Card>
          <CardContent>
            <Box
              sx={{
                filter: task?.sensitive?.blurUntilReveal && !revealed ? "blur(4px)" : "none",
                pointerEvents: task?.sensitive?.blurUntilReveal && !revealed ? "none" : "auto",
                opacity: task?.sensitive?.blurUntilReveal && !revealed ? 0.6 : 1,
                transition: "all 120ms ease",
              }}
            >
              {renderTask()}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Calibration result snackbar */}
      <Snackbar
        open={goldSnack.open}
        autoHideDuration={1400}
        onClose={closeGoldSnack}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {goldSnack.result === true ? (
          <Alert severity="success" variant="filled" onClose={closeGoldSnack}>
            Calibration: Correct ✔
          </Alert>
        ) : (
          <Alert severity="error" variant="filled" onClose={closeGoldSnack}>
            Calibration: Incorrect ✖
          </Alert>
        )}
      </Snackbar>
    </Grid>
  );
}