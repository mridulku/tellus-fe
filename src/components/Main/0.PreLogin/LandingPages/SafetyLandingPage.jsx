/***************************************************************************
 * NewLandingPage.jsx — Adaptive-Prep Landing (v1.1 with copy overhaul)
 ***************************************************************************/

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken,
} from "firebase/auth";
import axios from "axios";
import { auth } from "../../../../firebase";
import { setExamType } from "../../../../store/examSlice";

/* sections */
import LearnerJourney from "./SafetySupport/LearnerJourney";   // ⬅️ NEW

import NavBar from "./SafetySupport/NavBar";
import Hero from "./SafetySupport/Hero";
import EngineLayers from "./SafetySupport/EngineLayers";
import ToolsGallery from "./SafetySupport/ToolsGallery";      // ⬅️ NEW
import WhyDifferentTable from "./SafetySupport/WhyDifferentTable";
import ProofCTA from "./SafetySupport/ProofCTA";

/* theme ------------------------------------------------------------------ */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#B39DDB" },
    secondary: { main: "#FFD700" },
    background: { default: "#0F0F0F", paper: "#1F1F1F" },
    text: { primary: "#FFF", secondary: "#b3b3b3" },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "sans-serif"].join(","),
    h4: { fontWeight: 700 },
  },
});

const slugToType = { neet: "NEET" };

/* ----------------------------------------------------------------------- */
export default function NewLandingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const slug = useLocation().pathname.split("/").pop().toLowerCase();
  const examType = slugToType[slug] ?? "NEET";
  const backend = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  /* redirect if logged in ------------------------------------------------ */
  React.useEffect(() => {
    if (localStorage.getItem("token")) navigate("/dashboard");
  }, [navigate]);

  /* Google sign-in ------------------------------------------------------- */
  async function googleSignIn() {
    try {
      sessionStorage.setItem("pendingExam", examType);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      const idToken = await auth.currentUser.getIdToken();
      const { data } = await axios.post(`${backend}/login-google`, {
        idToken,
        examType,
      });
      if (!data.success) throw new Error(data.error);

      await signInWithCustomToken(auth, data.firebaseCustomToken);
      dispatch(setExamType(examType));

      localStorage.setItem("userId", auth.currentUser.uid);
      await createLearnerPersonaIfNeeded();

      localStorage.setItem("token", data.token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign-in failed:", err);
    }
  }

  async function createLearnerPersonaIfNeeded() {
    try {
      if (!auth.currentUser) return;
      await axios.post(`${backend}/create-learner-persona`, {
        userId: auth.currentUser.uid,
        wpm: 200,
        dailyReadingTime: 30,
      });
    } catch (err) {
      console.error("Error creating learner persona:", err);
    }
  }

  /* navbar blur on scroll ----------------------------------------------- */
  React.useEffect(() => {
    const bar = document.querySelector(".MuiAppBar-root");
    const onScroll = () =>
      window.scrollY > 40
        ? bar.classList.add("scrolled")
        : bar.classList.remove("scrolled");
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* --------------------------------------------------------------------- */
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <NavBar examType={examType} onGoogle={googleSignIn} />
      <Hero onGoogle={googleSignIn} />
      <EngineLayers />
      <LearnerJourney />       {/* ⬅️ new primer section */}
      <ToolsGallery />
      <WhyDifferentTable />
      <ProofCTA onGoogle={googleSignIn} />
    </ThemeProvider>
  );
}