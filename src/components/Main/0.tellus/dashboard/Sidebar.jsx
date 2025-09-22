import React from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  ListSubheader,
} from "@mui/material";

function Emoji({ children }) {
  return (
    <Box component="span" sx={{ fontSize: 20, lineHeight: 1 }}>
      {children}
    </Box>
  );
}

export default function Sidebar({ activeView, setActiveView }) {
  const primaryItems = [
    { key: "projects",       label: "View Projects",  emoji: "📁" },
    { key: "createProject",  label: "Create Project", emoji: "➕" },
    { key: "models",         label: "Models",         emoji: "🤖" },
    { key: "annotators",     label: "Annotators",     emoji: "👥" },
    { key: "exports",        label: "Exports",        emoji: "📦" },
  ];

  const accountItems = [
    { key: "notifications",  label: "Notifications",  emoji: "🔔" },
    { key: "profile",        label: "Profile",        emoji: "👤" },
    { key: "orgSettings",    label: "Org Settings",   emoji: "🏢" },
  ];

  const Item = ({ item }) => (
    <ListItemButton
      selected={activeView === item.key}
      onClick={() => setActiveView(item.key)}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Emoji>{item.emoji}</Emoji>
      </ListItemIcon>
      <ListItemText primary={item.label} />
    </ListItemButton>
  );

  return (
    <Box
      sx={{
        width: 240,
        height: "100vh",
        borderRight: theme => `1px solid ${theme.palette.divider}`,
        position: "sticky",
        top: 0,
        bgcolor: "background.paper",
        pt: "56px",   // <<< offset to match AppBar height
      }}
    >
      <List
        dense
        subheader={<ListSubheader component="div">Workspace</ListSubheader>}
      >
        {primaryItems.map((it) => (
          <Item key={it.key} item={it} />
        ))}
      </List>

      <Divider />

      <List
        dense
        subheader={<ListSubheader component="div">Account</ListSubheader>}
      >
        {accountItems.map((it) => (
          <Item key={it.key} item={it} />
        ))}
      </List>
    </Box>
  );
}