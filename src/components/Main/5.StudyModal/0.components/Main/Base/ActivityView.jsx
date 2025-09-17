// File: ActivityView.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";

import QuizComponent from "../QuizComp/QuizComponent";
import LastAttemptPanel from "../QuizComp/QuizSupport/LastAttemptPanel";
import ReviseComponent from "../RevComp/ReviseComponent";

/**
 * ActivityView
 * ------------
 * Child of StageManager that:
 *  - Receives 'mode', 'lastQuizAttempt', etc.
 *  - Decides whether to show "No Quiz Yet," "Quiz Completed," "Need Revision," etc.
 *  - Renders the <QuizComponent> or <ReviseComponent> accordingly.
 *
 * Props (from StageManager):
 *  - mode, quizStage, examId, subChapterId, planId, userId
 *  - lastQuizAttempt
 *  - onQuizComplete, onQuizFail, onRevisionDone
 */
export default function ActivityView({
  activity,
  mode,
  quizStage,
  examId,
  subChapterId,
  planId,
  userId,
  lastQuizAttempt,
  onQuizComplete,
  onQuizFail,
  onRevisionDone,
}) {
  const dispatch = useDispatch();
  const currentIndex = useSelector((state) => state.plan?.currentIndex ?? 0);

    if (mode === "LOADING") {
        return (
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <span style={{ color: "#ccc" }}>Loading…</span>
          </div>
        );
      }

  return (
    <div style={styles.container}>
      {/* 1) No quiz => show first quiz attempt */}
      {mode === "NO_QUIZ_YET" && (
        <QuizComponent
          activity={activity}
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          attemptNumber={1}
          readOnly
          onQuizComplete={onQuizComplete}
          onQuizFail={onQuizFail}
        />
      )}

      {/* 2) Quiz completed => success */}
      {mode === "QUIZ_COMPLETED" && (
        <div style={{ color: "lightgreen", marginBottom: "1rem" }}>
          <p>
            Congratulations! You passed the <b>{quizStage}</b> stage.
          </p>
          {/* NEW: "Go to Next Activity" button */}
          <button
            style={styles.nextButton}
            onClick={() => dispatch(setCurrentIndex(currentIndex + 1))}
          >
            Go to Next Activity
          </button>

          <LastAttemptPanel attempt={lastQuizAttempt} />
        </div>
      )}

      {/* 3) If need revision => show ReviseComponent */}
      {mode === "NEED_REVISION" && lastQuizAttempt && (
        <ReviseComponent
          activity={activity}
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          revisionNumber={lastQuizAttempt.attemptNumber}
          onRevisionDone={onRevisionDone}
        />
      )}

      {/* 4) If revision done => user can retake quiz */}
      {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
        <QuizComponent
          activity={activity}
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          attemptNumber={lastQuizAttempt.attemptNumber + 1}
          onQuizComplete={onQuizComplete}
          onQuizFail={onQuizFail}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
  },
  nextButton: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "8px",
  },
};