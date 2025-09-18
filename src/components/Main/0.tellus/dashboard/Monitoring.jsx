import React from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress } from "@mui/material";

export default function Monitoring() {
  const projects = [
    { id: 1, name: "SFT Project A", completion: 60, agreement: "0.78 κ", flags: 3 },
    { id: 2, name: "Reward Model B", completion: 85, agreement: "0.82 κ", flags: 1 }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Monitoring Dashboard</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Completion</TableCell>
            <TableCell>Agreement</TableCell>
            <TableCell>Flags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell>
                <LinearProgress variant="determinate" value={p.completion} />
                {p.completion}%
              </TableCell>
              <TableCell>{p.agreement}</TableCell>
              <TableCell>{p.flags}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}