import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase"; // Adjust path as needed

import AdminPanel from "../6.AdminPanel/AdminPanel"; 

import NewHome from "../7.NewHome/NewHome";    
import NewHome2 from "../8.NewHome2/NewHome2";    

import LoadingOnboarding from "./LoadingOnboarding";


const ADMIN_UIDS = [
  "acbhbtiODoPPcks2CP6Z",   // ← example
];

// ADD THIS IMPORT if you haven't already:
import axios from "axios";

import PlanFetcher from "../../Main/5.StudyModal/StudyModal";
import { useBooksViewer } from "./DashboardHooks";

// Import the updated Onboarding modal
import OnboardingModal from "../1.Upload/General Onboarding/ParentsOnboarding/0.OnboardingModal";
import TOEFLOnboardingModal from "../1.Upload/TOEFLOnboarding/TOEFLOnboardingModal";

// Import your separate Plan Editor modal
import EditAdaptivePlanModal from "../3.Library/2.CreateNewPlan(REDUNDANT PROBABLY)/AdaptivePlanModal/EditAdaptivePlanModal";

// Existing components
import MaterialsDashboard from "../3.Library/0.Parent/0.MaterialsDashboard";
import UnifiedSidebar from "./UnifiedSidebar";
import ToursManager from "./ToursManager";

import BookProgress from "../../zArchive/2.2Library/BookProgress";
import SubchapterContent from "../../zArchive/4.Subchapter Content/0.SubchapterContent";
import UserProfileAnalytics from "../4.Profile/UserProfileAnalytics";
import PanelC from "../2.HomePanels/4.PanelC";
import ProfilePanel from "../2.HomePanels/ProfilePanel";
import PanelAdaptiveProcess from "../2.HomePanels/PanelAdaptiveProcess";
import TOEFLAdaptiveProcess from "../2.HomePanels/TOEFLAdaptiveProcess";
import PanelE from "../2.HomePanels/PanelE";
import StatsPanel from "../2.HomePanels/TopStatsPanel";
import BookSummary from "../../zArchive/2.2Library/BookSummary";
import LibraryHome from "../../zArchive/2.2Library/LibraryHome";
import AdaptiveHome from "../../zArchive/2.3Adaptive/AdaptiveHome";

// The cinematic "player" modal
import AdaptivePlayerModal from "../../zArchive/3.AdaptiveModal/AdaptivePlayerModal";

