// src/components/DetailedBookViewer/OnboardingModal.jsx

import React, { useState } from "react";
import OnboardingChatContent from "../ChatOnboarding/1.1OnboardingChatContent";
import OnboardingFormContent from "./1.2OnboardingFormContent";

/**
 * OnboardingModal (Parent)
 *
 * Props:
 *  - open (bool): Controls whether the onboarding overlay is visible
 *  - onClose (func): Called to close this overlay
 *  - onOpenPlanEditor (func(bookId)): Called to open the EditAdaptivePlan flow
 *     once onboarding is done, passing the relevant bookId
 */
export default function OnboardingModal({ open, onClose, onOpenPlanEditor }) {
  const enableChat = false;
  const [activeView] = useState("form");

  // Handle "onboarding complete" => close this modal, open plan editor w/ bookId
  const handleOnboardingComplete = (bookId) => {
    // 1) Close the onboarding overlay
    if (onClose) onClose();

    // 2) Open the plan editor, passing bookId
    if (onOpenPlanEditor) {
      onOpenPlanEditor(bookId);
    }
  };

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Close "X" button */}
        <button onClick={onClose} style={closeButtonStyle}>
          X
        </button>

        {/* 
          If enableChat is false, we always show OnboardingFormContent.
          Otherwise we could toggle between chat and form.
        */}
        {enableChat ? (
          <div style={{ marginTop: "1rem" }}>
            {activeView === "chat" ? (
              <OnboardingChatContent />
            ) : (
              <OnboardingFormContent onOnboardingComplete={handleOnboardingComplete} />
            )}
          </div>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <OnboardingFormContent onOnboardingComplete={handleOnboardingComplete} />
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle = {
  backgroundColor: "rgba(0,0,0,0.8)",
  padding: "20px",
  borderRadius: "8px",
  width: "80vw",
  maxWidth: "1000px",
  overflow: "hidden",
  position: "relative",
};

const closeButtonStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: "16px",
  cursor: "pointer",
};