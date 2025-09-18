// src/components/Main/0.tellus/annotator/ProjectOverview.jsx
import React from "react";
import { Box, Typography, Card, CardContent, Button, Chip, Divider, Stack } from "@mui/material";

export default function ProjectOverview({ project, annotations, onBack, onStart }) {
  const done = project.tasks.filter(t => annotations[t.id]?.status === "done").length;

  return (
    <Box>
      <Button onClick={onBack} sx={{ mb: 2 }}>← Back to Projects</Button>
      <Card>
        <CardContent>
<Stack direction="row" spacing={1} sx={{ mb: 1 }}>
  <Chip size="small" label={project.type} />
  {project.subtype && <Chip size="small" label={project.subtype} />}
  {project.adversarial && <Chip size="small" color="warning" label="Adversarial" />}
</Stack>          <Typography variant="h5">{project.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{project.description}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1">Guidelines</Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{project.guidelines}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Progress: {done}/{project.tasks.length} completed
          </Typography>

          <Button sx={{ mt: 2 }} variant="contained" onClick={onStart}>
            Start / Continue Tasks
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}