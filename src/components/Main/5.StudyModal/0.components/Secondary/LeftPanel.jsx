// File: LeftPanelSwitcher.jsx
import React from "react";
import { useSelector } from "react-redux";

// Import your two separate panels
import OnboardingLeftPanel from "./OnboardingLeftPanel";
import UsualLeftPanel from "./UsualLeftPanel";

export default function LeftPanelSwitcher(props) {
  const { planDoc } = useSelector((state) => state.plan);

  // Suppose the planDoc has a boolean field "onboardingPlan"
  // or something like planDoc.planType === "onboarding"
  const isOnboardingPlan = planDoc?.onboardingPlan === true;

  if (isOnboardingPlan) {
    return <OnboardingLeftPanel {...props} />;
  }
  return <UsualLeftPanel {...props} />;
}