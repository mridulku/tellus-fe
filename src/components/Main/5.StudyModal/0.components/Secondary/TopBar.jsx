// TopBar.jsx
// -------------------------------------------------------------
// • Onboarding plans   → centered “Welcome …” + ✕ button
// • Normal plans       → centered “Adaptive Plan Viewer” + ✕
//   (no timer, no arrows, no font-size toggle)
// -------------------------------------------------------------

import React from "react";
import { useSelector } from "react-redux";

/* ─── shared inline styles ─── */
const container = {
  display:       "flex",
  flexDirection: "column",
  background:    "#222 linear-gradient(180deg,#2a2a2a,#222)",
  padding:       "8px 16px",
  color:         "#fff",
  boxSizing:     "border-box",
};

const row = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  width:          "100%",
};

const right = { display:"flex", alignItems:"center" };

const closeBtn = {
  cursor:       "pointer",
  fontSize:     "1.2rem",
  color:        "#fff",
  background:   "#333",
  borderRadius: "50%",
  padding:      "4px 6px",
  border:       "1px solid #555",
};

/* ─────────────────────────────────────────────────────────── */

export default function TopBar({ onClose = () => {} }) {
  /* grab plan level from Redux */
  const planDoc = useSelector((s) => s.plan?.planDoc);
  const exam    = (useSelector((s) => s.exam?.examType) || "").toUpperCase();

  const level = planDoc && planDoc.level
    ? String(planDoc.level).toLowerCase()
    : "";

  /* ─── Onboarding view ─── */
  if (level === "onboarding") {
    const welcome =
      exam === "NEET"
        ? "Welcome to your NEET journey"
        : "Welcome to your learning journey";

    return (
      <div style={container}>
        <div style={row}>
          {/* centered */}
          <div style={{ flex:1, textAlign:"center" }}>
            <span style={{ fontSize:"1rem", fontWeight:600 }}>{welcome}</span>
          </div>

          {/* close */}
          <div style={right}>
            <div style={closeBtn} onClick={onClose}>✕</div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Normal plans view ─── */
  return (
    <div style={container}>
      <div style={row}>
        {/* centered title */}
        <div style={{ flex:1, textAlign:"center" }}>
          <span style={{ fontSize:"1rem", fontWeight:600 }}>
            Adaptive&nbsp;Plan&nbsp;Viewer
          </span>
        </div>

        {/* close */}
        <div style={right}>
          <div style={closeBtn} onClick={onClose}>✕</div>
        </div>
      </div>
    </div>
  );
}