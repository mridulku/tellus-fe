// LoadingSpinner.jsx

import React from "react";
import "./spinner.css"; // We'll define spinner styles in spinner.css

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="spinnerContainer">
      <div className="spinner"></div>
      <p className="spinnerText">{message}</p>
    </div>
  );
}