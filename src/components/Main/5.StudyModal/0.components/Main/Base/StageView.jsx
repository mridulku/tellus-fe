// File: StageView.jsx
import React from "react";
import { useSelector } from "react-redux";
import StageManager from "./StageManager";
import CumulativeQuiz from "../CumulativeComp/CumulativeQuiz";
import CumulativeRevision from "../CumulativeComp/CumulativeRevision";

// NEW import for the guide
import GuideView from "./GuideView";

export default function StageView({ examId, activity }) {
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  const activityType = (activity.type || "").toLowerCase();
  const quizStage = (activity.quizStage || "").toLowerCase();

  // 1) If it’s a “guide” activity => short-circuit here.
  if (activityType === "guide") {
    return (
      <div style={styles.outerContainer}>
        <GuideView examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }

  // 2) If it’s a “cumulativequiz” => show cummulative
  if (quizStage === "cumulativequiz") {
    return (
      <div style={styles.outerContainer}>
        <CumulativeQuiz examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }

  // 3) If it’s a “cumulativerevision” => show cummulative revision
  if (quizStage === "cumulativerevision") {
    return (
      <div style={styles.outerContainer}>
        <CumulativeRevision examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }

  // 4) Otherwise => pass to StageManager (READ or normal QUIZ)
  return (
    <div style={styles.outerContainer}>
      <StageManager
        examId={examId}
        activity={activity}
        userId={userId}
      />
    </div>
  );
}

const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
};