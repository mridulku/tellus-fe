import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, db } from "../../firebase"; // Adjust import based on your setup
import { doc, setDoc } from "firebase/firestore";

export default function AuthSignupGoogle() {
  const navigate = useNavigate();

  // Fields you want to capture in users collection
  const [username, setUsername] = useState("");
  const [themePreference, setThemePreference] = useState("dark");
  const [role, setRole] = useState("");

  // If user is already logged in, redirect
  useEffect(() => {
    if (auth.currentUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // If needed: provider.addScope('profile'); or provider.addScope('email');

      // 1) Popup the Google sign-in window
      const result = await signInWithPopup(auth, provider);

      // 2) The user is now signed in with a Google-based account in Firebase.
      const user = result.user; // user.uid, user.displayName, user.email, etc.
      console.log("Signed up with Google:", user);

      // 3) Write a doc to your 'users' collection with the same UID as the Firebase user
      //    We store the fields: username, password (placeholder), themePreference, role
      //    so it matches what your old user docs had. 
      //    If you want a real password, you'd have to ask the user, 
      //    but typically for Google sign-in you just store "" or "N/A".
      const userRef = doc(db, "users", user.uid);

      await setDoc(userRef, {
        username: username || user.displayName || "", // fallback to Google displayName if desired
        password: "", // no real password, because Google sign-in
        themePreference: themePreference,
        role: role || "googleUser", // default or user input
        createdAt: new Date().toISOString()
      });

      // 4) Redirect the user to your main app (dashboard)
      navigate("/dashboard");
    } catch (error) {
      console.error("Error signing up with Google:", error);
      alert("Google Sign-Up failed. Check console for details.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", textAlign: "center" }}>
      <h2>Sign Up with Google</h2>

      <p>Fill out a few details before signing in via Google.</p>

      {/* USERNAME FIELD */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ padding: "8px", width: "100%" }}
          placeholder="Enter desired username"
        />
      </div>

      {/* THEME PREFERENCE FIELD */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Theme Preference</label>
        <select
          value={themePreference}
          onChange={(e) => setThemePreference(e.target.value)}
          style={{ padding: "8px", width: "100%" }}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      {/* ROLE FIELD */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Role</label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: "8px", width: "100%" }}
          placeholder="e.g. 'reader', 'admin', etc."
        />
      </div>

      <button
        onClick={handleGoogleSignup}
        style={{
          fontSize: "1rem",
          padding: "0.5rem 1rem",
          cursor: "pointer"
        }}
      >
        Sign Up with Google
      </button>
    </div>
  );
}