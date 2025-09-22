// src/components/Main/0.tellus/Annotator.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Box, CssBaseline, Snackbar, Alert } from "@mui/material";

import TopBar from "./annotator/TopBar";
import LeftNav from "./annotator/LeftNav";
import DashboardPanel from "./annotator/DashboardPanel";
import TaskPlayer from "./annotator/TaskPlayer";
import StatsPanel from "./annotator/StatsPanel";
import PerformancePanel from "./annotator/PerformancePanel";
import SettingsPanel from "./annotator/SettingsPanel";
import OnboardingPanel from "./annotator/OnboardingPanel";
import { SAMPLE_PROJECTS } from "./annotator/data/sampleData";

import ProfilePanel from "./annotator/ProfilePanel";
import NotificationsPanel from "./annotator/NotificationsPanel";

import InvitesAndTraining from "./annotator/InvitesAndTraining";

export default function Annotator() {
  // Views: 'dashboard' | 'onboarding' | 'task' | 'stats' | 'performance' | 'settings'
  const [view, setView] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Annotation store (simple in-memory + demo stats)
  const [annotations, setAnnotations] = useState({});
  const [toast, setToast] = useState({ open: false, msg: "", severity: "success" });

  // --- Onboarding state (persisted) ---
  const ONB_KEY = "annotator.onboarding.v1";
  const [onboarding, setOnboarding] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ONB_KEY) || "{}");
      return {
        emailVerified: false,
        profileCompleted: false,
        warmupDone: false,
        approved: false,
        ...saved,
      };
    } catch {
      return {
        emailVerified: false,
        profileCompleted: false,
        warmupDone: false,
        approved: false,
      };
    }
  });
  useEffect(() => {
    localStorage.setItem(ONB_KEY, JSON.stringify(onboarding));
  }, [onboarding]);

  // Projects (demo data)
  const projects = useMemo(() => SAMPLE_PROJECTS, []);
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  // Helpers
  const isToday = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Per-project progress (today + overall) for dashboard
  const perProjectProgress = useMemo(() => {
    return projects.map((p) => {
      const total = p.tasks.length;
      const doneTotal = p.tasks.filter((t) => annotations[t.id]?.status === "done").length;
      const doneToday = p.tasks.filter((t) => {
        const a = annotations[t.id];
        return a?.status === "done" && isToday(a.timestamp);
      }).length;

      const target = p.todayTarget ?? 0;
      const remainingToday = Math.max(target - doneToday, 0);

      const plannedMinutes = remainingToday * (p.avgMinutesPerTask ?? 0);
      const plannedCents = remainingToday * (p.payPerTaskCents ?? 0);
      const earnedCentsToday = doneToday * (p.payPerTaskCents ?? 0);

      return {
        id: p.id,
        name: p.name,
        category: p.category,
        type: p.type,
        subtype: p.subtype,
        priority: p.priority,
        tags: p.tags || [],
        dueAt: p.dueAt,
        total,
        doneTotal,
        doneToday,
        target,
        remainingToday,
        plannedMinutes,
        plannedCents,
        earnedCentsToday,
        guidelines: p.guidelines,
        description: p.description,
        tasks: p.tasks,
      };
    });
  }, [projects, annotations]);

  // Rollup for "Today" KPIs
  const todayRollup = useMemo(() => {
    const sum = (fn) => perProjectProgress.reduce((acc, x) => acc + fn(x), 0);
    const remainingTasks = sum((x) => x.remainingToday);
    const plannedMinutes = sum((x) => x.plannedMinutes);
    const plannedCents = sum((x) => x.plannedCents);
    const earnedCentsToday = sum((x) => x.earnedCentsToday);
    return { remainingTasks, plannedMinutes, plannedCents, earnedCentsToday };
  }, [perProjectProgress]);

  // Dashboard metrics (optional demo KPIs)
  const metrics = useMemo(() => {
    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const completed = Object.values(annotations).filter((a) => a.status === "done").length;
    const flagged = Object.values(annotations).filter((a) => a.status === "flagged").length;
    const completionPct = totalTasks ? Math.round((completed / totalTasks) * 100) : 0;
    return { totalTasks, completed, flagged, completionPct, projects: projects.length };
  }, [projects, annotations]);

  // --- Completed count for onboarding warm-up auto-complete ---
  const completedCount = useMemo(
    () => Object.values(annotations).filter((a) => a.status === "done").length,
    [annotations]
  );
  useEffect(() => {
    // Auto-mark warm-up as done after 3 completed tasks (demo behavior)
    if (completedCount >= 3 && !onboarding.warmupDone) {
      setOnboarding((s) => ({ ...s, warmupDone: true }));
    }
  }, [completedCount, onboarding.warmupDone]);

  // Handlers
  const openProject = (projectId) => {
    setTodayTasks(null); // ensure not in Today mode
    setSelectedProjectId(projectId);
    setView("task");
  };

  const handleSubmitAnnotation = (taskId, payload) => {
    setAnnotations((prev) => ({
      ...prev,
      [taskId]: { status: "done", payload, timestamp: Date.now() },
    }));
    setToast({ open: true, msg: "Saved ✔", severity: "success" });
  };

  const handleSkip = (taskId, reason = "skipped") => {
    setAnnotations((prev) => ({
      ...prev,
      [taskId]: { status: "skipped", payload: { reason }, timestamp: Date.now() },
    }));
    setToast({ open: true, msg: "Skipped", severity: "info" });
  };

  const handleFlag = (taskId, reason = "flagged") => {
    setAnnotations((prev) => ({
      ...prev,
      [taskId]: { status: "flagged", payload: { reason }, timestamp: Date.now() },
    }));
    setToast({ open: true, msg: "Flagged for review", severity: "warning" });
  };

  // "Today’s Tasks" — cross-project pending queue
  const [todayTasks, setTodayTasks] = useState(null);
  const startTodayTasks = () => {
    const pendingTasks = projects.flatMap((p) =>
      p.tasks
        .filter((t) => !annotations[t.id])
        .map((t) => ({ ...t, project: p }))
    );
    setTodayTasks({
      id: "today",
      name: "Today’s Tasks",
      tasks: pendingTasks,
      guidelines: "Complete your assigned tasks.",
      category: "Daily",
    });
    setView("task");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <TopBar />
      <LeftNav view={view} onChangeView={setView} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "grey.50",
          minHeight: "100vh",
          p: 3,
          mt: 8,
          ml: "0px",
        }}
      >
        {view === "onboarding" && (
          <OnboardingPanel
            state={onboarding}
            setState={setOnboarding}
            onStartWarmup={startTodayTasks}
            completedCount={completedCount}
          />
        )}

        {view === "dashboard" && (
          <DashboardPanel
            projects={projects}
            perProject={perProjectProgress}
            today={todayRollup}
            onOpenProject={openProject}
            onStartToday={startTodayTasks}
            // metrics is available if you want to pass it down later:
            // metrics={metrics}
          />
        )}

        {view === "invites" && (
  <InvitesAndTraining
    projects={projects}
    onOpenProject={openProject}   // this navigates to TaskPlayer for that project
  />
)}

        {view === "task" && (todayTasks || selectedProject) && (
          <TaskPlayer
            project={todayTasks || selectedProject}
            annotations={annotations}
            onSubmit={handleSubmitAnnotation}
            onSkip={handleSkip}
            onFlag={handleFlag}
            onExit={() => setView("dashboard")}
          />
        )}

        {view === "notifications" && <NotificationsPanel />}
{view === "profile" && <ProfilePanel />}

        {view === "performance" && (
  <PerformancePanel projects={projects} annotations={annotations} />
)}
        {view === "settings" && <SettingsPanel />}
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={1800}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}