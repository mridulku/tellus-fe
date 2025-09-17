import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // Adjust path if needed
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

import { fetchQuizTime, incrementQuizTime } from "../../../../../../store/quizTimeSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";
import { refreshSubchapter } from "../../../../../../store/aggregatorSlice";

import { CircularProgress, Fade, Chip } from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTimeRounded";

function Pill({ label, icon }) {
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        bgcolor: "#263238",
        color:  "#eceff1",
        fontWeight: 500,
        ".MuiChip-icon": { color: "#eceff1", ml: -.4 }  // icon colour
      }}
    />
  );
}


import {
  gradeOpenEndedBatch as gradeOpenEndedBatchREAL
} from "./QuizSupport/QuizQuestionGrader";

// Render each question
import QuizQuestionRenderer from "./QuizSupport/QuizQuestionRenderer";

import LastAttemptPanel from "./QuizSupport/LastAttemptPanel";

// GPT generation logic
import { generateQuestions } from "./QuizSupport/QuizQuestionGenerator";

// ============== Utility ==============
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Re-usable logic from HistoryView for final pass/fail per concept
 */

// helper ✨
function LoadingOverlay({ text = "Loading…" }) {
  return (
    <Fade in>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
        }}
      >
        <CircularProgress size={48} color="secondary" />
        <span style={{ marginTop: 12, color: "#eee" }}>{text}</span>
      </div>
    </Fade>
  );
}


