// src/components/Main/0.tellus/dashboard/ProviderTopBar.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, IconButton, Avatar, Tooltip } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

export default function ProviderTopBar({ onOpenOrg, onOpenProfile }) {
  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: "1px solid #e5e7eb" }}>
      <Toolbar sx={{ maxWidth: 1400, mx: "auto", width: "100%" }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>Provider Dashboard</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Notifications">
          <IconButton size="small"><NotificationsNoneIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Organization settings">
          <IconButton size="small" onClick={onOpenOrg}><SettingsIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Profile">
          <Avatar
            sx={{ width: 32, height: 32, ml: 1, cursor: "pointer", bgcolor: "primary.main", color: "white" }}
            onClick={onOpenProfile}
          >
            P
          </Avatar>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}