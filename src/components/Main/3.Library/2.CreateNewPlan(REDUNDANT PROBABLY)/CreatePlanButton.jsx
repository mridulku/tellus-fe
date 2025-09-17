// File: ChildStats.jsx (Minimal pen-only component)
import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import EditAdaptivePlanModal from "./AdaptivePlanModal/EditAdaptivePlanModal";

export default function ChildStats({
  userId,
  bookId,
  colorScheme = {},
  backendURL = import.meta.env.VITE_BACKEND_URL,
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  const accent = colorScheme.accent || "#BB86FC";

  return (
    <Box>
      <IconButton
        onClick={() => setEditModalOpen(true)}
        sx={{ color: accent }}
        title="Edit Plan"
      >
        <EditIcon />
      </IconButton>

      <EditAdaptivePlanModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userId={userId}
        bookId={bookId}
        backendURL={backendURL}
        colorScheme={colorScheme}
      />
    </Box>
  );
}