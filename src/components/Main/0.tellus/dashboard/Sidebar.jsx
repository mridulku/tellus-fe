import React from "react";
import { List, ListItemButton, ListItemText } from "@mui/material";

export default function Sidebar({ activeView, setActiveView }) {
  const items = [
    { key: "projects", label: "Projects" },
    { key: "models", label: "Models" },
    { key: "createProject", label: "Create Project" },
    { key: "annotators", label: "Annotators" },
    { key: "monitoring", label: "Monitoring" },
    { key: "exports", label: "Exports" }
  ];

  return (
    <List sx={{ width: 220, borderRight: "1px solid #ddd" }}>
      {items.map((item) => (
        <ListItemButton
          key={item.key}
          selected={activeView === item.key}
          onClick={() => setActiveView(item.key)}
        >
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );
}