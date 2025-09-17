import React from "react";
import { Typography, Box } from "@mui/material";

/** Very bare-bones placeholder */
export default function DisplayPane({ itemId, itemName }) {
  if (!itemId) {
    return (
      <Typography sx={{ color: "#888", mt: 2 }}>
        ← Pick something from the left panel to see its details here.
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, color: "#BB86FC" }}>
        {itemName}
      </Typography>

      <Typography sx={{ color: "#DDD" }}>
        You selected item <strong>{itemId}</strong>.  
        Replace this component with your real content.
      </Typography>
    </Box>
  );
}