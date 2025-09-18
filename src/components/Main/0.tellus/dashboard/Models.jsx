import React, { useState } from "react";
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Dialog, TextField } from "@mui/material";

export default function Models() {
  const [models, setModels] = useState([]);
  const [open, setOpen] = useState(false);
  const [newModel, setNewModel] = useState({ name: "", provider: "", apiKey: "" });

  const handleAdd = () => {
    setModels([...models, { ...newModel, id: Date.now(), status: "Active" }]);
    setOpen(false);
  };

  return (
    <Box>
      <Typography variant="h5">Connected Models</Typography>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ my: 2 }}>Add Model</Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Provider</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Projects Linked</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {models.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{m.name}</TableCell>
              <TableCell>{m.provider}</TableCell>
              <TableCell>{m.status}</TableCell>
              <TableCell>0</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Model Name" onChange={(e) => setNewModel({ ...newModel, name: e.target.value })} />
          <TextField label="Provider" onChange={(e) => setNewModel({ ...newModel, provider: e.target.value })} />
          <TextField label="API Key" onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })} />
          <Button variant="contained" onClick={handleAdd}>Save</Button>
        </Box>
      </Dialog>
    </Box>
  );
}