// src/pages/Homepage.jsx
import React from "react";
 import { Box, Container, Typography, Grid, Card, CardContent, Button } from "@mui/material";
 import { Link as RouterLink } from "react-router-dom";import DashboardIcon from "@mui/icons-material/Dashboard";
import EditNoteIcon from "@mui/icons-material/EditNote";

export default function Homepage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.100", display: "flex", alignItems: "center" }}>
      <Container maxWidth="md">
        {/* Welcome Header */}
        <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: "bold" }}>
          Welcome to Telus Digital
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          What do you want to access?
        </Typography>

        {/* Option Cards */}
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
          {/* Annotation Workspace */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 2, textAlign: "center", boxShadow: 4, borderRadius: 3 }}>
              <EditNoteIcon sx={{ fontSize: 50, color: "primary.main", mb: 2 }} />
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Annotation Workspace
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Access the user-facing annotation tool to review, label, and manage tasks.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  color="primary"
                  size="large"
                  href="/annotator"
                >
                  Go to Workspace
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Dashboard */}
          <Grid item xs={12} sm={6}>
            <Card sx={{ p: 2, textAlign: "center", boxShadow: 4, borderRadius: 3 }}>
              <DashboardIcon sx={{ fontSize: 50, color: "secondary.main", mb: 2 }} />
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Admin Dashboard
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Explore analytics, monitor quality, and manage annotation pipelines.
                </Typography>
                <Button
                     component={RouterLink} to="/dashboard"
   variant="contained" fullWidth color="secondary" size="large"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Typography
          variant="caption"
          align="center"
          display="block"
          sx={{ mt: 6, color: "text.disabled" }}
        >
          © 2025 Telus Digital
        </Typography>
      </Container>
    </Box>
  );
}