// src/components/Main/0.tellus/annotator/TopBar.jsx
import React from "react";
import { AppBar, Toolbar, Typography, Box, Avatar } from "@mui/material";

export default function TopBar() {
  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ borderBottom: "1px solid #eee" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Annotator Portal
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">v0.1 demo</Typography>
          <Avatar sx={{ bgcolor: "primary.main" }}>A</Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}