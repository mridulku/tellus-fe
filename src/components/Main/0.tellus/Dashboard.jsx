import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import Sidebar from "./dashboard/Sidebar";
import Models from "./dashboard/Models";
import ProjectWizard from "./dashboard/ProjectWizard";
import ProjectList from "./dashboard/ProjectList";
import AnnotatorManager from "./dashboard/AnnotatorManager";
import Monitoring from "./dashboard/Monitoring";
import Exports from "./dashboard/Exports";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("projects");

  const renderView = () => {
    switch (activeView) {
      case "models": return <Models />;
      case "projects": return <ProjectList setActiveView={setActiveView} />;
      case "createProject": return <ProjectWizard />;
      case "annotators": return <AnnotatorManager />;
      case "monitoring": return <Monitoring />;
      case "exports": return <Exports />;
      default: return <ProjectList setActiveView={setActiveView} />;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <Box sx={{ flexGrow: 1, p: 3, overflow: "auto" }}>
        <Typography variant="h4" gutterBottom>
          Provider Dashboard
        </Typography>
        {renderView()}
      </Box>
    </Box>
  );
}