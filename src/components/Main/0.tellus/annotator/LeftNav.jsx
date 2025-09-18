// src/components/Main/0.tellus/annotator/LeftNav.jsx
import React from "react";
import { Drawer, Toolbar, List, ListItemButton, ListItemText, ListItemIcon } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InsightsIcon from "@mui/icons-material/Insights";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 240;

export default function LeftNav({ view, onChangeView }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
      }}
    >
      <Toolbar />
      <List>
        <ListItemButton selected={view === "dashboard"} onClick={() => onChangeView("dashboard")}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton selected={view === "stats"} onClick={() => onChangeView("stats")}>
          <ListItemIcon><InsightsIcon /></ListItemIcon>
          <ListItemText primary="Statistics" />
        </ListItemButton>

        <ListItemButton selected={view === "performance"} onClick={() => onChangeView("performance")}>
          <ListItemIcon><EmojiEventsIcon /></ListItemIcon>
          <ListItemText primary="My Performance" />
        </ListItemButton>

        <ListItemButton selected={view === "settings"} onClick={() => onChangeView("settings")}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </List>
    </Drawer>
  );
}