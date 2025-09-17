// File: QuizSubmissionDetails.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

export default function QuizSubmissionDetails({ attempt }) {
  // e.g. { attemptNumber, score, quizSubmission, timestamp, ... }
  if (!attempt?.quizSubmission) {
    return null;
  }

  // Score might be "33.33%" or numeric
  const scoreStr = attempt.score || "(no score)";

  return (
    <Box sx={{ border: "1px solid #666", p: 1, borderRadius: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Attempt #{attempt.attemptNumber}, Score: {scoreStr}
      </Typography>

      {attempt.quizSubmission.map((q, idx) => {
        const userAnswerIdx = parseInt(q.userAnswer, 10);
        const correctIdx = q.correctIndex;
        const userAnswer = q.options[userAnswerIdx] || "(none)";
        const correctAnswer = q.options[correctIdx] || "(none)";
        const passFail = (q.score && parseFloat(q.score) >= 1) ? "PASS" : "FAIL";

        return (
          <Box
            key={idx}
            sx={{
              mb: 2,
              p: 1,
              backgroundColor: "#333",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Q{idx + 1}: {q.question}
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Type:</strong> {q.type || "??"}
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Concept:</strong> {q.conceptName || "(none)"}
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>User Answer:</strong> {userAnswer}
              {userAnswerIdx >= 0 && (
                <span> (Option {userAnswerIdx})</span>
              )}
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Correct Answer:</strong> {correctAnswer}
              {correctIdx >= 0 && (
                <span> (Option {correctIdx})</span>
              )}
            </Typography>

            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>Score:</strong> {q.score || 0} ({passFail})
            </Typography>

            {q.feedback && (
              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: "italic" }}>
                <strong>Feedback:</strong> {q.feedback}
              </Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}