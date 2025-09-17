/**************************************************************************
 *  ConceptMappingView.jsx
 *  -------------------------------------------------------------
 *  • Renders Book → Chapter → Sub‑chapter → Concept hierarchy
 *  • Shows weightage, target / current accuracy, target / current
 *    speed‑penalty for every concept
 *  • Aggregates scores upward and displays a global summary card
 **************************************************************************/

import React, { useMemo } from "react";
import {
  Box, Paper, Typography, Accordion, AccordionSummary, AccordionDetails,
  Stack, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress,
  Chip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

// ------------------------------------------------------------------
// 1) Dummy hierarchical data (swap with API / Firestore later)
// ------------------------------------------------------------------
const dummyData = [
  {
    book: "Physics Vol‑1",
    chapters: [
      {
        title: "Kinematics",
        subChapters: [
          {
            title: "Motion in 1‑D",
            concepts: [
              {
                name: "Displacement & Distance",
                weight: 2,
                tgtAcc: 0.90,
                curAcc: 0.72,
                tgtSpd: 6,
                curSpd: 9
              },
              {
                name: "Average & Instantaneous Velocity",
                weight: 3,
                tgtAcc: 0.92,
                curAcc: 0.68,
                tgtSpd: 6,
                curSpd: 8
              }
            ]
          },
          {
            title: "Motion in 2‑D",
            concepts: [
              {
                name: "Projectile Basics",
                weight: 4,
                tgtAcc: 0.88,
                curAcc: 0.55,
                tgtSpd: 8,
                curSpd: 11
              }
            ]
          }
        ]
      },
      {
        title: "Laws of Motion",
        subChapters: [
          {
            title: "Newton’s Laws",
            concepts: [
              {
                name: "Free‑Body Diagrams",
                weight: 5,
                tgtAcc: 0.93,
                curAcc: 0.60,
                tgtSpd: 7,
                curSpd: 12
              }
            ]
          }
        ]
      }
    ]
  },
  {
    book: "Physics Vol‑2",
    chapters: [
      {
        title: "Work, Energy & Power",
        subChapters: [
          {
            title: "Work‑Energy Theorem",
            concepts: [
              {
                name: "Kinetic Energy Change",
                weight: 3,
                tgtAcc: 0.90,
                curAcc: 0.75,
                tgtSpd: 8,
                curSpd: 8
              }
            ]
          }
        ]
      }
    ]
  }
];

// ------------------------------------------------------------------
// 2) Helper to aggregate concept‑level metrics up any branch
// ------------------------------------------------------------------
function aggregate(node) {
  if (node.concepts) return node.concepts.reduce(
    (acc, c) => ({
      weight: acc.weight + c.weight,
      tgtScore: acc.tgtScore + c.weight * c.tgtAcc,
      curScore: acc.curScore + c.weight * c.curAcc
    }),
    { weight: 0, tgtScore: 0, curScore: 0 }
  );

  if (node.subChapters) {
    return node.subChapters.reduce(
      (acc, sc) => {
        const a = aggregate(sc);
        return {
          weight: acc.weight + a.weight,
          tgtScore: acc.tgtScore + a.tgtScore,
          curScore: acc.curScore + a.curScore
        };
      },
      { weight: 0, tgtScore: 0, curScore: 0 }
    );
  }

  if (node.chapters) {
    return node.chapters.reduce(
      (acc, ch) => {
        const a = aggregate(ch);
        return {
          weight: acc.weight + a.weight,
          tgtScore: acc.tgtScore + a.tgtScore,
          curScore: acc.curScore + a.curScore
        };
      },
      { weight: 0, tgtScore: 0, curScore: 0 }
    );
  }
  return { weight: 0, tgtScore: 0, curScore: 0 };
}

// Map percentage → illustrative rank label
const rankTier = (pct) =>
  pct >= 0.85 ? "≈ Rank < 500"
  : pct >= 0.70 ? "≈ Rank < 2 000"
  : pct >= 0.55 ? "≈ Rank < 5 000"
  : "Needs Work";

// ------------------------------------------------------------------
// 3) Leaf renderer – single concept row
// ------------------------------------------------------------------
const ConceptRow = ({ c }) => (
  <TableRow hover>
    <TableCell>{c.name}</TableCell>
    <TableCell align="right">{c.weight}</TableCell>
    <TableCell align="right">{Math.round(c.tgtAcc * 100)} %</TableCell>
    <TableCell align="right">{Math.round(c.curAcc * 100)} %</TableCell>
    <TableCell align="right">{c.tgtSpd}s</TableCell>
    <TableCell align="right">{c.curSpd}s</TableCell>
  </TableRow>
);

// ------------------------------------------------------------------
// 4) Recursive Accordion tree
// ------------------------------------------------------------------
function NodeAccordion({ node, level = 0 }) {
  const pad = level * 1.5; // indent
  const agg = useMemo(() => aggregate(node), [node]);
  const pct = agg.weight ? agg.curScore / agg.weight : 0;

  const header =
    node.book || node.title || "Untitled";

  return (
    <Accordion defaultExpanded sx={{ ml: pad }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={2} alignItems="center" width="100%">
          <Typography sx={{ flexGrow: 1, fontWeight: 600 }}>
            {header}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={pct * 100}
            sx={{ flexBasis: 120, height: 6, borderRadius: 4 }}
          />
          <Typography variant="caption" sx={{ width: 48, textAlign: "right" }}>
            {Math.round(pct * 100)}%
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        {/* Leaf → concept table */}
        {node.concepts && (
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Concept</TableCell>
                <TableCell align="right">Weight</TableCell>
                <TableCell align="right">Target Acc</TableCell>
                <TableCell align="right">Current Acc</TableCell>
                <TableCell align="right">Target Spd</TableCell>
                <TableCell align="right">Current Spd</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {node.concepts.map((c) => (
                <ConceptRow key={c.name} c={c} />
              ))}
            </TableBody>
          </Table>
        )}

        {/* Mid‑nodes */}
        {node.subChapters &&
          node.subChapters.map((sc) => (
            <NodeAccordion key={sc.title} node={sc} level={level + 1} />
          ))}
        {node.chapters &&
          node.chapters.map((ch) => (
            <NodeAccordion key={ch.title} node={ch} level={level + 1} />
          ))}
      </AccordionDetails>
    </Accordion>
  );
}

// ------------------------------------------------------------------
// 5) Main exported component
// ------------------------------------------------------------------
export default function ConceptMappingView() {
  // Global aggregate across all books
  const global = useMemo(() => {
    return dummyData.reduce(
      (acc, b) => {
        const a = aggregate(b);
        return {
          weight: acc.weight + a.weight,
          tgtScore: acc.tgtScore + a.tgtScore,
          curScore: acc.curScore + a.curScore
        };
      },
      { weight: 0, tgtScore: 0, curScore: 0 }
    );
  }, []);

  const pct = global.weight ? global.curScore / global.weight : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* Global summary card */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          bgcolor: "background.paper",
          border: "1px solid #3A3A3A"
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Overall Competence Progress
          </Typography>
          <LinearProgress
            variant="determinate"
            value={pct * 100}
            sx={{ flexBasis: 160, height: 8, borderRadius: 4 }}
          />
          <Typography sx={{ minWidth: 48, textAlign: "right" }}>
            {Math.round(pct * 100)}%
          </Typography>
          <Chip
            label={rankTier(pct)}
            color={pct >= 0.85 ? "success" : pct >= 0.70 ? "primary" : "warning"}
            size="small"
          />
        </Stack>
      </Paper>

      {/* Tree of books */}
      {dummyData.map((b) => (
        <NodeAccordion key={b.book} node={b} />
      ))}
    </Box>
  );
}