function Dashboard() {
  const {
    userId,
    isOnboarded,
    homePlanId,
    planIds,
    categories,
    selectedCategory,
    getFilteredBooksData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
    expandedChapters,
    viewMode,
    setViewMode,
    handleCategoryChange,
    toggleBookExpansion,
    toggleChapterExpansion,
    handleBookClick,
    handleChapterClick,
    handleSubChapterClick,
    handleToggleDone,
    getBookProgressInfo,
    fetchAllData,
  } = useBooksViewer();

  const isAdmin = ADMIN_UIDS.includes(userId);

    /* ------------------------------------------------------------------ */
  /* 1)  EXAM TYPE MUST BE DECLARED *BEFORE* ANYONE READS IT            */
  /* ------------------------------------------------------------------ */
  const examType = useSelector((state) => state.exam.examType);

  // 1) Controls whether onboarding is shown
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 2) Controls whether the separate plan editor is shown
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  // 2a) We store which bookId the plan editor should use
  const [planEditorBookId, setPlanEditorBookId] = useState(null);

  // Joyride tours
  const [triggerTour, setTriggerTour] = useState(false);

  // Cinematic player modal
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentModalPlanId, setCurrentModalPlanId] = useState(null);
  const [initialActivityContext, setInitialActivityContext] = useState(null);
  const [modalFetchUrl, setModalFetchUrl] = useState("/api/adaptive-plan-total");

  // Some “Home” filler content
  const [selectedHomeActivity, setSelectedHomeActivity] = useState(null);

  // Decide theme colors
  const themeColors = {
    background: "#121212",
    sidebarBg: "#1E1E1E",
    accent: "#BB86FC",
    textPrimary: "#FFFFFF",
    textSecondary: "#CCCCCC",
    borderColor: "#3A3A3A",
  };

  const outerContainerStyle = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: themeColors.background,
    color: themeColors.textPrimary,
    fontFamily: "sans-serif",
  };

  const innerContentWrapper = {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    backgroundColor: themeColors.background,
  };

    const loaderStyle = {
    position: "fixed", inset: 0, background: "#000", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
  };

  // Floating "?" button style for tours
  const floatBtnBase = {
    position: "fixed",
    bottom: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    color: "#FFFFFF",
    fontSize: "1.5rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    transition: "background-color 0.3s ease",
  };

  const floatTourButtonStyle = {
    ...floatBtnBase,
    left: "20px",
    backgroundColor: themeColors.accent,
  };

  // Extract the filtered books
  const displayedBooksData = getFilteredBooksData();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };



  // -------------------------------------------
  // Manage Onboarding Plan for TOEFL
  // -------------------------------------------

  const [onboardingPlanId, setOnboardingPlanId] = useState(null);
  const [isCheckingPlanId, setIsCheckingPlanId] = useState(false);

    /* 🔒  Once we hand a planId to <PlanFetcher>, freeze that value so it
   *     never updates while the modal is still open.  This prevents the
   *     wizard from jumping to a brand-new adaptive plan created inside
   *     the onboarding flow itself.                                      */
  const [lockedOnboardingPlanId, setLockedOnboardingPlanId] = useState(null);

  useEffect(() => {
  if (showOnboardingModal                 // modal is visible
      && onboardingPlanId                 // we already fetched a planId
      && !lockedOnboardingPlanId) {       // but haven’t locked yet
    setLockedOnboardingPlanId(onboardingPlanId);
  }
}, [showOnboardingModal, onboardingPlanId, lockedOnboardingPlanId]);

  /* ---------- replace the old polling effect with this ---------- */
