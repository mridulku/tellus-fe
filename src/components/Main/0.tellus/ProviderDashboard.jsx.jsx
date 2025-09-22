// src/components/Main/0.tellus/ProviderDashboard.jsx
import React, { lazy, Suspense, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  IconButton,
  LinearProgress,
} from "@mui/material";

import Sidebar from "./dashboard/Sidebar";

// lightweight panels (can stay non-lazy)
import Notifications from "./dashboard/Notifications";
import Profile from "./dashboard/Profile";
import OrgSettings from "./dashboard/OrgSettings";

// heavy panels — keep lazy for perf
const Models           = lazy(() => import("./dashboard/Models"));
const ProjectWizard    = lazy(() => import("./dashboard/ProjectWizard"));
const ProjectList      = lazy(() => import("./dashboard/ProjectList"));
const ProjectDetail    = lazy(() => import("./dashboard/ProjectDetail")); // NEW
const AnnotatorManager = lazy(() => import("./dashboard/AnnotatorManager"));
const Exports          = lazy(() => import("./dashboard/Exports"));
// If you still want monitoring, re-enable:
// const Monitoring       = lazy(() => import("./dashboard/Monitoring"));

/** Simple error boundary so failures don't blank the whole page */
class Boundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(err) {
    return { err };
  }
  render() {
    if (this.state.err) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong in this panel.
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {String(this.state.err?.stack || this.state.err?.message || this.state.err)}
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function ProviderDashboard() {
  // keep a simple string key for view routing
  const [activeView, setActiveView] = useState("projects");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // passed into ProjectList so "View" works
  const openProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView("projectDetail");
  };

  const renderView = () => {
    switch (activeView) {
      case "models":
        return <Models />;

      case "projects":
        return (
          <ProjectList
            setActiveView={setActiveView}
            onOpenProject={openProject}
          />
        );

      case "projectDetail":
        return (
          <ProjectDetail
            projectId={selectedProjectId}
            onBack={() => setActiveView("projects")}
          />
        );

      case "createProject":
        return <ProjectWizard />;

      case "annotators":
        return <AnnotatorManager />;

      case "exports":
        return <Exports />;

      // Optional:
      // case "monitoring":
      //   return <Monitoring />;

      case "notifications":
        return <Notifications />;

      case "profile":
        return <Profile />;

      case "orgSettings":
        return <OrgSettings />;

      default:
        return (
          <ProjectList
            setActiveView={setActiveView}
            onOpenProject={openProject}
          />
        );
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Top bar */}
      <AppBar
        elevation={0}
        color="inherit"
        position="fixed"
        sx={{ borderBottom: "1px solid #eee" }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Provider Dashboard
          </Typography>
          <Box sx={{ flex: 1 }} />
          <IconButton size="small">
            <Avatar sx={{ width: 28, height: 28 }}>A</Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Left nav */}
      <Sidebar activeView={activeView} setActiveView={setActiveView} />

      {/* Main */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 9, // account for AppBar
          px: 3,
          pb: 3,
          overflow: "auto",
        }}
      >
        <Boundary>
          <Suspense fallback={<LinearProgress />}>{renderView()}</Suspense>
        </Boundary>
      </Box>
    </Box>
  );
}