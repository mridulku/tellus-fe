import React, { useState } from "react";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, TextField } from "@mui/material";

export default function AnnotatorManager() {
  const [annotators, setAnnotators] = useState([
    { id: 1, name: "Alice", projects: 2, quota: 100, accuracy: "92%" },
    { id: 2, name: "Bob", projects: 1, quota: 50, accuracy: "87%" }
  ]);
  const [open, setOpen] = useState(false);
  const [newAnnotator, setNewAnnotator] = useState({ name: "", quota: "" });

  const handleAdd = () => {
    setAnnotators([...annotators, { ...newAnnotator, id: Date.now(), projects: 0, accuracy: "—" }]);
    setOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5">Annotators</Typography>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ my: 2 }}>Add Annotator</Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Projects</TableCell>
            <TableCell>Quota</TableCell>
            <TableCell>Accuracy</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {annotators.map((a) => (
            <TableRow key={a.id}>
              <TableCell>{a.name}</TableCell>
              <TableCell>{a.projects}</TableCell>
              <TableCell>{a.quota}</TableCell>
              <TableCell>{a.accuracy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Annotator Name" onChange={(e) => setNewAnnotator({ ...newAnnotator, name: e.target.value })} />
          <TextField label="Quota" type="number" onChange={(e) => setNewAnnotator({ ...newAnnotator, quota: e.target.value })} />
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </Box>
      </Dialog>
    </Box>
  );
}