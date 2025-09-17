import React from "react";
import { NavLink } from "react-router-dom";

/**
 * NavigationBar
 * A reusable top navigation bar that highlights the active route.
 */
function NavigationBar() {
  // Inline styles for the navigation container
  const navContainerStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "0 20px",
    height: "60px",
    backgroundColor: "#203A43", // or any color/design you prefer
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  };

  // Dynamic style for NavLinks
  const getLinkStyle = (isActive) => ({
    backgroundColor: isActive ? "#FFD700" : "transparent",
    color: isActive ? "#000" : "#fff",
    borderRadius: "4px",
    padding: "10px 20px",
    textDecoration: "none",
    margin: "0 10px",
    fontWeight: "bold",
    transition: "background-color 0.2s, color 0.2s",
  });

  return (
    <nav style={navContainerStyle}>
      {/* Dummy routes (replace with real paths/routes in your app) */}
      <NavLink to="/home" style={({ isActive }) => getLinkStyle(isActive)}>
        Home
      </NavLink>
      <NavLink to="/userprofileanalytics" style={({ isActive }) => getLinkStyle(isActive)}>
        Profile
      </NavLink>
      <NavLink to="/books2" style={({ isActive }) => getLinkStyle(isActive)}>
        Books
      </NavLink>
    </nav>
  );
}

export default NavigationBar;