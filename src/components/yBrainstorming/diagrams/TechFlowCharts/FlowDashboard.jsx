import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

import VerboseNode from "../Business/Support/VerboseNode"; // Your custom tooltip node

/**
 * FlowComponentsBreakdown
 * -----------------------
 * Renders multiple "vertical" flows side by side:
 *   - PlanFetcher
 *   - LeftPanel
 *   - MainContent
 *   - ReadingView, QuizView, ReviseView
 *   - planSlice
 *   - authSlice
 *   - store
 *   - TopBar
 * 
 * Each lane is a separate set of nodes/edges stacked vertically (top to bottom).
 * We do NOT create edges across lanes, so each lane stands alone.
 */

export default function FlowDashboard() {
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // ----------------------------------------------------------------
  // 1) DEFINE NODES
  //    We'll manually position each lane's nodes at different X offsets.
  //    Each lane flows top -> down, so we increment the Y position for each step.
  // ----------------------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //
      // LANE 1: PlanFetcher (x=0)
      //
 // ============================ LANE A: "Dashboard - High-Level States & Modals" ============================
{
    id: "DBA1",
    type: "verboseNode",
    data: {
      label: "Dashboard: Basic States & Onboarding",
      details: `
  1) showOnboardingModal => controls if the initial Onboarding flow is visible.
     - If user is not 'onboarded', we show it. Otherwise hidden.
  
  2) showPlanEditor => boolean that toggles a separate plan editor modal (EditAdaptivePlanModal).
     planEditorBookId => which specific book ID to edit in that modal.
  
  3) We also hold a reference to userId from the hook, and watch if isOnboarded is false => showOnboardingModal immediately.
  
  This lane basically deals with top-level booleans and modals that revolve around user setup & plan editing.
      `,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "DBA2",
    type: "verboseNode",
    data: {
      label: "Dashboard: Cinematic Player & Joyride",
      details: `
  1) showPlayer => controls the AdaptivePlayerModal (the 'cinematic' overlay).
  2) currentModalPlanId => which plan ID the player should load. 
  3) initialActivityContext => which subChapter to jump to inside that plan.
  4) triggerTour => whether to start a Joyride tour, toggled by a floating "?" button.
  
  Implementation highlights:
  - handleOpenPlayer(planId, activity, fetchUrl):
     sets currentModalPlanId=planId, initialActivityContext={subChapterId, type},
     sets modalFetchUrl if needed,
     then showPlayer=true.
  
  - setTriggerTour(true) => starts the guided steps in <ToursManager/>.
      `,
    },
    position: { x: 0, y: 200 },
  },
  {
    id: "DBA3",
    type: "verboseNode",
    data: {
      label: "Dashboard: Theming & Layout",
      details: `
  • We define themeColors => background, sidebarBg, accent, etc.
  • The root container has styling:
     width=100vw, height=100vh, display:flex + column, background=themeColors.background
  • innerContentWrapper => flex=1 for main area
  • mainContentStyle => overflowY=auto, padding=20px, backgroundColor=themeColors.background
  
  These define the overall look & feel for the entire dashboard.
      `,
    },
    position: { x: 0, y: 400 },
  },
  
  // ============================ LANE B: "Dashboard - View Modes & Main Content" ============================
  {
    id: "DBB1",
    type: "verboseNode",
    data: {
      label: "Dashboard: viewMode & Content Determination",
      details: `
  viewMode can be "overview", "profile", "library", "adaptive", "home", etc. 
  We use a simple if-else or switch block to decide what 'mainContent' is rendered:
  
  • "overview" => StatsPanel + PanelC + PanelAdaptiveProcess
  • "profile" => <UserProfileAnalytics/>
  • "library" => show LibraryHome or Book/Chapter details
  • "adaptive" => show AdaptiveHome or Book/Chapter details
  • "home" => <MaterialsDashboard/> (the default main home screen)
  
  Hence the user toggles between different "modes" of the dashboard, controlling which components appear.
      `,
    },
    position: { x: 600, y: 0 },
  },
  {
    id: "DBB2",
    type: "verboseNode",
    data: {
      label: "Dashboard: Passing Data to Main Content",
      details: `
  • We rely on variables from useBooksViewer():
     - displayedBooksData => from getFilteredBooksData()
     - selectedBook, selectedChapter, selectedSubChapter
     - handleToggleDone, fetchAllData, getBookProgressInfo
  • For each sub-view (e.g. <LibraryHome/>, <AdaptiveHome/>, <BookProgress/>, <SubchapterContent/>) we pass the relevant props:
     - userId => for server calls
     - onRefreshData => to reload from backend
     - handleBookClick, handleChapterClick, handleSubChapterClick => state changes
     - onOpenPlayer => to open the cinematic player
  
  This ensures each sub-view can perform its specialized logic but remain connected to the main dashboard data layer.
      `,
    },
    position: { x: 600, y: 200 },
  },
  {
    id: "DBB3",
    type: "verboseNode",
    data: {
      label: "Dashboard: The Final Rendering",
      details: `
  The component returns:
    <div style={outerContainerStyle}>
      <div style={innerContentWrapper}>
        <UnifiedSidebar ... />
        <div style={mainContentStyle}>{mainContent}</div>
      </div>
  
      <button style={floatTourButtonStyle} onClick={() => setTriggerTour(true)}>?</button>
      <ToursManager ... />
      <AdaptivePlayerModal ... />
      <OnboardingModal ... />
      <EditAdaptivePlanModal ... />
    </div>
  
  Hence the Dashboard is effectively:
  - A left sidebar + main content area
  - A floating "?" for tours
  - Various modals (onboarding, plan editor, cinematic player) conditionally shown
      `,
    },
    position: { x: 600, y: 400 },
  },
  
  // ============================ LANE C: "Dashboard Hooks & Sidebar Interaction" (Optional) ============================
  // (If you want a separate lane for how the sidebar toggles or further states)
  {
    id: "DBC1",
    type: "verboseNode",
    data: {
      label: "Sidebar Collapse & Toggle Logic",
      details: `
  • isSidebarCollapsed => boolean controlling if the <UnifiedSidebar/> is compressed or not.
  • handleToggleSidebar => flips isSidebarCollapsed.
  • The sidebar receives props to show/hide or reduce width to 60px, etc.
  
  This is a simple UI detail but it ties into the overall layout.
      `,
    },
    position: { x: 1200, y: 0 },
  },
  {
    id: "DBC2",
    type: "verboseNode",
    data: {
      label: "Triggering Onboarding & Plan Editor from Sidebar",
      details: `
  In some flows, the user can click something in the sidebar to open Onboarding or Plan Editor:
  - e.g. if they haven't done a certain step, we might show a prompt
  - The callback: onOpenOnboarding => setShowOnboardingModal(true)
  - Or onOpenPlanEditor => pass a bookId => showPlanEditor=true
  
  This is how the various modals tie back to user actions in the side panel.
      `,
    },
    position: { x: 1200, y: 200 },
  },
  
  // ---------- HOOK LANES BELOW ----------
  
  // ============================ LANE D: "useBooksViewer - Authentication & Onboarding" ============================
  {
    id: "HK1",
    type: "verboseNode",
    data: {
      label: "useBooksViewer: userId & Onboarding Flow",
      details: `
  1) We track userId using Firebase Auth => onAuthStateChanged sets userId= user?.uid or null.
  2) isOnboarded => we fetch from /api/learner-personas?userId=..., if success => setIsOnboarded(true/false).
  3) If userId is null => isOnboarded resets to null => might lead Dashboard to show Onboarding again or do nothing.
  4) This allows us to know if the user has completed the initial setup steps.
      `,
    },
    position: { x: 1800, y: 0 },
  },
  {
    id: "HK2",
    type: "verboseNode",
    data: {
      label: "useBooksViewer: Plan IDs & HomePlan",
      details: `
  We fetch plan IDs from:
  • /api/home-plan-id => sets homePlanId
  • /api/adaptive-plan-id => sets planIds => array
  Both triggered whenever userId changes (since plan IDs are user-specific).
  
  Hence the user might have multiple adaptive plans (planIds) plus a single "homePlanId" for quick launching or default usage. 
      `,
    },
    position: { x: 1800, y: 200 },
  },
  
  // ============================ LANE E: "useBooksViewer - Category & Book Data" ============================
  {
    id: "HK3",
    type: "verboseNode",
    data: {
      label: "useBooksViewer: Category / Book State",
      details: `
  1) categories => fetched from /api/categories => stored in state => we pick selectedCategory as the first in the list by default.
  2) booksData => raw array of books (title, chapters, subChapters) for the selectedCategory & userId => /api/books?categoryId=...&userId=...
  3) booksProgressData => aggregated info from /api/books-aggregated => includes progress stats, done subchapters, etc.
  4) viewMode => "library", "adaptive", "overview", etc. controls how we filter or present the data.
  
  We do a fetchAllData() once userId & selectedCategory are known => sets both booksData & booksProgressData.
      `,
    },
    position: { x: 2400, y: 0 },
  },
  {
    id: "HK4",
    type: "verboseNode",
    data: {
      label: "useBooksViewer: Selections & Expansion Toggles",
      details: `
  • selectedBook, selectedChapter, selectedSubChapter => which item is open in the UI.
  • expandedBookName => the book currently "expanded" in a list, so we can show its chapters.
  • expandedChapters => array of chapter keys we expand.
  • Handlers:
     - handleBookClick(book) => setSelectedBook(book)
     - handleChapterClick(chapter) => setSelectedChapter(chapter)
     - handleSubChapterClick(sub) => setSelectedSubChapter(sub)
     - toggleBookExpansion(name), toggleChapterExpansion(key) => show/hide deeper content
      `,
    },
    position: { x: 2400, y: 200 },
  },
  {
    id: "HK5",
    type: "verboseNode",
    data: {
      label: "useBooksViewer: getFilteredBooksData & Return",
      details: `
  1) getFilteredBooksData():
     - if viewMode === "library", return all booksData
     - if viewMode === "adaptive", filter out only subChapters that have 'adaptive'===true
     - else => return the entire booksData array
  
  2) The hook's return object includes:
     {
       userId, isOnboarded, homePlanId, planIds,
       categories, selectedCategory,
       booksData, booksProgressData,
       selectedBook, selectedChapter, selectedSubChapter,
       expandedBookName, expandedChapters,
       viewMode, setViewMode,
       ...
       handleBookClick, handleChapterClick, ...
       fetchAllData, ...
       getFilteredBooksData,
     }
  
  Hence any consuming component (like Dashboard) can directly use these states & methods, providing a structured approach to data + logic for all 'books viewing' features.
      `,
    },
    position: { x: 2400, y: 400 },
  },

// LANE A: ToursManager (x=0)
{
    id: "A1",
    type: "verboseNode",
    position: { x: 3000, y: 0 },
    data: {
      label: "ToursManager: High-Level Overview",
      details: `
  • A component that manages “guided tours” with reactour for different conditions:
    1) overviewSteps
    2) libraryNoBookSteps
    3) libraryBookSelectedSteps
    4) librarySubchapterSteps
  • Decides which steps to load based on:
     - viewMode ("overview", "library", etc.)
     - selectedBook presence or not
     - selectedSubChapter presence
  • If the user triggers the tour (triggerTour=true), we:
     - filter steps to only those whose DOM selector actually exists
     - set isTourOpen(true)
  • If user changes viewMode while tour is open => forcibly close. 
  • On finishing or closing => onTourDone() callback to parent.
      `,
    },
  },
  {
    id: "A2",
    type: "verboseNode",
    position: { x: 3000, y: 200 },
    data: {
      label: "ToursManager: Step Arrays (Static)",
      details: `
  • Four arrays are defined outside the component:
     - overviewSteps => for 'overview' mode
     - libraryNoBookSteps => if viewMode='library' but no selectedBook
     - libraryBookSelectedSteps => if library + book chosen, but no subchapter
     - librarySubchapterSteps => if library + subchapter selected
  • Each step => { selector: "...", content: "..."} for reactour
  • The component picks one array for each scenario.
      `,
    },
  },
  {
    id: "A3",
    type: "verboseNode",
    position: { x: 3000, y: 400 },
    data: {
      label: "ToursManager: useEffect => Build Steps & Open Tour",
      details: `
  • On every change of (viewMode, selectedBook, selectedSubChapter, triggerTour):
     1) Decide newSteps => one of the 4 arrays.
     2) If triggerTour => filter out steps that do not have a matching DOM element => document.querySelector
     3) setSteps(finalSteps)
     4) If (triggerTour && finalSteps.length > 0) => setIsTourOpen(true)
        else => setIsTourOpen(false)
  • This ensures the user only sees steps relevant to the current UI context.
      `,
    },
  },
  {
    id: "A4",
    type: "verboseNode",
    position: { x: 3000, y: 600 },
    data: {
      label: "ToursManager: 2nd useEffect => force close if viewMode changes",
      details: `
  • If isTourOpen is true and user changes the viewMode => we do setIsTourOpen(false), call onTourDone()
  • This prevents the tour from continuing if the user navigates away from the relevant screen.
      `,
    },
  },
  {
    id: "A5",
    type: "verboseNode",
    position: { x: 3000, y: 800 },
    data: {
      label: "ToursManager: Rendering the <Tour/>",
      details: `
  • We pass:
     steps={steps}
     isOpen={isTourOpen}
     onRequestClose={handleClose}
     accentColor="#0084FF"
     rounded={8}
  
  • handleClose => setIsTourOpen(false), onTourDone?.()
  
  Hence the user sees a guided highlight on the elements in steps[].
      `,
    },
  },
  
  // LANE B: UnifiedSidebar (x=600)
  {
    id: "B1",
    type: "verboseNode",
    position: { x: 3600, y: 0 },
    data: {
      label: "UnifiedSidebar: Basic Structure",
      details: `
  • A collapsible sidebar with:
     - a "collapse" button at the top
     - a series of mode toggles (Overview, Home, Profile)
  • Props:
     - themeColors => { sidebarBg, borderColor, accent, textPrimary, ... }
     - viewMode, setViewMode => controlling which section user is in
  • We store local collapsed=true => toggles to false when user clicks => changes width from ~60px to ~140px.
      `,
    },
  },
  {
    id: "B2",
    type: "verboseNode",
    position: { x: 3600, y: 200 },
    data: {
      label: "UnifiedSidebar: Collapsed vs. Expanded",
      details: `
  • The container style => width: collapsed ? "60px" : "140px"
  • The collapse button => shows "»" if collapsed, else "«"
  • We can place the rest of the UI (buttons) below in a vertical stack
  • If collapsed => we might show just an icon, if expanded => show icon + text
      `,
    },
  },
  {
    id: "B3",
    type: "verboseNode",
    position: { x: 3600, y: 400 },
    data: {
      label: "UnifiedSidebar: Mode Toggle Buttons",
      details: `
  • Each button => has style toggled by (viewMode===someMode)
     => backgroundColor = accent if active, else transparent
     => onClick => setViewMode("home"), setViewMode("overview"), ...
  • We pass a short label or an icon. 
  • The user can see a minimal icon if collapsed or full label if expanded.
      `,
    },
  },
  {
    id: "B4",
    type: "verboseNode",
    position: { x: 3600, y: 600 },
    data: {
      label: "UnifiedSidebar: Potential expansions",
      details: `
  • Additional sections or toggles for "library", "adaptive" etc.
  • Could place user profile pic or logout button.
  • Could store the collapsed state in Redux or localStorage to keep the user’s preference.
      `,
    },
  },

  {
    id: "PR1",
    type: "verboseNode",
    position: { x: 4200, y: 0 },
    data: {
      label: "PrivateRoute: localStorage Token Check",
      details: `
  • On every render, we fetch localStorage.getItem("token").
  • If token is null/empty => the user is not authenticated => we redirect.
  • If token is present => we allow children to render.
      `,
    },
  },
  {
    id: "PR2",
    type: "verboseNode",
    position: { x: 4200, y: 200 },
    data: {
      label: "PrivateRoute: Redirect to '/' if No Token",
      details: `
  • If (!token) => return <Navigate to="/" replace />;
  • This means the user is forced back to the landing or login page.
  • 'replace' avoids adding a new entry to the browser history.
      `,
    },
  },
  {
    id: "PR3",
    type: "verboseNode",
    position: { x: 4200, y: 400 },
    data: {
      label: "PrivateRoute: Render Protected Child",
      details: `
  • If we have a token => just return {children}.
  • Typically the 'children' is a protected component (e.g., Dashboard).
  • This ensures only authenticated users can see that route.
      `,
    },
  },





    ];

    return nodes;
  }, []);

  // ----------------------------------------------------------------
  // 2) DEFINE EDGES
  //    Within each lane, we connect top -> bottom. No cross-lane edges.
  // ----------------------------------------------------------------
  const initialEdges = useMemo(() => {
    const edges = [
      // PlanFetcher lane
      { id: "PF1->PF2", source: "PF1", target: "PF2" },
      { id: "PF2->PF3", source: "PF2", target: "PF3" },
      { id: "PF3->PF4", source: "PF3", target: "PF4" },

      // LeftPanel lane
      { id: "LP1->LP2", source: "LP1", target: "LP2" },
      { id: "LP2->LP3", source: "LP2", target: "LP3" },
      { id: "LP3->LP4", source: "LP3", target: "LP4" },

      // MainContent lane
      { id: "MC1->MC2", source: "MC1", target: "MC2" },
      { id: "MC2->MC3", source: "MC2", target: "MC3" },

      // ReadingView lane
      { id: "RV1->RV2", source: "RV1", target: "RV2" },
      { id: "RV2->RV3", source: "RV2", target: "RV3" },

      // QuizView lane
      { id: "QV1->QV2", source: "QV1", target: "QV2" },
      { id: "QV2->QV3", source: "QV2", target: "QV3" },
      { id: "QV3->QV4", source: "QV3", target: "QV4" },

      // ReviseView lane
      { id: "RVV1->RVV2", source: "RVV1", target: "RVV2" },

      // planSlice lane
      { id: "PS1->PS2", source: "PS1", target: "PS2" },
      { id: "PS2->PS3", source: "PS2", target: "PS3" },

      // authSlice lane
      { id: "AS1->AS2", source: "AS1", target: "AS2" },

      // store lane
      { id: "ST1->ST2", source: "ST1", target: "ST2" },

      // TopBar lane
      { id: "TB1->TB2", source: "TB1", target: "TB2" },
    ];

    return edges;
  }, []);

  // ----------------------------------------------------------------
  // 3) STATE + RENDER
  // ----------------------------------------------------------------
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // No automatic layout; everything is manually positioned in columns
  // so we skip any useEffect to do layout.

  return (
    <div style={{ width: "100%", height: "100%", background: "#1e1e1e" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <MiniMap />
        <Controls />
        <Background color="#999" gap={16} />
      </ReactFlow>
    </div>
  );
}