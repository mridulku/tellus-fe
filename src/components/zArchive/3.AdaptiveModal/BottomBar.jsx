// BottomBar.jsx

import React from "react";
import ProgressBar from "./ProgressBar"; // <-- Make sure you have a ProgressBar.jsx or rename appropriately
import { bottomBarStyle } from "./styles";

/**
 * BottomBar
 * ---------
 * Renders a container with a ProgressBar and a text label:
 * "Step X / Y (Z%)"
 *
 * PROPS:
 *  - stepPercent (number): the percentage of steps completed
 *  - currentIndex (number): the currently active step index
 *  - totalSteps (number): total number of steps/items
 */
export default function BottomBar({ stepPercent, currentIndex, totalSteps }) {
  return (
    <div style={bottomBarStyle}>
      {/* We can do inline styling for layout, or define in styles.js */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px" }}>
        <ProgressBar stepPercent={stepPercent} />
        <div style={{ color: "#fff" }}>
          Step {currentIndex + 1} / {totalSteps} ({stepPercent}%)
        </div>
      </div>
    </div>
  );
}