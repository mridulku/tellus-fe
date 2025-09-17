/**********************************************************************
 *  ExamGuidelinesViewer.jsx
 *  ---------------------------------------------------------------
 *  • One collapsible tree:  Book  ▶  Chapter ▶ Sub‑chapter ▶ Concept
 *  • For every concept it shows:
 *        ▸ “In Guidelines?”   ( ✓  /  ✗ )
 *        ▸ Weightage          (0‑100)   ← guideline‑derived score
 *
 *  • Re‑uses the same dark theme colours you’ve defined
 *  • Completely self‑contained—no external state yet
 *********************************************************************/

import React, { useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Stack,
  LinearProgress,
  Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

// ------------------------------------------------------------------
// 1)  🔧  Replace this with real guideline‑parser output later
// ------------------------------------------------------------------
const MOCK_DATA = [
  {
    bookTitle: "Physics – Vol 1",
    chapters: [
      {
        chapterTitle: "Kinematics",
        subChapters: [
          {
            subTitle: "Motion in One Dimension",
            concepts: [
              { name: "Displacement & Distance", inGuide: true, weight: 4 },
              { name: "Average & Instantaneous Velocity", inGuide: true, weight: 6 },
              { name: "Uniform Acceleration", inGuide: false, weight: 0 }
            ]
          },
          {
            subTitle: "Projectile Motion",
            concepts: [
              { name: "Range Formula", inGuide: true, weight: 8 },
              { name: "Trajectory Equation", inGuide: true, weight: 5 }
            ]
          }
        ]
      },
      {
        chapterTitle: "Dynamics",
        subChapters: [
          {
            subTitle: "Newton’s Laws",
            concepts: [
              { name: "Free‑Body Diagrams", inGuide: true, weight: 10 },
              { name: "Friction", inGuide: false, weight: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    bookTitle: "Physics – Vol 2",
    chapters: [
      {
        chapterTitle: "Electrostatics",
        subChapters: [
          {
            subTitle: "Coulomb’s Law",
            concepts: [
              { name: "Point Charges", inGuide: true, weight: 7 },
              { name: "Continuous Charge", inGuide: true, weight: 3 }
            ]
          }
        ]
      }
    ]
  }
];

// ---------------------------  tiny helpers  ------------------------
const GuideBadge = ({ inGuide }) =>
  inGuide ? (
    <Chip
      icon={<CheckCircleIcon />}
      label="In Guide"
      color="success"
      size="small"
      sx={{ fontWeight: 600 }}
    />
  ) : (
    <Chip
      icon={<CancelIcon />}
      label="Omitted"
      color="default"
      size="small"
      sx={{ fontWeight: 600 }}
    />
  );

const WeightBar = ({ weight }) => (
  <Tooltip title={`Weightage ${weight}%`}>
    <Box sx={{ minWidth: 120 }}>
      <LinearProgress
        variant="determinate"
        value={weight}
        sx={{
          height: 8,
          borderRadius: 4,
          "& .MuiLinearProgress-bar": { backgroundColor: "#FFD700" } // gold
        }}
      />
    </Box>
  </Tooltip>
);

// ==================================================================
// 2)  MAIN COMPONENT
// ==================================================================
export default function ExamGuidelinesViewer({ data = MOCK_DATA, colorScheme = {} }) {
  const [expanded, setExpanded] = useState(false);
  const handleExpand = (panel) => (_, isExpanded) =>
    setExpanded(isExpanded ? panel : false);

  return (
    <Box sx={{ my: 4 }}>
      <Typography
        variant="h4"
        sx={{ color: colorScheme.heading || "#B39DDB", mb: 2, fontWeight: 700 }}
      >
        Exam Guidelines Mapping
      </Typography>

      {data.map((book, idxBook) => (
        <Accordion
          key={idxBook}
          expanded={expanded === `book-${idxBook}`}
          onChange={handleExpand(`book-${idxBook}`)}
          sx={{
            bgcolor: colorScheme.cardBg || "#1F1F1F",
            color: "#FFFFFF",
            "&:before": { display: "none" }
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#B39DDB" }} />}>
            <Typography sx={{ fontWeight: 600 }}>{book.bookTitle}</Typography>
          </AccordionSummary>

          <AccordionDetails>
            {book.chapters.map((ch, idxCh) => (
              <Accordion
                key={idxCh}
                sx={{
                  bgcolor: "#2A2A2A",
                  mb: 1,
                  "&:before": { display: "none" }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#B39DDB" }} />}>
                  <Typography sx={{ fontWeight: 600 }}>{ch.chapterTitle}</Typography>
                </AccordionSummary>

                <AccordionDetails>
                  {ch.subChapters.map((sub, idxSub) => (
                    <Accordion
                      key={idxSub}
                      sx={{
                        bgcolor: "#333",
                        mb: 1,
                        "&:before": { display: "none" }
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: "#B39DDB" }} />}
                      >
                        <Typography>{sub.subTitle}</Typography>
                      </AccordionSummary>

                      <AccordionDetails>
                        {sub.concepts.map((c, idxC) => (
                          <Box
                            key={idxC}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              py: 0.8,
                              px: 1.2,
                              bgcolor: "#424242",
                              borderRadius: 1,
                              mb: 0.5
                            }}
                          >
                            <Typography variant="body2">{c.name}</Typography>

                            <Stack direction="row" spacing={2} alignItems="center">
                              <GuideBadge inGuide={c.inGuide} />
                              <WeightBar weight={c.weight} />
                            </Stack>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}