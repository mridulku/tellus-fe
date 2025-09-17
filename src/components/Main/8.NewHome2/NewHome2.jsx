import React, { useState } from "react";
import { Grid, Box } from "@mui/material";

// child tools
import SelectionPanel from "./Support/SelectionPanel";
import DisplayPane    from "./Support/DisplayPane";

export default function NewHome2({
  userId,
  onOpenOnboarding = () => {},
  onOpenPlayer     = () => {},
  themeColors = {
    background:   "#111",
    sidebarBg:    "#000",
    accent:       "#BB86FC",
    textPrimary:  "#FFF",
    borderColor:  "#333",
  },
}) {
  // which item (id + label) is chosen in the left list?
  const [activeId,   setActiveId]   = useState(null);
  const [activeName, setActiveName] = useState("");

  /** callback passed to SelectionPanel */
  function handleSelect(id, name) {
    setActiveId(id);
    setActiveName(name);
  }

  return (
    <Grid container sx={{ width: "100%", height: "100%" }}>
      {/* ───────────── LEFT • selection list ───────────── */}
      <Grid
        item xs={12} md={4} lg={3}
        sx={{
          borderRight: `1px solid ${themeColors.borderColor}`,
          background:  themeColors.sidebarBg,
        }}
      >
        <SelectionPanel
          userId={userId}
          onSelect={handleSelect}
          onOpenOnboarding={onOpenOnboarding}
        />
      </Grid>

      {/* ───────────── RIGHT • main content ───────────── */}
      <Grid
        item xs={12} md={8} lg={9}
        sx={{ background: themeColors.background }}
      >
        <Box
          sx={{
            position: "relative",
            p: 2,
            height: "100%",
            overflowY: "auto",
            color: themeColors.textPrimary,
          }}
        >
          <DisplayPane
            userId={userId}
            itemId={activeId}
            itemName={activeName}
            onOpenPlayer={onOpenPlayer}
          />

          {/* ← add floating buttons / stats here later */}
        </Box>
      </Grid>
    </Grid>
  );
}