useEffect(() => {
  /** 1.  Which exams rely on a *pre‑generated* onboarding plan
   *      (i.e. the planId is written into users/{uid}.onboardingBook)?
   *      Add / remove slugs here as you roll‑out new exams.
   */
  const PREGENERATED_EXAMS = [
    "TOEFL",
    "CBSE",
    "JEEADVANCED",
    "NEET",
    "SAT",
    "GATE",
    "CAT",
    "GRE",
    "UPSC",
    "FRM",
    // "RELUX"   // ← keep if you have that special test exam
  ];

  let intervalId;

  /** 2.  Start polling only if:
   *      • the user’s exam is in the “pre‑generated” list
   *      • onboarding UI is currently open
   *      • we have a logged‑in userId
   */
  const needsPolling =
    PREGENERATED_EXAMS.includes(examType) &&
    showOnboardingModal &&
    userId;

  if (needsPolling) {
    setIsCheckingPlanId(true);

    const fetchPlanId = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/userDoc`,
          { params: { userId } }
        );

   // NEW — handles both the old *and* new payload formats
   const planId =
     res.data?.planId ||                          // <— current backend
     res.data?.userDoc?.onboardingBook?.planId;   // <— legacy fallback
                console.log("[poll] server says →", res.data?.userDoc?.onboardingBook);
           if (planId) {
     setOnboardingPlanId(planId);
     setIsCheckingPlanId(false);
     clearInterval(intervalId);   // stop polling once we have it
     return;                      // nothing else to do
   }

        
      } catch (err) {
        console.error("Error fetching onboarding planId:", err);
      }
    };

    fetchPlanId();                              // initial attempt
    intervalId = setInterval(fetchPlanId, 3000); // → every 3 s
  }

  /** 3.  Clean‑up the interval when component unmounts
   *      or when any dependency (examType / modal state / userId) changes.
   */
  return () => clearInterval(intervalId);
}, [examType, showOnboardingModal, userId]);



  /**
   * handleOpenPlanEditor(bookId) => Called by OnboardingModal
   * We store that bookId and show the plan editor
   */
  const handleOpenPlanEditor = (bId) => {
    setPlanEditorBookId(bId || null); // store the book ID
    setShowPlanEditor(true); // open the plan editor
  };

  /**
   * handleOpenPlayer => called by sidebars
   * Accepts up to 3 arguments: planId, activity, fetchUrl
   */
  const handleOpenPlayer = (pId, activity, fetchUrl) => {
    console.trace("[DEBUG] AdaptivePlayerModal requested for:", pId);

    // 1) Plan ID for the modal
    setCurrentModalPlanId(pId);

    // 2) Subchapter context for auto-expansion
    setInitialActivityContext({
      subChapterId: activity?.subChapterId,
      type: activity?.type,
    });

    // 3) If given, store a custom fetchUrl
    if (fetchUrl) {
      setModalFetchUrl(fetchUrl);
    } else {
      setModalFetchUrl("/api/adaptive-plan");
    }

    // 4) Show the cinematic player modal
    setShowPlayer(true);
  };

    // -------------------------------------------
  // 2) MONITOR ONBOARDING STATUS (now placed AFTER we have examType)
  // -------------------------------------------
  useEffect(() => {
    if (examType && isOnboarded === false) {
      setShowOnboardingModal(true);
    } else if (isOnboarded === true) {
      setShowOnboardingModal(false);
    }
  }, [examType, isOnboarded]);

   // 🔒 1. Pause *all* dashboard data-fetching while onboarding modal is shown
 if (showOnboardingModal) {
   return (
     <>
       {/* render only the modal chooser block ↓↓↓  (exact same JSX you already have) */}
       {["TOEFL","CBSE","JEEADVANCED","NEET","SAT","GATE","CAT","GRE","UPSC","FRM"]
         .includes(examType) && showOnboardingModal && (
           isCheckingPlanId ? (
            <LoadingOnboarding estSeconds={90} />
           ) : lockedOnboardingPlanId ? (
             <PlanFetcher
               planId={lockedOnboardingPlanId}
               userId={userId}
               initialActivityContext={null}
               backendURL={import.meta.env.VITE_BACKEND_URL}
               fetchUrl="/api/adaptive-plan"
               onClose={() => {
                 setShowOnboardingModal(false);
                 setLockedOnboardingPlanId(null);
               }}
             />
           ) : (
             <div style={loaderStyle}>No Onboarding Plan Found Yet.</div>
           )
       )}
     </>
   );
 }

  // Decide main content based on viewMode
  let mainContent;
  if (viewMode === "overview") {
    mainContent = (
      <>
        <StatsPanel userId={userId} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <PanelC
            db = {db}
            userId={userId}
            onOpenOnboarding={() => setShowOnboardingModal(true)}
            onSeeAllCourses={() => setViewMode("home")}
          />
          <ProfilePanel
            userId={userId}
          />
          {/* 
  {examType === "TOEFL" || examType === "RELUX" ? (
    <TOEFLAdaptiveProcess />
  ) : (
    <PanelAdaptiveProcess />
  )}
*/}
        </div>
      </>
    );
  } else if (viewMode === "profile") {
    mainContent = <UserProfileAnalytics />;
  } else if (viewMode === "library") {
    if (!selectedBook) {
      mainContent = <LibraryHome booksData={displayedBooksData} />;
    } else {
      mainContent = (
        <>
          {selectedSubChapter && (
            <BookProgress
              book={selectedBook}
              selectedChapter={selectedChapter}
              selectedSubChapter={selectedSubChapter}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}
          {selectedBook && !selectedSubChapter && (
            <BookSummary
              book={selectedBook}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}
          {selectedSubChapter && (
            <SubchapterContent
              subChapter={selectedSubChapter}
              onToggleDone={handleToggleDone}
              userId={userId}
              backendURL={import.meta.env.VITE_BACKEND_URL}
              onRefreshData={fetchAllData}
            />
          )}
        </>
      );
    }
  } else if (viewMode === "adaptive") {
    if (!selectedBook) {
      mainContent = <AdaptiveHome booksData={displayedBooksData} />;
    } else {
      mainContent = (
        <>
          {selectedSubChapter && (
            <BookProgress
              book={selectedBook}
              selectedChapter={selectedChapter}
              selectedSubChapter={selectedSubChapter}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}
          {selectedBook && !selectedSubChapter && (
            <BookSummary
              book={selectedBook}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}
          {selectedSubChapter && (
            <SubchapterContent
              subChapter={selectedSubChapter}
              onToggleDone={handleToggleDone}
              userId={userId}
              backendURL={import.meta.env.VITE_BACKEND_URL}
              onRefreshData={fetchAllData}
            />
          )}
        </>
      );
    }
  } else if (viewMode === "admin"  && isAdmin) {
    mainContent = <AdminPanel userId={userId}/>;
  } else if (viewMode === "newHome") {
    mainContent = (
      <NewHome
      onOpenOnboarding={() => setShowOnboardingModal(true)}
      isCollapsed={isSidebarCollapsed}
      userId={userId}
      onToggleCollapse={handleToggleSidebar}
      themeColors={themeColors}
      viewMode={viewMode}
      setViewMode={setViewMode}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      booksData={displayedBooksData}
      expandedBookName={expandedBookName}
      toggleBookExpansion={toggleBookExpansion}
      expandedChapters={expandedChapters}
      toggleChapterExpansion={toggleChapterExpansion}
      handleBookClick={handleBookClick}
      handleChapterClick={handleChapterClick}
      handleSubChapterClick={handleSubChapterClick}
      selectedSubChapter={selectedSubChapter}
      homePlanId={homePlanId}
      planIds={planIds}
      onHomeSelect={(act) => setSelectedHomeActivity(act)}
      onOpenPlayer={handleOpenPlayer}
      />
    );
  } else if (viewMode === "newHome2") {
    mainContent = (
      <NewHome2
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        isCollapsed={isSidebarCollapsed}
        userId={userId}
        onToggleCollapse={handleToggleSidebar}
        themeColors={themeColors}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        booksData={displayedBooksData}
        expandedBookName={expandedBookName}
        toggleBookExpansion={toggleBookExpansion}
        expandedChapters={expandedChapters}
        toggleChapterExpansion={toggleChapterExpansion}
        handleBookClick={handleBookClick}
        handleChapterClick={handleChapterClick}
        handleSubChapterClick={handleSubChapterClick}
        selectedSubChapter={selectedSubChapter}
        homePlanId={homePlanId}
        planIds={planIds}
        onHomeSelect={(act) => setSelectedHomeActivity(act)}
        onOpenPlayer={handleOpenPlayer}
        />
      );
    }
   else if (viewMode === "home") {
    // Show some home panel content or MaterialsDashboard
    mainContent = (
      <MaterialsDashboard
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        isCollapsed={isSidebarCollapsed}
        userId={userId}
        onToggleCollapse={handleToggleSidebar}
        themeColors={themeColors}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        booksData={displayedBooksData}
        expandedBookName={expandedBookName}
        toggleBookExpansion={toggleBookExpansion}
        expandedChapters={expandedChapters}
        toggleChapterExpansion={toggleChapterExpansion}
        handleBookClick={handleBookClick}
        handleChapterClick={handleChapterClick}
        handleSubChapterClick={handleSubChapterClick}
        selectedSubChapter={selectedSubChapter}
        homePlanId={homePlanId}
        planIds={planIds}
        onHomeSelect={(act) => setSelectedHomeActivity(act)}
        onOpenPlayer={handleOpenPlayer}
      />
    );
  }

  return (
    <div style={outerContainerStyle}>
      {/* Left Sidebar + Main Content */}
      <div style={innerContentWrapper}>
        <UnifiedSidebar
          isAdmin={isAdmin}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          themeColors={themeColors}
          viewMode={viewMode}
          setViewMode={setViewMode}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          booksData={displayedBooksData}
          expandedBookName={expandedBookName}
          toggleBookExpansion={toggleBookExpansion}
          expandedChapters={expandedChapters}
          toggleChapterExpansion={toggleChapterExpansion}
          handleBookClick={handleBookClick}
          handleChapterClick={handleChapterClick}
          handleSubChapterClick={handleSubChapterClick}
          selectedSubChapter={selectedSubChapter}
          homePlanId={homePlanId}
          planIds={planIds}
          onHomeSelect={(act) => setSelectedHomeActivity(act)}
          onOpenPlayer={handleOpenPlayer}
        />

        <div style={mainContentStyle}>{mainContent}</div>
      </div>
{/*
      <button
        style={floatTourButtonStyle}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#9852e8")}
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = themeColors.accent)
        }
        onClick={() => setTriggerTour(true)}
        title="Start Tour"
      >
        ?
      </button>
*/}


      {/* Joyride-based tours */}
      <ToursManager
        viewMode={viewMode}
        selectedBook={selectedBook}
        selectedSubChapter={selectedSubChapter}
        triggerTour={triggerTour}
        onTourDone={() => setTriggerTour(false)}
      />

      

      {/* Onboarding Modal */}
      {/* ‑‑‑ Onboarding modal chooser  ---------------------------------- */}
{["TOEFL","CBSE","JEEADVANCED","NEET","SAT","GATE","CAT","GRE","UPSC","FRM"].includes(examType) ? (
  // ONBOARDING CHOOSER  --------------------------------------------------
  showOnboardingModal && (
    !examType ? (
      /* 0️⃣  we don’t yet know which exam => stay on black loader */
      <div style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}>
        <h2>Loading Onboarding…</h2>
      </div>
    ) : (
      /* ✅  examType is present – now run your original logic */
      isCheckingPlanId ? (
        /* 1. still polling Firestore / Express */
        <div style={{
          position:"fixed",inset:0,
          background:"#000",color:"#fff",display:"flex",
          alignItems:"center",justifyContent:"center",zIndex:9999
        }}>
          <h2>Loading Onboarding…</h2>
        </div>
            ) : (
               /* 2️⃣  we’re done polling – now EITHER show the onboarding player
               OR the “no plan yet” placeholder.  NOTE we pass the
               *locked* planId to prevent hot-swapping while open.        */
        

        lockedOnboardingPlanId
          ? (
              <PlanFetcher
planId={lockedOnboardingPlanId}
                userId={userId}
                initialActivityContext={null}
                backendURL={import.meta.env.VITE_BACKEND_URL}
                fetchUrl="/api/adaptive-plan"
                onClose={() => {
                 /* hide modal + clear the lock for next time */
                  setShowOnboardingModal(false);
}}
              /*  allowClose={isOnboarded} */ 
             />
            )
          : (
              <div style={{
                position:"fixed",inset:0,
                background:"#000",color:"#fff",display:"flex",
                alignItems:"center",justifyContent:"center",zIndex:9999
              }}>
                <h2>No Onboarding Plan Found Yet.</h2>
              </div>
           
      )
    )
  ))
) : (
  /* fallback: generic upload‑first onboarding */
  <OnboardingModal
    open={showOnboardingModal}
    onClose={() => setShowOnboardingModal(false)}
    onOpenPlanEditor={(bookId) => console.log("Open plan editor", bookId)}
  />
)}

      {/* Plan Editor Modal (separate from onboarding) */}
      <EditAdaptivePlanModal
        open={showPlanEditor}
        onClose={() => setShowPlanEditor(false)}
        userId={userId}
        bookId={planEditorBookId} // pass the chosen book ID here
      />
    </div>
  );
}

export default Dashboard;