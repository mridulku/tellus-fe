// frontend/src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  // If no token, redirect to our new AuthLogin page
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the protected child component
  return children;
}

export default PrivateRoute;
