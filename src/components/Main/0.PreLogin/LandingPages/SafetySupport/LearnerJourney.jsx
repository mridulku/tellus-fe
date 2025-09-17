import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
} from "@mui/material";

const stages = [
  {
    label: "",
    icon: "📅",
    color: "linear-gradient(135deg,#fca5a5 0%,#f87171 100%)",
    headline: "Capture",
    body: "Snap 3 photos of the hazard zone.",
  },
  {
    label: "",
    icon: "💡",
    color: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
    headline: "Generate",
    body: "AI renders multilingual video & quiz.",
  },
  {
    label: "",
    icon: "🔄",
    color: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
    headline: "Deliver",
    body: "WhatsApp or kiosk push to crew.",
  },
  {
    label: "",
    icon: "🧪",
    color: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
    headline: "Verify",
    body: "Adaptive quiz logs proof.",
  },
  {
    label: "",
    icon: "🚩",
    color: "linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)",
    headline: "Refresh",
    body: "System nudges only those who need retraining.",
  },
];

export default function LearnerJourney() {
  return (
    <Box sx={{ py: 10, bgcolor: "#0d0020" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 6, fontWeight: 700 }}
        >
          Capture → Generate → Deliver → Verify (+ Refresh)
        </Typography>

        <Grid container spacing={4}>
          {stages.map((s, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={2.4} key={s.label}>
              <Card
                elevation={3}
                sx={{
                  height: "100%",
                  borderRadius: 4,
                  background: s.color,
                  color: "#fff",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: "rgba(0,0,0,0.25)",
                      width: 48,
                      height: 48,
                      mb: 2,
                      fontSize: 24,
                    }}
                  >
                    {s.icon}
                  </Avatar>

                  <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                    Step {idx + 1} of 5 – {s.label}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mt: 0.5, mb: 1 }}
                  >
                    {s.headline}
                  </Typography>

                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {s.body}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}