function computeConceptStatuses(allAtts) {
  const conceptStatusMap = new Map();
  const conceptSet = new Set();

  const sorted = [...allAtts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  sorted.forEach((attempt) => {
    (attempt.conceptStats || []).forEach((cs) => {
      conceptSet.add(cs.conceptName);
      if (!conceptStatusMap.has(cs.conceptName)) {
        conceptStatusMap.set(cs.conceptName, "NOT_TESTED");
      }
      if (cs.passOrFail === "PASS") {
        conceptStatusMap.set(cs.conceptName, "PASS");
      } else if (cs.passOrFail === "FAIL") {
        // Only mark FAIL if not already PASS
        if (conceptStatusMap.get(cs.conceptName) !== "PASS") {
          conceptStatusMap.set(cs.conceptName, "FAIL");
        }
      }
    });
  });

  return { conceptSet, conceptStatusMap };
}

/**
 * QuizView
 * --------
 * A "card-based" quiz with:
 *  - Aggregator-based concept mastery widget (top-right).
 *  - Generates questions via GPT, times user in lumps of 15s.
 *  - On submit => local/GPT grading => pass/fail => aggregator updates.
 */
export default function QuizView({
  activity,
  userId = "",
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  attemptNumber = 1,
  onQuizComplete,
  onQuizFail,
}) {
  const planId = useSelector((state) => state.plan.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan.currentIndex);
  const dispatch = useDispatch();
  const [showDebug, setShowDebug] = useState(false);

  // Extract activityId & replicaIndex from the activity
  const { activityId, replicaIndex } = activity || {};

  // ---------- Aggregator states for concept mastery ----------
  const [loadingConceptData, setLoadingConceptData] = useState(true);
  const [masteredCount, setMasteredCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [notTestedCount, setNotTestedCount] = useState(0);
  const [conceptStatuses, setConceptStatuses] = useState([]);

  // ─── Recent-attempt accordion ────────────────────────────────
const [lastAttempt, setLastAttempt]   = useState(null);   // { questions, results, score, passed }
const [showLastAttempt, setShowLastAttempt] = useState(false);

  // ---------- Quiz State ----------
  const [questionTypes, setQuestionTypes] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gradingResults, setGradingResults] = useState([]);
  const [showGradingResults, setShowGradingResults] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [finalPercentage, setFinalPercentage] = useState("");

  // Additional info
  const [subchapterSummary, setSubchapterSummary] = useState("");
  const [loading, setLoading] = useState(false);    // For quiz loading/generation
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // ---------- Timer / lumps ----------
  const [serverTotal, setServerTotal] = useState(0);
  const [localLeftover, setLocalLeftover] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  const docIdRef = useRef("");

  // ---------- Pagination ----------
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState([]);
  const QUESTIONS_PER_PAGE = 3;

  // For environment-based OpenAI key
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // ============================================================
  //  1) Fetch aggregator mastery data for this quizStage
  // ============================================================
  useEffect(() => {
    if (!userId || !planId || !subChapterId) {
      setLoadingConceptData(false);
      return;
    }
    async function fetchAggregator() {
      try {
        setLoadingConceptData(true);
        const resp = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`, {
          params: { userId, planId, subchapterId: subChapterId },
        });
        if (resp.data) {
          const stageObj = resp.data.quizStagesData?.[quizStage] || {};
          const allStats = stageObj.allAttemptsConceptStats || [];
          const { conceptSet, conceptStatusMap } = computeConceptStatuses(allStats);
          const totalConcepts = conceptSet.size;

          const passCount = [...conceptStatusMap.values()].filter((v) => v === "PASS").length;
          const failCount = [...conceptStatusMap.values()].filter((v) => v === "FAIL").length;
          const notTested = totalConcepts - passCount - failCount;

          setMasteredCount(passCount);
          setInProgressCount(failCount);
          setNotTestedCount(notTested);

          // Build array for expanded display
          const statusesArr = [];
          conceptSet.forEach((cName) => {
            const finalStat = conceptStatusMap.get(cName) || "NOT_TESTED";
            statusesArr.push({ conceptName: cName, status: finalStat });
          });
          statusesArr.sort((a, b) => a.conceptName.localeCompare(b.conceptName));
          setConceptStatuses(statusesArr);
        }
      } catch (err) {
        console.error("Error fetching aggregator subchapter data:", err);
      } finally {
        setLoadingConceptData(false);
      }
    }
    fetchAggregator();
  }, [userId, planId, subChapterId, quizStage]);

  // ============================================================
  //  2) On mount => fetch questionTypes from Firestore
  // ============================================================
  useEffect(() => {
    async function fetchQuestionTypes() {
      try {
        const snap = await getDocs(collection(db, "questionTypes"));
        const arr = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setQuestionTypes(arr);
      } catch (err) {
        console.error("Error fetching question types:", err);
      }
    }
    fetchQuestionTypes();
  }, []);

  // ============================================================
  //  3) On mount => build docId, fetch usage, generate quiz
  // ============================================================
  useEffect(() => {
    if (!userId || !subChapterId || !planId) {
      console.log("QuizView: userId or subChapterId missing => skip generation.");
      return;
    }
    // docId => user_plan_subCh_quizStage_attempt_date
    const dateStr = new Date().toISOString().substring(0, 10);
    const docId = `${userId}_${planId}_${subChapterId}_${quizStage}_${attemptNumber}_${dateStr}`;
    docIdRef.current = docId;

    // Reset local states
    setServerTotal(0);
    setLocalLeftover(0);
    setLastSnapMs(null);
    setGeneratedQuestions([]);
    setUserAnswers([]);
    setGradingResults([]);
    setShowGradingResults(false);
    setQuizPassed(false);
    setFinalPercentage("");
    setError("");
    setStatus("");
    setLoading(true);

    // A) fetch existing usage
    async function fetchQuizSubActivityTime() {
      try {
        const resultAction = await dispatch(fetchQuizTime({ docId }));
        if (fetchQuizTime.fulfilled.match(resultAction)) {
          const existingSec = resultAction.payload || 0;
          setServerTotal(existingSec);
          setLocalLeftover(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("fetchQuizTime error:", err);
      }
    }

    // B) Generate quiz
    async function doGenerateQuestions() {
      try {
        const result = await generateQuestions({
          userId,
          planId,
          db,
          subChapterId,
          examId,
          quizStage,
          openAiKey,
        });

        if (!result.success) {
          console.error("generateQuestions => error:", result.error);
          setStatus(`Generation error: ${result.error}`);
          setLoading(false);
          return;
        }

        const allQs = result.questionsData?.questions || [];

        // ————— NEW: if nothing to test, jump straight to the pass summary —————
if (allQs.length === 0) {
    setGeneratedQuestions([]);   // make sure state is clean
    setPages([]);                // no pagination
    
    
  }


        


        

        // fetch subchapter summary for GPT grading context
        let summary = "";
        try {
          const ref = doc(db, "subchapters_demo", subChapterId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            summary = snap.data().summary || "";
          }
        } catch (err) {
          console.error("Error fetching subchapter summary:", err);
        }

        setGeneratedQuestions(allQs);
        setUserAnswers(allQs.map(() => "")); // one answer slot per question
        setSubchapterSummary(summary);

        // Build pagination pages
        const newPages = [];
        const QUESTIONS_PER_PAGE = 3;
        for (let i = 0; i < allQs.length; i += QUESTIONS_PER_PAGE) {
          const slice = [];
          for (let j = i; j < i + QUESTIONS_PER_PAGE && j < allQs.length; j++) {
            slice.push(j);
          }
          newPages.push(slice);
        }
        setPages(newPages);
        setCurrentPageIndex(0);
      } catch (err) {
        console.error("Error in doGenerateQuestions:", err);
        setStatus("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizSubActivityTime();
    doGenerateQuestions();
    // eslint-disable-next-line
  }, [userId, subChapterId, quizStage, attemptNumber, planId]);

  // ============================================================
  //  4) local second timer => leftover++
  // ============================================================
  useEffect(() => {
    const timerId = setInterval(() => {
      setLocalLeftover((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // ============================================================
  //  5) Heartbeat => lumps of 15 => increment aggregator doc
  // ============================================================
  useEffect(() => {
    if (!lastSnapMs) return;
    const heartbeatId = setInterval(() => {
      const nowMs = Date.now();
      let diffMs = nowMs - lastSnapMs;

      while (diffMs >= 15000 && localLeftover >= 15) {
        const lumps = Math.floor(localLeftover / 15);
        if (lumps <= 0) break;

        const toPost = lumps * 15;
        dispatch(
          incrementQuizTime({
            docId: docIdRef.current,
            increment: toPost,
            activityId,
            userId,
            planId,
            subChapterId,
            quizStage,
            dateStr: new Date().toISOString().substring(0, 10),
            attemptNumber,
          })
        ).then((action) => {
          if (incrementQuizTime.fulfilled.match(action)) {
            const newTotal = action.payload || serverTotal + toPost;
            setServerTotal(newTotal);
          }
        });

        const remainder = localLeftover % 15;
        setLocalLeftover(remainder);
        setLastSnapMs((prev) => (prev ? prev + lumps * 15000 : nowMs));
        diffMs -= lumps * 15000;
      }
    }, 1000);
    return () => clearInterval(heartbeatId);
  }, [
    lastSnapMs,
    localLeftover,
    serverTotal,
    dispatch,
    userId,
    planId,
    subChapterId,
    quizStage,
    attemptNumber,
    activityId,
  ]);

  // displayedTime => sum lumps + leftover
  const displayedTime = serverTotal + localLeftover;

  // ============================================================
  //  6) Quiz logic: handle user answers, grading, submission
  // ============================================================

  function handleAnswerChange(qIndex, newVal) {
    const updated = [...userAnswers];
    updated[qIndex] = newVal;
    setUserAnswers(updated);
  }

  async function handleQuizSubmit() {
    if (!generatedQuestions.length) {
      alert("No questions to submit.");
      return;
    }
    setLoading(true);
    setStatus("Grading quiz...");
    setError("");

    const overallResults = new Array(generatedQuestions.length).fill(null);
    const localItems = [];
    const openEndedItems = [];

    generatedQuestions.forEach((qObj, i) => {
      const uAns = userAnswers[i] || "";
      if (isLocallyGradableType(qObj.type)) {
        localItems.push({ qObj, userAnswer: uAns, originalIndex: i });
      } else {
                // IMPORTANT: property **must be called userAns** so the grader can see it
        openEndedItems.push({ qObj, userAns: uAns, originalIndex: i });
      }
    });

    // A) local grading
    localItems.forEach((item) => {
      const { score, feedback } = localGradeQuestion(item.qObj, item.userAnswer);
      overallResults[item.originalIndex] = { score, feedback };
    });

    // B) GPT grading for open-ended
    if (openEndedItems.length > 0) {
      if (!openAiKey) {
        // no key => mark 0
        openEndedItems.forEach((itm) => {
          overallResults[itm.originalIndex] = {
            score: 0,
            feedback: "No GPT key; cannot grade open-ended question.",
          };
        });
      } else {
        const { success, gradingArray, error: gptErr } = await gradeOpenEndedBatchREAL({
          openAiKey,
          subchapterSummary,
          items: openEndedItems,
        });

        if (!success) {
          console.error("GPT grading error:", gptErr);
          openEndedItems.forEach((itm) => {
            overallResults[itm.originalIndex] = {
              score: 0,
              feedback: "GPT error: " + gptErr,
            };
          });
        } else {
          // fill into overallResults
          gradingArray.forEach((res, idx) => {
            const origIndex = openEndedItems[idx].originalIndex;
            overallResults[origIndex] = res;
          });
        }
      }
    }

    // compute final numeric
    const totalScore = overallResults.reduce((acc, r) => acc + (r?.score || 0), 0);
    const qCount = overallResults.length;
    const avgFloat = qCount > 0 ? totalScore / qCount : 0;
    const percentageString = (avgFloat * 100).toFixed(2) + "%";
    setFinalPercentage(percentageString);

    // Pass threshold => 100% for your example
    const passThreshold = 1.0;
    const isPassed = avgFloat >= passThreshold;
    setQuizPassed(isPassed);

    // C) Submit to your server => /api/submitQuiz
    try {
      const payload = {
        userId,
        activityId,
        subchapterId: subChapterId,
        quizType: quizStage,
        quizSubmission: generatedQuestions.map((qObj, idx) => ({
          ...qObj,
          userAnswer: userAnswers[idx],
          score: overallResults[idx]?.score ?? 0,
          feedback: overallResults[idx]?.feedback ?? "",
        })),
        score: percentageString,
        totalQuestions: qCount,
        attemptNumber,
        planId,
      };
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/submitQuiz`,payload);
      console.log("Quiz submission saved on server!");
      dispatch(refreshSubchapter(subChapterId));
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Error submitting quiz: " + err.message);
    }

    // D) If passed => mark aggregator doc + re-fetch plan => remain on oldIndex
    if (isPassed) {
      try {
        const oldIndex = currentIndex;

        // aggregator => completed: true
        const aggregatorPayload = {
          userId,
          planId,
          activityId,
          completed: true, // 100% pass => completed
        };
        if (typeof replicaIndex === "number") {
          aggregatorPayload.replicaIndex = replicaIndex;
        }
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, aggregatorPayload);
        console.log("[QuizView] aggregator => completed =>", aggregatorPayload);

        // Re-fetch plan
        const backendURL = import.meta.env.VITE_BACKEND_URL;
        const fetchUrl = "/api/adaptive-plan";
        const fetchAction = await dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
        if (fetchPlan.fulfilled.match(fetchAction)) {
          dispatch(setCurrentIndex(oldIndex));
        } else {
          dispatch(setCurrentIndex(oldIndex));
        }
      } catch (err) {
        console.error("Error marking aggregator or re-fetching plan =>", err);
        dispatch(setCurrentIndex(currentIndex));
      }
    }

    // E) Show grading results => user sees pass/fail screen
    setGradingResults(overallResults);

    // remember the full attempt so we can show it later
setLastAttempt({
  questions : generatedQuestions,
  results   : overallResults,
  score     : percentageString,
  passed    : isPassed,
});
setShowLastAttempt(false);          // start collapsed




    setShowGradingResults(true);
    setLoading(false);
    setStatus("Grading complete.");
  }

  // ============================================================
  //  7) Pass/Fail flows
  // ============================================================
  async function handleQuizSuccess() {
    try {
      if (activityId) {
        const payload = {
          userId,
          planId,
          activityId,
          completed: true,
        };
        if (typeof replicaIndex === "number") {
          payload.replicaIndex = replicaIndex;
        }
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`,payload);
        console.log("[QuizView] handleQuizSuccess => activity completed =>", payload);
      }
      dispatch(refreshSubchapter(subChapterId));
      if (onQuizComplete) {
        onQuizComplete();
      }
      dispatch(setCurrentIndex(currentIndex + 1));
    } catch (err) {
      console.error("handleQuizSuccess error:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  function handleTakeRevisionNow() {
    if (onQuizFail) {
      onQuizFail();
    }
  }

  async function handleTakeRevisionLater() {
    try {
      const oldIndex = currentIndex;
      if (activityId) {
        const defPayload = {
          userId,
          planId,
          activityId,
          completed: false,
        };
        if (typeof replicaIndex === "number") {
          defPayload.replicaIndex = replicaIndex;
        }

        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, defPayload);
        console.log(`Activity '${activityId}' marked as completed=false (deferred)`);
      }
      const backendURL = import.meta.env.VITE_BACKEND_URL;
      const fetchUrl = "/api/adaptive-plan";
      const fetchAction = await dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      } else {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
    } catch (err) {
      console.error("Error in handleTakeRevisionLater:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  // ============================================================
  //  8) Pagination & Rendering
  // ============================================================
  const hasQuestions = generatedQuestions.length > 0 && pages.length > 0;
  const isOnLastPage = currentPageIndex === pages.length - 1;
  const currentQuestions = pages[currentPageIndex] || [];

  function handleNextPage() {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }
  function handlePrevPage() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }

  return (
    <div style={styles.outerContainer}>
      <div style={styles.card}>

        {/* ---------- MASTERY PANEL (TOP-RIGHT) ---------- */}
        <MasterySummaryPanel
          loadingConceptData={loadingConceptData}
          masteredCount={masteredCount}
          inProgressCount={inProgressCount}
          notTestedCount={notTestedCount}
          conceptStatuses={conceptStatuses}
        />

        {/* ---------- Top Header => "Quiz" + clock ---------- */}
        <div style={styles.cardHeader}>
         
  {/* Title */}
  <h2 style={{ margin: 0, fontWeight:600 }}>Quiz</h2>

  {/* Attempt pill */}
  <Pill label={`Attempt #${attemptNumber}`} />

  {/* Clock pill */}
  <Pill
    label={formatTime(displayedTime)}
    icon={<AccessTimeIcon sx={{ fontSize:16 }} />}
  />

  {/* Question-count pill – render only when we know the length */}
  {generatedQuestions.length > 0 && (
    <Pill label={`${generatedQuestions.length} questions`} />
  )}
 
        </div>

        {/* ---------- Body => quiz or grading results ---------- */}
        <div style={styles.cardBody}>
          {/* NEW overlay replaces the old plain <p> */}
  {loading && (
    <LoadingOverlay text={status || "Generating questions…"} />
  )}

  {/* keep whatever you want to show when NOT loading */}
  {!loading && status && !error && (
    <p style={{ color: "lightgreen" }}>{status}</p>
  )}
  {error && <p style={{ color: "red" }}>{error}</p>}



          {/* QUIZ QUESTIONS => if not yet submitted */}
          {!showGradingResults && hasQuestions && (
            <div>
              {currentQuestions.map((qIndex) => {
                const questionObj = generatedQuestions[qIndex];
                const grading = gradingResults[qIndex] || null;
                return (
                  <div key={qIndex} style={styles.questionContainer}>
                    <QuizQuestionRenderer
                      questionObj={questionObj}
                      index={qIndex}
                      userAnswer={userAnswers[qIndex]}
                      onUserAnswerChange={(val) => handleAnswerChange(qIndex, val)}
                      score={grading?.score ?? null}
                      feedback={grading?.feedback ?? null}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* GRADING RESULTS => if showGradingResults == true */}
         {showGradingResults && (
  <div style={styles.gradingContainer}>
    <h3>Overall Summary</h3>
    <p>
      Your final score: <b>{finalPercentage}</b>
    </p>
    {quizPassed ? (
      <p style={{ color: "lightgreen" }}>You passed!</p>
    ) : (
      <p style={{ color: "red" }}>You did not pass.</p>
    )}

    {/* ← the accordion now lives INSIDE the summary box */}
    <LastAttemptPanel
      attempt={lastAttempt}
      show={showLastAttempt}
      onToggle={() => setShowLastAttempt((p) => !p)}
    />
  </div>
)}

          
        </div>

        {/* ---------- Footer => pagination or pass/fail flows ---------- */}
        <div style={styles.cardFooter}>
          <div style={styles.navButtons}>
            {/* If not graded => show pagination + last page => Submit */}
            {!showGradingResults && hasQuestions && (
              <>
                {currentPageIndex > 0 && (
                  <button style={styles.button} onClick={handlePrevPage}>
                    Previous
                  </button>
                )}
                {!isOnLastPage && (
                  <button style={styles.button} onClick={handleNextPage}>
                    Next
                  </button>
                )}
                {isOnLastPage && (
                  <button style={styles.submitButton} onClick={handleQuizSubmit}>
                    Submit Quiz
                  </button>
                )}
              </>
            )}

            {/* If showGradingResults => pass/fail flows */}
            {showGradingResults && quizPassed && (
              <button style={styles.finishButton} onClick={handleQuizSuccess}>
                Finish
              </button>
            )}
            {showGradingResults && !quizPassed && (
              <>
                <button style={styles.button} onClick={handleTakeRevisionNow}>
                  Take Revision Now
                </button>
                <button style={styles.button} onClick={handleTakeRevisionLater}>
                  Take Revision Later
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Debug Overlay (optional) */}
      <div
        style={styles.debugEyeContainer}
        onMouseEnter={() => setShowDebug(true)}
        onMouseLeave={() => setShowDebug(false)}
      >
        <div style={styles.debugEyeIcon}>i</div>
        {showDebug && (
          <div style={styles.debugOverlay}>
            <h4 style={{ marginTop: 0 }}>Debug Info</h4>
            <pre style={styles.debugPre}>
              {JSON.stringify(
                {
                  userId,
                  planId,
                  subChapterId,
                  quizStage,
                  attemptNumber,
                  serverTotal,
                  localLeftover,
                  pages: pages.map((p) => p.join(",")),
                  currentPageIndex,
                  showGradingResults,
                  finalPercentage,
                  quizPassed,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------
// Local vs GPT grading
// --------------------------------------------------------------------
function isLocallyGradableType(qType) {
  switch (qType) {
    case "multipleChoice":
    case "trueFalse":
    case "fillInBlank":
    case "ranking":
      return true;
    default:
      return false;
  }
}

function localGradeQuestion(qObj, userAnswer) {
  let score = 0;
  let feedback = "";
  switch (qObj.type) {
    case "multipleChoice": {
      const correctIndex = qObj.correctIndex;
      const userIndex = parseInt(userAnswer, 10);
      if (!isNaN(userIndex) && userIndex === correctIndex) {
        score = 1.0;
        feedback = "Correct!";
      } else {
        score = 0.0;
        const correctOpt =
          Array.isArray(qObj.options) && qObj.options[correctIndex];
        feedback = `Incorrect. Correct option: ${correctOpt}`;
      }
      break;
    }
    case "trueFalse": {
      if (userAnswer === qObj.correctValue) {
        score = 1.0;
        feedback = "Correct!";
      } else {
        score = 0.0;
        feedback = `Incorrect. The correct answer was "${qObj.correctValue}".`;
      }
      break;
    }
    case "fillInBlank": {
      const correct =
        (userAnswer || "").trim().toLowerCase() ===
        (qObj.answerKey || "").trim().toLowerCase();
      if (correct) {
        score = 1.0;
        feedback = "Correct fill-in!";
      } else {
        score = 0.0;
        feedback = `Incorrect. Expected: "${qObj.answerKey}".`;
      }
      break;
    }
    case "ranking":
      score = 0.0;
      feedback = "Ranking not implemented yet.";
      break;
    default:
      score = 0.0;
      feedback = "Unrecognized question type for local grading.";
  }
  return { score, feedback };
}



// --------------------------------------------------------------------
// Collapsible MasterySummaryPanel (top-right corner)
// --------------------------------------------------------------------
function MasterySummaryPanel({
  loadingConceptData,
  masteredCount,
  inProgressCount,
  notTestedCount,
  conceptStatuses,
}) {
  const [expanded, setExpanded] = useState(false);
  const totalConcepts = masteredCount + inProgressCount + notTestedCount;
  const progressPct = totalConcepts > 0
    ? Math.round((masteredCount / totalConcepts) * 100)
    : 0;

  function toggleExpand() {
    setExpanded((prev) => !prev);
  }

  if (loadingConceptData) {
    return (
      <div style={styles.masteryPanel}>
        <p style={{ fontSize: "0.9rem", margin: 0 }}>Loading concept data...</p>
      </div>
    );
  }

  return (
    <div style={styles.masteryPanel}>
      {/* Collapsed View => progress bar + "X / Y mastered" */}
      {!expanded && (
        <div style={{ fontSize: "0.9rem" }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{masteredCount}</strong> / {totalConcepts} mastered
            &nbsp;({progressPct}%)
          </div>
          <ProgressBar pct={progressPct} />
        </div>
      )}

      {/* Expanded => show concept statuses */}
      {expanded && (
        <>
          <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
            <strong>Mastered:</strong> {masteredCount} &nbsp;|&nbsp;
            <strong>In Progress:</strong> {inProgressCount} &nbsp;|&nbsp;
            <strong>Not Tested:</strong> {notTestedCount}
          </div>
          <ul style={styles.conceptList}>
            {conceptStatuses.map((obj) => {
              const { conceptName, status } = obj;
              let color = "#bbb";
              if (status === "PASS") color = "#4caf50"; // green
              else if (status === "FAIL") color = "#f44336"; // red
              return (
                <li key={conceptName} style={{ marginBottom: 4 }}>
                  <span style={{ color }}>{conceptName}</span>{" "}
                  <span style={{ color: "#999", fontSize: "0.8rem" }}>
                    ({status})
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Expand/collapse toggle */}
      <div style={{ textAlign: "right", marginTop: 6 }}>
        <button onClick={toggleExpand} style={styles.expandBtn}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>
    </div>
  );
}




// Simple horizontal progress bar
function ProgressBar({ pct }) {
  const containerStyle = {
    width: "100%",
    height: "8px",
    backgroundColor: "#444",
    borderRadius: "4px",
    overflow: "hidden",
  };
  const fillStyle = {
    width: `${pct}%`,
    height: "100%",
    backgroundColor: "#66bb6a",
  };
  return (
    <div style={containerStyle}>
      <div style={fillStyle} />
    </div>
  );
}

// ============== Styles ==============
const styles = {
  outerContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
  card: {
    position: "relative",
    width: "80%",
    maxWidth: "700px",
    backgroundColor: "#111",
    borderRadius: "8px",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
    cardHeader: {
    background: "#222",
    padding: "12px 16px",
    borderBottom: "1px solid #333",
    display: "flex",
    alignItems: "center",
    gap: 12            // puts space between the pills
  },
  clockWrapper: {
    marginLeft: "16px",
    fontSize: "0.9rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#ddd",
    backgroundColor: "#333",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  clockIcon: {
    fontSize: "1rem",
  },
  cardBody: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
  },
  cardFooter: {
    borderTop: "1px solid #333",
    padding: "12px 16px",
  },
  navButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  button: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  submitButton: {
    backgroundColor: "purple",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  finishButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  questionContainer: {
  background: "#181818",
  border: "1px solid #444",
  borderRadius: 8,
  padding: "1rem",
  marginBottom: "1.2rem",
},
  gradingContainer: {
    marginTop: "1rem",
    backgroundColor: "#222",
    padding: "1rem",
    borderRadius: "4px",
  },

  // Debug overlay
  debugEyeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  debugEyeIcon: {
    width: "24px",
    height: "24px",
    backgroundColor: "#333",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.8rem",
    cursor: "pointer",
    border: "1px solid #555",
    textTransform: "uppercase",
  },
  debugOverlay: {
    position: "absolute",
    top: "30px",
    right: 0,
    width: "300px",
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "8px",
    zIndex: 9999,
    fontSize: "0.8rem",
  },
  debugPre: {
    backgroundColor: "#333",
    padding: "6px",
    borderRadius: "4px",
    maxHeight: "150px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    marginTop: "4px",
  },

  // Mastery panel => top-right, below top header
  masteryPanel: {
    position: "absolute",
    top: "50px", // offset from top so it doesn't overlap your debug icon
    right: "8px",
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "0.9rem",
    maxWidth: "220px",
    minHeight: "44px",
  },
  expandBtn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "2px 6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    lineHeight: 1,
  },
  conceptList: {
    margin: 0,
    paddingLeft: 16,
    maxHeight: "120px",
    overflowY: "auto",
  },
  lastAttemptWrapper: { marginBottom: "1rem" },
collapseBtn:       {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  marginBottom: "6px",
},
lastAttemptInner:  {
  backgroundColor: "#222",
  padding: "8px",
  borderRadius: "4px",
},
};

// --------------------------------------------------------------------
// A dummy GPT grader for open-ended. You'd replace with your real logic.
// --------------------------------------------------------------------
