// File: GuideView.jsx
import React from "react";

// Filler sub-components for each guideType
import GuideReading from "./Guide/GuideReading";
import GuideRemember from "./Guide/GuideRemember";
import GuideUnderstand from "./Guide/GuideUnderstand";
import GuideApply from "./Guide/GuideApply";
import GuideAnalyze from "./Guide/GuideAnalyze";
import GuideOnboarding from "./Guide/GuideOnboarding";
import GuideCarousel from "./Guide/GuideCarousel";


// OPTIONAL: a fallback, if you have one
import GuideGeneric from "./Guide/GuideGeneric";

export default function GuideView({ examId, activity, userId }) {
  const guideType = (activity?.guideType || "").toLowerCase();

  // Decide which sub-component to render
  switch (guideType) {
    case "reading":
      return <GuideReading examId={examId} activity={activity} userId={userId} />;

    case "remember":
      return <GuideRemember examId={examId} activity={activity} userId={userId} />;

    case "understand":
      return <GuideUnderstand examId={examId} activity={activity} userId={userId} />;

    case "apply":
      return <GuideApply examId={examId} activity={activity} userId={userId} />;

    case "analyze":
      return <GuideAnalyze examId={examId} activity={activity} userId={userId} />;

    case "onboarding":
      return <GuideOnboarding examId={examId} activity={activity} userId={userId} />;  

    case "carousel":
      return <GuideCarousel examId={examId} activity={activity} userId={userId} />;

    default:
      return <GuideGeneric examId={examId} activity={activity} userId={userId} />;
  }
}