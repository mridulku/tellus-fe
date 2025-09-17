import * as React from "react";
import {
  Box,
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Cancel";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const rows = [
 { feature: "Site-specific footage",          ours: "check",  theirs: "cross" },
 { feature: "29-language voice-over",         ours: "check",  theirs: "warning" },
 { feature: "SCORM / xAPI package in 1 min",  ours: "check",  theirs: "cross" },
 { feature: "Immutable compliance logs",      ours: "check",  theirs: "cross" },
 { feature: "Unit-level quiz analytics",      ours: "check",  theirs: "warning" }
];


function icon(type) {
  if (type === "check")
    return <CheckIcon sx={{ color: "#FFD700" }} />;
  if (type === "warning")
    return <WarningAmberIcon sx={{ color: "#b3b3b3" }} />;
  return <CloseIcon sx={{ color: "#555" }} />;
}

export default function WhyDifferentTable() {
  return (
    <Box sx={{ py: 8, bgcolor: "#0d0020" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 3, fontWeight: 700 }}
        >
          Talk-AI vs. Generic Safety Vendors
        </Typography>

        <Table
          sx={{
            maxWidth: 900,
            mx: "auto",
            "& th, & td": { borderColor: "#25133a" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Talk-AI
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>
                Typical Apps
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.feature}>
                <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>
                  {r.feature}
                </TableCell>
                <TableCell align="center">{icon(r.ours)}</TableCell>
                <TableCell align="center">{icon(r.theirs)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Typography
          variant="body2"
          sx={{ textAlign: "center", mt: 3, color: "text.secondary" }}
        >
          Everything in one platform—no juggling DVDs, WhatsApp videos and paper logs.
        </Typography>
      </Container>
    </Box>
  );
}