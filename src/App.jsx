// frontend/src/App.jsx
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";   // ← added Navigate
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { fetchExamType, clearExamType } from "./store/examSlice";

import posthog from 'posthog-js';

posthog.init('cFmE06V1he_XWlUEFAvrWB68ixtJ-huLm3qQeYJku6Y', {
  api_host: 'https://us.i.posthog.com',
  autocapture: true,
  capture_pageview: true,
});

/* ---------- third-party css ---------- */
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/* ---------- public landing pages ---------- */
import LandingPage            from "./components/Main/0.PreLogin/0.LandingPage";
import TOEFLLandingPage       from "./components/Main/0.PreLogin/LandingPages/TOEFL";
import CBSELandingPage        from "./components/Main/0.PreLogin/LandingPages/CBSE";
import CATLandingPage         from "./components/Main/0.PreLogin/LandingPages/CAT";
import FRMLandingPage         from "./components/Main/0.PreLogin/LandingPages/FRM";
import GATELandingPage        from "./components/Main/0.PreLogin/LandingPages/GATE";
import GRELandingPage         from "./components/Main/0.PreLogin/LandingPages/GRE";
import JEEADVANCEDLandingPage from "./components/Main/0.PreLogin/LandingPages/JEEADVANCED";
import NEETUGLandingPage      from "./components/Main/0.PreLogin/LandingPages/NEETUG";
import SATLandingPage         from "./components/Main/0.PreLogin/LandingPages/SAT";
import UPSCLandingPage        from "./components/Main/0.PreLogin/LandingPages/UPSC";

/* ---------- auth pages ---------- */
import AuthLogin      from "./components/zArchive/AuthLogin";
import AuthSignGoogle from "./components/zArchive/AuthSignGoogle";
import AuthSignIn     from "./components/Main/0.PreLogin/1.AuthSignIn";

/* ---------- route guards ---------- */
import PrivateRoute from "./components/Main/0.BaseFiles/PrivateRoute";

/* ---------- big protected areas & misc components ---------- */
import Onboarding             from "./components/zArchive/Archive 1/Onboarding";
import Login                  from "./components/zArchive/Archive 5/Login";
import ChatInterface          from "./components/zArchive/Archive 5/ChatInterface";
import PdfUploader            from "./components/zArchive/Archive 2/PdfUploader";
import SubChaptersUploader    from "./components/zArchive/Archive 2/SubChaptersUploader";
import ChaptersUploader       from "./components/zArchive/Archive 2/ChaptersUploader";
import BookTextViewer         from "./components/zArchive/Archive 2/BookTextViewer";
import AdminDashboard         from "./components/zArchive/Archive 2/AdminDashboard";
import SubchapterNameUploader from "./components/zArchive/Archive 2/SubchapterNameUploader";
import PlatformIntro          from "./components/zArchive/Archive 8/PlatformIntro";
import PersonalizationProgress from "./components/zArchive/Archive 8/PersonalizationProgress";
import LearnerPersonaForm     from "./components/zArchive/Archive 8/LearnerPersonaForm";
import OnboardingAssessment   from "./components/zArchive/Archive 8/OnboardingAssessment";
import TestView               from "./components/zArchive/Archive 11/TestView";
import GamificationDashboard  from "./components/zArchive/Archive 6/GamificationDashboard";
import MaterialUploadWizard   from "./components/zArchive/Archive 3/MaterialUploadWizard";
import CoursesMaterialManager from "./components/zArchive/Archive 3/CoursesMaterialManager";
import BooksOverview          from "./components/zArchive/Archive 4/BooksOverview";
import ReadingPlan            from "./components/zArchive/Archive 4/ReadingPlan";
import GptQuestionGenerator   from "./components/zArchive/Archive 10/GptQuestionGenerator";
import BooksViewer3           from "./components/zArchive/Archive 9/BooksViewer3";
import AdaptiveStatsDashboard from "./components/zArchive/Archive 11/AdaptiveStatsDashboard";
import PlanBrowser            from "./components/zArchive/0.test/PlanBrowser";
import PlanFetcher            from "./components/Main/5.StudyModal/StudyModal";
import StageTimeline          from "./components/Main/5.StudyModal/0.components/Secondary/StageTimeline";
import PromptManager          from "./components/yBrainstorming/diagrams/Pilot|AddToDB|Coding/PilotComponents/PromptMgmtDeprecated/PromptManager";
import PromptInput            from "./components/yBrainstorming/diagrams/Pilot|AddToDB|Coding/PilotComponents/PromptMgmtDeprecated/PromptInput";
import BrainstormingList      from "./components/yBrainstorming/BrainstormingList";
import BooksViewer            from "./components/zArchive/Archive 1/BooksViewer";
import BooksViewer2           from "./components/Main/0.BaseFiles/Dashboard";
import Home                   from "./components/zArchive/Archive 7/Home";

/* ---------- main app component ---------- */
function App() {
  const dispatch = useDispatch();

  /* keep Redux examType in sync with Firebase auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) dispatch(fetchExamType(user.uid));
      else      dispatch(clearExamType());
    });
    return () => unsub();
  }, [dispatch]);

  return (
    <Router>
      <Routes>

        {/* ────────────────────────────────────────────────
           ROOT  → always redirect to /neet
        ──────────────────────────────────────────────── */}
       {/* ───────── PUBLIC: everything ⇒ /neet ───────── */}
