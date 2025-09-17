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

export default function FlowReduxPlan() {
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // ----------------------------------------------------------------
  // 1) DEFINE NODES
  //    We'll manually position each lane's nodes at different X offsets.
  //    Each lane flows top -> down, so we increment the Y position for each step.
  // ----------------------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //

      // LANE A: MaterialsDashboard (x=0)
{
    id: "A1",
    type: "verboseNode",
    position: { x: 0, y: 0 },
    data: {
      label: "MaterialsDashboard: High-Level Container",
      details: `
  • This is the primary parent that splits into two columns:
     (1) Left => <Child1/>
     (2) Right => A combination of <ChildStats> + Tabs (Child2, Child3)
  
  Props:
  • userId, planIds, homePlanId, onOpenOnboarding, backendURL, onHomeSelect, onOpenPlayer
  • themeColors => styling info
  
  State:
  • selectedBookId, selectedBookName => set by handleBookSelect from <Child1/>
  • activeTab => 0 or 1 => "Overview Plan" (Child2) or "Home Plan" (Child3)
  
  Render Flow:
  1) The left column => <Child1 userId=... onBookSelect=handleBookSelect onOpenOnboarding=...>
  2) The right column => 
     - <ChildStats userId, bookId=selectedBookId, bookName=..., ...>
     - <Tabs value={activeTab} ...>
         Tab[0] => <Child2 planIds, bookId=..., onOverviewSelect, onOpenPlayer />
         Tab[1] => <Child3 userId=..., bookId=selectedBookId, planId=homePlanId, ... />
            (the "home plan" specifically)
  
  Hence MaterialsDashboard orchestrates all these sub-panels in a unified layout.
      `,
    },
  },
  {
    id: "A2",
    type: "verboseNode",
    position: { x: 0, y: 200 },
    data: {
      label: "MaterialsDashboard: handleBookSelect",
      details: `
  • Passed to <Child1> so when user clicks a book, we do:
     setSelectedBookId(bookId)
     setSelectedBookName(bookName)
  • Then <ChildStats> sees the new bookId, fetches plan info, etc.
  • The tab children (Child2, Child3) also read the same selectedBookId.
      `,
    },
  },
  {
    id: "A3",
    type: "verboseNode",
    position: { x: 0, y: 400 },
    data: {
      label: "MaterialsDashboard: Tab Switching",
      details: `
  • activeTab => 0 => <Child2> or 1 => <Child3>
  • Child2 => "Overview Plan"
  • Child3 => "Home Plan"
  • Both can open the cinematic player => onOpenPlayer(...) or call onHomeSelect(...) if needed.
  • The user can flip between these “views” for a selected book’s plan(s).
      `,
    },
  },
  
  // LANE B: Child1 (LibraryChild/Child1) (x=600)
  {
    id: "B1",
    type: "verboseNode",
    position: { x: 600, y: 0 },
    data: {
      label: "Child1: 'My Materials' List",
      details: `
  • Renders the user's books in a list with optional search, sort, pagination (5 per page).
  • Props:
     - userId
     - onBookSelect(bookId, bookName)
     - onOpenOnboarding => triggers the parent’s “upload” flow
  • Internal states: booksData, selectedBookId, page, searchQuery, sortOption
  • On mount => GET /api/books-user?userId=xxx => set booksData
      `,
    },
  },
  {
    id: "B2",
    type: "verboseNode",
    position: { x: 600, y: 200 },
    data: {
      label: "Child1: Searching & Sorting",
      details: `
  • We filter by searchQuery => book.name includes query
  • sortOption => "NEWEST", "OLDEST", "ALPHA_ASC", "ALPHA_DESC"
     => sort by createdAt or alphabetical
  • Then we slice for pagination => page => (page-1)*booksPerPage
  • Each “book card” shows progressPercent => e.g. # of subCh done / total
      `,
    },
  },
  {
    id: "B3",
    type: "verboseNode",
    position: { x: 600, y: 400 },
    data: {
      label: "Child1: handleCardClick => setSelectedBookId",
      details: `
  • If user clicks a book row => call onBookSelect(bookId, bookName) => 
     MaterialsDashboard sets that as the active book.
  • Also we highlight the selected row with a different background color or border.
      `,
    },
  },
  {
    id: "B4",
    type: "verboseNode",
    position: { x: 600, y: 600 },
    data: {
      label: "Child1: Upload Flow",
      details: `
  • There's an IconButton with <AddIcon/> => calls onOpenOnboarding => 
     parent triggers the “upload modal” or “onboarding flow” 
  • Hence Child1 can be the user’s main entry point for uploading new books.
      `,
    },
  },
  
  // LANE C: ChildStats (LibraryChild/ChildStats) (x=1200)
  {
    id: "C1",
    type: "verboseNode",
    position: { x: 1200, y: 0 },
    data: {
      label: "ChildStats: Book-Level Plan Summary",
      details: `
  • Props: 
     - userId, bookId, bookName
     - colorScheme => theming
     - onResume(bookId) => callback for "Resume Learning" button
     - backendURL => to fetch plan data
  • If !bookId => "No Book Selected"
  • If we have bookId => fetch /api/adaptive-plans?userId=xxx => filter for that book => pick the most recent
     => set serverPlan + aggregated stats (readTime, quizTime, reviseTime, totalPlanTime)
  • Also track planError, loadingPlan states
      `,
    },
  },
  {
    id: "C2",
    type: "verboseNode",
    position: { x: 1200, y: 200 },
    data: {
      label: "ChildStats: Aggregation + Info Cards",
      details: `
  • computeAggregation => sums readTime, quizTime, reviseTime, uniqueChapters, etc.
  • We show multiple "InfoCard" or "InfoCardWithProgress" boxes => e.g. “Target Date,” “Mastery Level,” “Total Plan Time,” ...
  • If no plan => "You have not created an adaptive plan for this book yet" => user can click “Create Plan Now” => open <EditAdaptivePlanModal/>
      `,
    },
  },
  {
    id: "C3",
    type: "verboseNode",
    position: { x: 1200, y: 400 },
    data: {
      label: "ChildStats: EditAdaptivePlanModal Integration",
      details: `
  • We hold editModalOpen => user can open it to create or edit an adaptive plan.
  • Once the plan is created => we re-fetch or show the newly updated plan data in this stats panel.
  • We also have "Resume Learning" => calls onResume(bookId) => parent might open the cinematic player or other logic.
      `,
    },
  },
  
  // LANE D: Child2 (LibraryChild/Child2) (x=1800)
  {
    id: "D1",
    type: "verboseNode",
    position: { x: 1800, y: 0 },
    data: {
      label: "Child2: 'Overview Plan' Tab",
      details: `
  • Receives:
     - userId, bookId, planIds => array of possible plan IDs
     - onOverviewSelect(activity)
     - onOpenPlayer(planId, activity, fetchUrl)
     - colorScheme => styling
  
  • Internally fetches plan data from /api/adaptive-plan?planId=..., or from an internal method that picks the first ID from planIds.
  • Renders a “tab” like UI => session-based, plus a "History" tab
      `,
    },
  },
  {
    id: "D2",
    type: "verboseNode",
    position: { x: 1800, y: 200 },
    data: {
      label: "Child2: localPlanIds & selectedPlanId",
      details: `
  • We store localPlanIds from props initially, then pick the first => selectedPlanId.
  • If user has multiple plans => user can choose from a <select> or something.
  • On selectedPlanId => fetch plan => set plan in local state => parse sessions/activities.
      `,
    },
  },
  {
    id: "D3",
    type: "verboseNode",
    position: { x: 1800, y: 400 },
    data: {
      label: "Child2: Session Tabs & 0 => 'HistoryTab'",
      details: `
  • We do an array: sessions = plan.sessions
     - 0th tab => <HistoryTab/> => shows a timeline or chapter-based log
     - tab i => session i-1 => show that day’s chapters & sub-chapters
  • expandChapters => track toggles for each chapter
  • each sub-ch => each activity => user can click => handleOpenPlanFetcher => onOpenPlayer(...) => cinematic modal
      `,
    },
  },
  {
    id: "D4",
    type: "verboseNode",
    position: { x: 1800, y: 600 },
    data: {
      label: "Child2: PlanFetcher Modal / Dialog",
      details: `
  • We open a <Dialog> that loads <PlanFetcher planId=...> 
    so user can step through reading/quiz in a cinematic approach.
  • This entire component is the “Overview Plan” approach where user sees sessions & a “History” tab.
      `,
    },
  },
  
  // LANE E: Child3 (LibraryChild/Child3) (x=2400)
  {
    id: "E1",
    type: "verboseNode",
    position: { x: 2400, y: 0 },
    data: {
      label: "Child3: 'Home Plan' Tab",
      details: `
  • Similar to Child2, but it tries to pick a single plan automatically from /api/home-plan-id?userId&bookId
  • planId => we do setPlanId(...) => fetch the plan doc => store in local state
  • Then we display the plan’s sessions => expand them out in a nested structure (session -> book -> chapter -> subCh -> activity).
      `,
    },
  },
  {
    id: "E2",
    type: "verboseNode",
    position: { x: 2400, y: 200 },
    data: {
      label: "Child3: Auto-Expansion",
      details: `
  • On plan load => we build an array of expandedSessions, expandedBooks, expandedChapters so everything is open by default
  • We track expandedSubs for subchapters individually
  • The user can toggle each level
      `,
    },
  },
  {
    id: "E3",
    type: "verboseNode",
    position: { x: 2400, y: 400 },
    data: {
      label: "Child3: Activity Rendering",
      details: `
  • For each activity => we display a row with timeNeeded + "Play" button => onOpenPlayer(planId, act, "/api/adaptive-plan").
  • Also calls onHomeSelect(act) if user clicks the row text 
  • The difference from Child2 is that Child3 is purely about the "home plan" or singled-out plan.
      `,
    },
  },
  
  // LANE F: EditAdaptivePlanModal (x=3000)
  {
    id: "F1",
    type: "verboseNode",
    position: { x: 3000, y: 0 },
    data: {
      label: "EditAdaptivePlanModal: Multi-Step Wizard",
      details: `
  • A 3-step wizard:
    Step 1 => <ChapterSelection />
    Step 2 => <PlanSelection />
    Step 3 => <PlanRender />
  
  Props:
    - open, onClose, userId, bookId, ...
    - renderAsDialog => if true, we show an MUI Dialog
  State:
    - activeStep => 0,1,2
    - chapters => from /api/process-book-data => sorted
    - selectedChapterIds => array or null if "all"
    - plan creation => call createPlanOnBackend => store createdPlan
    - then fetchMostRecentPlan => serverPlan => aggregated
      `,
    },
  },
  {
    id: "F2",
    type: "verboseNode",
    position: { x: 3000, y: 200 },
    data: {
      label: "EditAdaptivePlanModal: Step 1 => ChapterSelection",
      details: `
  • We fetch the book’s chapters/subchapters from /api/process-book-data
  • The user can uncheck entire chapters (subChs are auto toggled)
  • If all are selected => selectedChapterIds=null
  • If partial => an array of up to 10 chapters
  • If none => block the user => "select at least 1"
      `,
    },
  },
  {
    id: "F3",
    type: "verboseNode",
    position: { x: 3000, y: 400 },
    data: {
      label: "EditAdaptivePlanModal: Step 2 => PlanSelection + createPlanOnBackend",
      details: `
  • The user sets targetDate, dailyReadingTime, currentKnowledge + goalLevel => e.g. "none->basic" => planType
  • createPlanOnBackend => POST to some GCF endpoint e.g. generateadaptiveplan2 => store in DB => returns { planId, planDoc }
  • We also do a local feasibility check => planSummary => feasible or not
  • Then we move to Step 3
      `,
    },
  },
  {
    id: "F4",
    type: "verboseNode",
    position: { x: 3000, y: 600 },
    data: {
      label: "EditAdaptivePlanModal: Step 3 => PlanRender",
      details: `
  • We fetch the newly created plan again from /api/adaptive-plans?userId=..., picking the most recent
  • <PlanRender> shows a summary with "Target Date, Mastery Level, Unique SubCh, totalPlanTime" etc.
  • If user hits “Confirm Plan,” we close (onClose) and optionally open the Redux-based PlanFetcher in a new dialog
  • This completes the wizard for customizing an adaptive plan for a single book.
      `,
    },
  },
  
  // LANE G: PlanRender (HIDDIT/PlanRender.jsx) (x=3600)
  {
    id: "G1",
    type: "verboseNode",
    position: { x: 3600, y: 0 },
    data: {
      label: "PlanRender: Step 3 Detailed Summary",
      details: `
  Props:
   - isCreatingPlan, isFetchingPlan
   - serverError
   - serverPlan => { id, targetDate, level, createdAt, sessions, ... }
   - aggregated => { totalPlanTime, readTime, quizTime, reviseTime, uniqueChapterCount, ... }
   - planSummary => { feasible: bool, reason: string }
  
  UI:
   • If creating/fetching => show <CircularProgress/>
   • If serverError => show in red
   • If serverPlan & aggregated => display InfoCards for targetDate, masteryLevel, uniqueChapters, totalPlanTime, etc.
     plus a "feasibility" message
   • No direct plan editing or step transitions here => purely a read-only summary UI
      `,
    },
  },
  {
    id: "G2",
    type: "verboseNode",
    position: { x: 3600, y: 200 },
    data: {
      label: "PlanRender: InfoCard Components",
      details: `
  • Renders small Paper boxes with icon + label + value
  • E.g. <CalendarMonthIcon> => "Target Date => Oct 12"
  • This is purely presentational, giving a final overview of the plan stats.
      `,
    },
  },
  
  // LANE H: PlanSelection (HIDDIT/PlanSelection.jsx) (x=4200)
  {
    id: "H1",
    type: "verboseNode",
    position: { x: 4200, y: 0 },
    data: {
      label: "PlanSelection: Step 2 Fields",
      details: `
  • Props: 
    - targetDate, setTargetDate
    - dailyReadingTime, setDailyReadingTime
    - masteryLevel, setMasteryLevel (optional usage)
  • Renders:
    1) "Target Date" => <TextField type=date>
    2) "Daily Reading (min)" => number input
    3) "Mastery Level" => radio group => e.g. "mastery", "revision", "glance"
  
  • Also shows tooltips with <InfoIcon/> for each field
      `,
    },
  },
  {
    id: "H2",
    type: "verboseNode",
    position: { x: 4200, y: 200 },
    data: {
      label: "PlanSelection: MUI Layout",
      details: `
  • We place them in <Grid container spacing=3> => each <Grid item> has a portion 
  • We style them with a dark background (#333), color #fff, and use #B39DDB for focus outlines
  • The user enters these scheduling parameters => the parent wizard uses them to create the plan
      `,
    },
  },
  
  // LANE I: ChapterSelection (DetailedBookViewer/ChapterSelection.jsx) (x=4800)
  {
    id: "I1",
    type: "verboseNode",
    position: { x: 4800, y: 0 },
    data: {
      label: "ChapterSelection: Step 1 Tree",
      details: `
  Props:
   - chapters => array of { id, title, selected, expanded, subchapters: [...] }
   - onToggleChapter(chapterIndex)
   - onToggleSubchapter(...)
   - onAccordionToggle(chapterIndex)
  
  UI:
   • For each chapter => a <ListItem> with a <Checkbox> for "selected"
   • Clicking the row expands subchapters (MUI <Collapse>)
   • Subchapters are displayed with a bullet point (no toggles or checkboxes if we are ignoring subCh selection)
      `,
    },
  },
  {
    id: "I2",
    type: "verboseNode",
    position: { x: 4800, y: 200 },
    data: {
      label: "ChapterSelection: Implementation Details",
      details: `
  • The parent wizard (EditAdaptivePlanModal) modifies the array => toggling selected or expanded
  • This component is purely UI:
     - If user unchecks the chapter => handleToggleChapter => entire subCh is off
     - If user taps the row => onAccordionToggle => expanded or not
     - Subchapters are listed with label sub.title
      `,
    },
  },
  
  // LANE J: HistoryTab (DetailedBookViewer/HistoryTab.jsx) (x=5400)
  {
    id: "J1",
    type: "verboseNode",
    position: { x: 5400, y: 0 },
    data: {
      label: "HistoryTab: Timeline vs Chapter",
      details: `
  • We have sampleHistoryData => an array of { chapter, subchapter, activityType, completedAt }
  • The user can toggle "timeline" or "chapter" view with a <ToggleButtonGroup>
  
  If timeline:
   - Sorted desc by completedAt => <TimelineView>
     => We display each item with a vertical timeline line + bullet dot + activity info
  If chapter:
   - We group by chapter->subchapter => each activity row => "READ/QUIZ/REVISE + completedAt"
  
  Hence it's a simple UI to show historical logs of the user's completed tasks.
      `,
    },
  },
  {
    id: "J2",
    type: "verboseNode",
    position: { x: 5400, y: 200 },
    data: {
      label: "HistoryTab: Integration with Child2",
      details: `
  • Child2 uses <HistoryTab/> as tab #0 => "Timeline" or "By Chapter"
  • sampleHistoryData is local, but in a real app you'd fetch from /api/activities?userId=...
  • The timeline lines or bullet styling => we place a vertical line with partial transparency and a bullet at each item
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