// src/components/Main/0.tellus/annotator/ProjectList.jsx
import React from "react";
import { Box, Typography, Grid, Card, CardContent, Button, Chip } from "@mui/material";

export default function ProjectList({ projects, annotations, onOpenProject }) {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Projects</Typography>
      <Grid container spacing={2}>
        {projects.map((p) => {
          const done = p.tasks.filter(t => annotations[t.id]?.status === "done").length;
          return (
            <Grid item xs={12} md={6} key={p.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">{p.category}</Typography>
                  <Typography variant="h6">{p.name}</Typography>
                  <Chip size="small" sx={{ mt: 1, mr: 1 }} label={p.type} />
{p.subtype && <Chip size="small" sx={{ mt: 1, mr: 1 }} label={p.subtype} />}
{p.adversarial && <Chip size="small" color="warning" sx={{ mt: 1 }} label="Adversarial" />}
                  <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">{p.description}</Typography>
                  <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                    {done}/{p.tasks.length} completed
                  </Typography>
                  <Button sx={{ mt: 1 }} variant="contained" onClick={() => onOpenProject(p.id)}>Open</Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}