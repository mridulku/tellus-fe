import React, { useState } from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Select, MenuItem } from "@mui/material";

export default function Exports() {
  const [exportsList] = useState([
    { id: 1, project: "SFT Project A", type: "SFT", format: "JSONL", date: "2025-09-01" },
    { id: 2, project: "Reward Model B", type: "RM", format: "CSV", date: "2025-09-05" }
  ]);
  const [format, setFormat] = useState("JSONL");

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Exports</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Project</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {exportsList.map((e) => (
            <TableRow key={e.id}>
              <TableCell>{e.project}</TableCell>
              <TableCell>{e.type}</TableCell>
              <TableCell>{e.format}</TableCell>
              <TableCell>{e.date}</TableCell>
              <TableCell><Button variant="outlined">Download</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">New Export</Typography>
        <Select value={format} onChange={(e) => setFormat(e.target.value)} sx={{ mr: 2 }}>
          <MenuItem value="JSONL">JSONL</MenuItem>
          <MenuItem value="CSV">CSV</MenuItem>
        </Select>
        <Button variant="contained">Generate Export</Button>
      </Box>
    </Box>
  );
}