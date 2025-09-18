import React, { useState } from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button } from "@mui/material";

export default function ProjectList({ setActiveView }) {
  const [projects] = useState([
    { id: 1, name: "SFT Project A", type: "SFT", status: "Active" },
    { id: 2, name: "RM Project B", type: "Reward Model", status: "Paused" }
  ]);

  return (
    <Box>
      <Typography variant="h5">Projects</Typography>
      <Button variant="contained" onClick={() => setActiveView("createProject")} sx={{ my: 2 }}>Create Project</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.type}</TableCell>
              <TableCell>{p.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}