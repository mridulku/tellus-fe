// src/components/DetailedBookViewer/ProfileSidebar.jsx

import React from "react";

/**
 * ProfileSidebar
 *
 * A simple sidebar that matches the style of OverviewSidebar/HomeSidebar:
 * - Dark background
 * - Consistent heading color
 * - Identical font sizes, border, padding, etc.
 */
function ProfileSidebar({ colorScheme = {} }) {
  const containerStyle = {
    width: "300px",
  //  backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFFFFF",
    overflowY: "auto",
    padding: "20px",
  //  borderRight: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    fontSize: "0.85rem",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1rem",
    color: colorScheme.heading || "#BB86FC",
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Profile</h2>
      <p style={{ lineHeight: 1.5 }}>
        Here is where user profile info or settings could go. This area
        might include quick links to editing user details, changing preferences,
        or viewing analytics at a glance.
      </p>
    </div>
  );
}

export default ProfileSidebar;