import React from "react";
import { List, ListItemButton, ListItemText, Typography } from "@mui/material";

/** Dummy list – replace with API data later */
const DUMMY_ITEMS = [
  { id: "a1", label: "Sample Item A" },
  { id: "b2", label: "Sample Item B" },
  { id: "c3", label: "Sample Item C" },
];

export default function SelectionPanel({ onSelect = () => {} }) {
  return (
    <List dense sx={{ p: 0 }}>
      {DUMMY_ITEMS.map((it) => (
        <ListItemButton
          key={it.id}
          onClick={() => onSelect(it.id, it.label)}
          sx={{
            borderBottom: "1px solid #333",
            "&:hover": { bgcolor: "#222" },
          }}
        >
          <ListItemText
            primary={<Typography sx={{ color: "#FFF" }}>{it.label}</Typography>}
          />
        </ListItemButton>
      ))}
    </List>
  );
}