<Route path="/"         element={<Navigate to="/neet" replace />} />
<Route path="/neet"     element={<NEETUGLandingPage />} />

{/* Any of the old slugs immediately bounce to /neet */}
<Route path="/toefl"         element={<Navigate to="/neet" replace />} />
<Route path="/cat"           element={<Navigate to="/neet" replace />} />
<Route path="/cbse"          element={<Navigate to="/neet" replace />} />
<Route path="/frm"           element={<Navigate to="/neet" replace />} />
<Route path="/gate"          element={<Navigate to="/neet" replace />} />
<Route path="/gre"           element={<Navigate to="/neet" replace />} />
<Route path="/jeeadvanced"   element={<Navigate to="/neet" replace />} />
<Route path="/sat"           element={<Navigate to="/neet" replace />} />
<Route path="/upsc"          element={<Navigate to="/neet" replace />} />

{/* Optional: remove the generic landing page entirely
<Route path="/landing"  element={<Navigate to="/neet" replace />} /> */}
        {/* Fallback general landing (if you still want it) */}
        <Route path="/landing"       element={<LandingPage />} />

        {/* AUTH pages (still public) */}
        <Route path="/authlogin"       element={<AuthLogin />} />
        <Route path="/authsigngoogle"  element={<AuthSignGoogle />} />
        <Route path="/authsignin"      element={<AuthSignIn />} />

        {/* ─── PROTECTED ROUTES (wrapped in <PrivateRoute>) ─── */}
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        <Route path="/login"      element={<PrivateRoute><Login /></PrivateRoute>} />
        <Route path="/chat/:id"   element={<PrivateRoute><ChatInterface /></PrivateRoute>} />

        {/* (… keep every other protected route exactly as before …) */}
        <Route path="/books"                  element={<PrivateRoute><BooksViewer /></PrivateRoute>} />
        <Route path="/upload-pdf"             element={<PrivateRoute><PdfUploader /></PrivateRoute>} />
        <Route path="/subchapters-uploader"   element={<PrivateRoute><SubChaptersUploader /></PrivateRoute>} />
        <Route path="/chapters-uploader"      element={<PrivateRoute><ChaptersUploader /></PrivateRoute>} />
        <Route path="/booktextviewer"         element={<PrivateRoute><BookTextViewer /></PrivateRoute>} />
        <Route path="/admindashboard"         element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/subchapternames"        element={<PrivateRoute><SubchapterNameUploader /></PrivateRoute>} />
        <Route path="/platformintro"          element={<PrivateRoute><PlatformIntro /></PrivateRoute>} />
        <Route path="/personalizationprogress"element={<PrivateRoute><PersonalizationProgress /></PrivateRoute>} />
        <Route path="/learnerpersona"         element={<PrivateRoute><LearnerPersonaForm /></PrivateRoute>} />
        <Route path="/onboardingassessment"   element={<PrivateRoute><OnboardingAssessment /></PrivateRoute>} />
        <Route path="/testview"               element={<PrivateRoute><TestView /></PrivateRoute>} />
        <Route path="/gamificationdashboard"  element={<PrivateRoute><GamificationDashboard /></PrivateRoute>} />
        <Route path="/material"               element={<PrivateRoute><MaterialUploadWizard /></PrivateRoute>} />
        <Route path="/coursesmaterialmanager" element={<PrivateRoute><CoursesMaterialManager /></PrivateRoute>} />
        <Route path="/booksoverview"          element={<PrivateRoute><BooksOverview /></PrivateRoute>} />
        <Route path="/readingplan"            element={<PrivateRoute><ReadingPlan /></PrivateRoute>} />
        <Route path="/gptquestiongenerator"   element={<PrivateRoute><GptQuestionGenerator /></PrivateRoute>} />
        <Route path="/books3"                 element={<PrivateRoute><BooksViewer3 /></PrivateRoute>} />
        <Route path="/adaptivestatsdashboard" element={<PrivateRoute><AdaptiveStatsDashboard /></PrivateRoute>} />
        <Route path="/planbrowser"            element={<PrivateRoute><PlanBrowser /></PrivateRoute>} />
        <Route path="/planfetcher"            element={<PrivateRoute><PlanFetcher /></PrivateRoute>} />
        <Route path="/stagetimeline"          element={<PrivateRoute><StageTimeline /></PrivateRoute>} />
        <Route path="/dashboard"              element={<PrivateRoute><BooksViewer2 /></PrivateRoute>} />
        <Route path="/home"                   element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/promptmanager"          element={<PrivateRoute><PromptManager /></PrivateRoute>} />
        <Route path="/promptinput"            element={<PrivateRoute><PromptInput /></PrivateRoute>} />
        <Route path="/brainstorming"          element={<PrivateRoute><BrainstormingList /></PrivateRoute>} />

        {/* ─── catch-all → /neet ─── */}
        <Route path="*" element={<Navigate to="/neet" replace />} />

      </Routes>
    </Router>
  );
}

export default App;