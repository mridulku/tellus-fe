import * as React from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckIcon from "@mui/icons-material/Check";

import LockIcon from '@mui/icons-material/Lock';          // filled style
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';


const layerData = [
  {
    title: "Generation Layer",
    subtitle: "Turns a phone clip into a SCORM-ready safety module.",
    bullets: [
      "Runway Gen-3 / Pika V-2 synthesis",
      "ElevenLabs multilingual voice-over"
    ],
    icon: <VideoLibraryIcon sx={{ fontSize: 46, color: "#FFD54F" }} />,
    bg: "linear-gradient(180deg,#131313 0%,#1E1E1E 100%)"
  },
  {
    title: "Compliance Vault Layer",
    subtitle: "Logs every prompt, seed & quiz score for audit-proof records.",
    bullets: [
      "Immutable hash + timestamp",
      "Instant reports for ISO-45001 / OSHA"
    ],
    icon: <LockIcon sx={{ fontSize: 46, color: "#4FC3F7" }} />,
    bg: "linear-gradient(180deg,#1E1E1E 0%,#222222 100%)"
  }
];


export default function EngineLayers() {
  return (
    <Box sx={{ py: 10, bgcolor: "#120022" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 6, fontWeight: 700 }}
        >
          Hazard-Intelligence Layer + Operator-Mastery Layer
        </Typography>

        {/* make grid 3-column on desktop so the “+” sits naturally */}
        <Grid container spacing={4} alignItems="stretch">
          {/* layer 1 */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{ p: 4, height: "100%", background: layerData[0].bg, borderRadius: 3 }}
            >
              {layerData[0].icon}
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                {layerData[0].title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                {layerData[0].subtitle}
              </Typography>
              <List dense>
                {layerData[0].bullets.map((b) => (
                  <ListItem key={b} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckIcon sx={{ color: "#FFD700", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary={b} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* plus icon */}
          <Grid
            item
            xs={12}
            md={2}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pb: { xs: 2, md: 0 },
            }}
          >
            <AddCircleOutlineIcon sx={{ fontSize: 56, color: "#FFD700" }} />
          </Grid>

          {/* layer 2 */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={3}
              sx={{ p: 4, height: "100%", background: layerData[1].bg, borderRadius: 3 }}
            >
              {layerData[1].icon}
              <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                {layerData[1].title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                {layerData[1].subtitle}
              </Typography>
              <List dense>
                {layerData[1].bullets.map((b) => (
                  <ListItem key={b} sx={{ py: 0 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <CheckIcon sx={{ color: "#FFD700", fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText primary={b} primaryTypographyProps={{ variant: "body2" }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        <Typography
          variant="body1"
          sx={{
            mt: 6,
            textAlign: "center",
            color: "text.secondary",
            maxWidth: 720,
            mx: "auto",
          }}
        >
          These two brains ensure every worker gets the exact safety clip & proof they need—no more, no less.
        </Typography>
      </Container>
    </Box>
  );
}