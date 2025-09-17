// src/components/ExamPaperBrowser.jsx
// -------------------------------------------------------------
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";

// ───────────────────────────────────────────────────────────────
// 1. Dummy data  ── shape: papers ➜ questions[]
// ───────────────────────────────────────────────────────────────
const SAMPLE_PAPERS = [
  {
    id: "jee_adv_2023_p1",
    label: "JEE Advanced 2023 – Paper 1",
    questions: [
      {
        num: 1,
        stem: "A block slides down a rough incline of angle θ with constant velocity…",
        qType: "MCQ (Single correct)",
        concepts: ["Dynamics", "Friction", "Inclined Plane"],
      },
      {
        num: 2,
        stem: "Find the general solution of the differential equation dy/dx + y = eˣ …",
        qType: "Numerical",
        concepts: ["Differential Equations", "First‑order ODE"],
      },
      // …more
    ],
  },
  {
    id: "jee_adv_2022_p2",
    label: "JEE Advanced 2022 – Paper 2",
    questions: [
      {
        num: 7,
        stem: "For the circuit shown, calculate the power dissipated across R₂ …",
        qType: "MCQ (Multiple correct)",
        concepts: ["Electric Circuits", "Kirchhoff Laws"],
      },
      // …more
    ],
  },
  {
    id: "jee_main_2024_jan",
    label: "JEE Main 2024 (Jan attempt)",
    questions: [
      {
        num: 15,
        stem: "The work function of a metal surface is 2.3 eV …",
        qType: "Numerical",
        concepts: ["Photoelectric Effect", "Modern Physics"],
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// 2. Helper – pretty concept chips
// ───────────────────────────────────────────────────────────────
function ConceptChips({ list = [] }) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {list.map((c) => (
        <Chip
          key={c}
          label={c}
          size="small"
          sx={{
            bgcolor: "primary.main",
            color: "#000",
            fontSize: "0.7rem",
            fontWeight: 600,
          }}
        />
      ))}
    </Stack>
  );
}

// ───────────────────────────────────────────────────────────────
// 3. Main component
// ───────────────────────────────────────────────────────────────
export default function ExamPaperBrowser() {
  const [selectedPaperId, setSelectedPaperId] = useState(SAMPLE_PAPERS[0].id);

  // pull current paper
  const currentPaper =
    SAMPLE_PAPERS.find((p) => p.id === selectedPaperId) || SAMPLE_PAPERS[0];

  return (
    <Box sx={{ py: 6 }}>
      <Container>
        {/* ── Paper selector ─────────────────────────────── */}
        <Card
          variant="outlined"
          sx={{
            mb: 4,
            bgcolor: "background.paper",
            borderColor: "primary.main",
          }}
        >
          <CardContent>
            <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
              Select Exam Paper
            </Typography>

            <Select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              sx={{
                minWidth: 280,
                bgcolor: "#2A2A2A",
                color: "primary.main",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              }}
            >
              {SAMPLE_PAPERS.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label}
                </MenuItem>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* ── Question table ─────────────────────────────── */}
        <Paper variant="outlined" sx={{ bgcolor: "background.paper" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: "secondary.main", width: 60 }}>
                  #
                </TableCell>
                <TableCell sx={{ color: "secondary.main" }}>Question (snippet)</TableCell>
                <TableCell sx={{ color: "secondary.main", width: 170 }}>
                  Type
                </TableCell>
                <TableCell sx={{ color: "secondary.main", width: 260 }}>
                  Concept Tags
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {currentPaper.questions.map((q) => (
                <TableRow key={q.num}>
                  <TableCell sx={{ color: "text.primary" }}>{q.num}</TableCell>
                  <TableCell sx={{ color: "text.primary" }}>{q.stem}</TableCell>
                  <TableCell sx={{ color: "text.primary" }}>{q.qType}</TableCell>
                  <TableCell>
                    <ConceptChips list={q.concepts} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Container>
    </Box>
  );
}