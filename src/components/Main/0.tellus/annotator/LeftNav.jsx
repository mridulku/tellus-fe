// src/components/Main/0.tellus/annotator/LeftNav.jsx
import React, { useMemo } from "react";
import {
  Drawer, Toolbar, List, ListItemButton, ListItemText, ListItemIcon, Chip
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import InsightsIcon from "@mui/icons-material/Insights";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SettingsIcon from "@mui/icons-material/Settings";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import SchoolIcon from "@mui/icons-material/School"; // Invites & Training

const drawerWidth = 240;

export default function LeftNav({ view, onChangeView }) {
  // Onboarding hint
  const onb = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("annotator.onboarding.v1") || "{}"); } catch { return {}; }
  }, []);
  const incomplete = !(onb.emailVerified && onb.profileCompleted && onb.warmupDone && onb.approved);

  // Pending invites count (optional)
  const invites = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("annotator.invites.v1") || "[]"); } catch { return []; }
  }, []);
  const pendingInvites = invites.filter(i => i && i.status !== "accepted" && i.status !== "declined").length;

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
        {/* Onboarding */}
        <ListItemButton selected={view === "onboarding"} onClick={() => onChangeView("onboarding")}>
          <ListItemIcon><HowToRegIcon /></ListItemIcon>
          <ListItemText primary="Onboarding" />
          {incomplete && <Chip size="small" color="warning" label="Start" />}
        </ListItemButton>

        {/* Invites & Training */}
        <ListItemButton selected={view === "invites"} onClick={() => onChangeView("invites")}>
          <ListItemIcon><SchoolIcon /></ListItemIcon>
          <ListItemText primary="Invites & Training" />
          {pendingInvites > 0 && <Chip size="small" color="primary" label={pendingInvites} />}
        </ListItemButton>

        {/* Core */}
        <ListItemButton selected={view === "dashboard"} onClick={() => onChangeView("dashboard")}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        {/* NEW: Notifications */}
        <ListItemButton selected={view === "notifications"} onClick={() => onChangeView("notifications")}>
          <ListItemIcon><NotificationsIcon /></ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItemButton>

        {/* NEW: Profile */}
        <ListItemButton selected={view === "profile"} onClick={() => onChangeView("profile")}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
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