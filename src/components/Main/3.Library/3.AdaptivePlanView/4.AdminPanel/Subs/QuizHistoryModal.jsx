

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import HistoryView from "../../../../5.StudyModal/0.components/Main/Base/HistoryView"; 

/**
 * QuizHistoryModal
 * ----------------
 * A MUI Dialog that fetches quiz/revision data from the same endpoints as StageManager:
 *   - /api/getQuiz
 *   - /api/getRevisions
 *   - /api/getSubchapterConcepts
 *
 * Props:
 *   - open (bool)
 *   - onClose (func)
 *   - subChapterId (string)
 *   - quizStage (string: "remember", "understand", etc.)
 *   - userId (string)
 *   - planId (string) => if needed, matching StageManager
 */
export default function QuizHistoryModal({
  open,
  onClose,
  subChapterId,
  quizStage,
  userId = "",
  planId = "",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // We'll pass some/all of these to <HistoryView>.
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);

  // If you want to replicate “concept stats” logic (like StageManager does), you can do that here:
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);

  // Potential array of recognized quiz stages
  const totalStages = ["remember", "understand", "apply", "analyze"];

  useEffect(() => {
    if (!open) return;
    if (!subChapterId || !quizStage) {
      setError("No subChapterId or quizStage provided.");
      return;
    }
    fetchData();
  }, [open, subChapterId, quizStage]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      // 1) getQuiz => same as StageManager => "http://localhost:3001/api/getQuiz"
      const quizRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getQuiz`, {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
          quizType: quizStage,
        },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // 2) getRevisions => "http://localhost:3001/api/getRevisions"
      const revRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getRevisions`, {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
          revisionType: quizStage,
        },
      });
      const revArr = revRes?.data?.revisions || [];

      // 3) getSubchapterConcepts => "http://localhost:3001/api/getSubchapterConcepts"
      const conceptRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getSubchapterConcepts`, {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      setSubchapterConcepts(conceptArr);

      // If you want to build concept stats for HistoryView, replicate StageManager logic
      // E.g. buildAllAttemptsConceptStats(quizArr, conceptArr)
      const finalStats = buildAllAttemptsConceptStats(quizArr, conceptArr);
      setAllAttemptsConceptStats(finalStats);

      setLoading(false);
    } catch (err) {
      console.error("QuizHistoryModal => fetchData error:", err);
      setError(err.message || "Error loading quiz history");
      setLoading(false);
    }
  }

  // Example "buildAllAttemptsConceptStats" function if your HistoryView needs it:
  function buildAllAttemptsConceptStats(quizArr, conceptArr) {
    // same logic as in StageManager, or simpler
    if (!quizArr.length || !conceptArr.length) {
      return [];
    }

    return quizArr.map((attempt) => {
      const stats = buildConceptStats(attempt.quizSubmission || [], conceptArr);
      return {
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        conceptStats: stats,
      };
    });
  }

  // Or reuse StageManager's logic if you want an import, but let's define it here for completeness:
  function buildConceptStats(quizSubmission, conceptArr) {
    const countMap = {};
    quizSubmission.forEach((q) => {
      const cName = q.conceptName || "UnknownConcept";
      if (!countMap[cName]) {
        countMap[cName] = { correct: 0, total: 0 };
      }
      countMap[cName].total++;
      if (q.score && parseFloat(q.score) >= 1) {
        countMap[cName].correct++;
      }
    });

    // Convert conceptArr => set of concept names
    const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
    if (countMap["UnknownConcept"]) {
      conceptNamesSet.add("UnknownConcept");
    }

    const statsArray = [];
    conceptNamesSet.forEach((cName) => {
      const rec = countMap[cName] || { correct: 0, total: 0 };
      const ratio = rec.total > 0 ? rec.correct / rec.total : 0;
      let passOrFail = "FAIL";
      if (rec.total === 0) {
        passOrFail = "NOT_TESTED";
      } else if (ratio === 1.0) {
        passOrFail = "PASS";
      }
      statsArray.push({
        conceptName: cName,
        correct: rec.correct,
        total: rec.total,
        ratio,
        passOrFail,
      });
    });
    return statsArray;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{ style: { backgroundColor: "#222", color: "#fff" } }}
    >
      <DialogTitle>
        Quiz History – {quizStage.toUpperCase()} (SubCh: {subChapterId})
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <p>Loading quiz history...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <HistoryView
            quizStage={quizStage}
            totalStages={totalStages}
            quizAttempts={quizAttempts}
            revisionAttempts={revisionAttempts}
            // If your HistoryView doesn't need subchapterConcepts, you can omit
            subchapterConcepts={subchapterConcepts}
            allAttemptsConceptStats={allAttemptsConceptStats}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained" color="secondary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}