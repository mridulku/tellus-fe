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

export default function FlowHomeComponentsNodes() {
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // ----------------------------------------------------------------
  // 1) DEFINE NODES
  //    We'll manually position each lane's nodes at different X offsets.
  //    Each lane flows top -> down, so we increment the Y position for each step.
  // ----------------------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //
  // EXAMPLE: HomeComponentsNodes.js (or inline in your Flow component)

// LANE 1: OverviewContent (x=0)
{
    id: "OC1",
    type: "verboseNode",
    data: {
      label: "OverviewContent: Intro & Steps Array",
      details: `
  • This component manages a chat-style onboarding flow.
  • We define an array of steps, each with:
     field, question, type, options
  • stepIndex = which step the user is on
  • formData = { name, exam, subject, dailyHours, etc. }
  • messages = chat logs, each { role, text }
  • This sets up the entire conversation logic.
      `,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "OC2",
    type: "verboseNode",
    data: {
      label: "OverviewContent: handleUserAnswer",
      details: `
  • The main driver: once user types or clicks an option, we store that answer in formData if relevant.
  • If the step is "confirmFinish" => finalizeSubmission() or go back a step
  • If the step is "pdfUpload" => wait for user to pick a file => store pdfFile
  • Next step => stepIndex++ => prompt next question
  • This function references the steps array to handle special logic (conditionalOptions, etc.)
      `,
    },
    position: { x: 0, y: 200 },
  },
  {
    id: "OC3",
    type: "verboseNode",
    data: {
      label: "OverviewContent: Chat UI & Options",
      details: `
  • We display the messages in a "chatBoxStyle" container. 
  • If it's an "options" step => we show buttons for each option, user clicks => handleOptionClick.
  • If it's a "pdfUpload" step => show <input type="file">, user picks => handleFileSelect => handleUserAnswer("PDF_FILE_CHOSEN").
  • If the user can type => we show an <input> + "Send" button => handleSend => addMessage('user', text).
  • The UI toggles text input depending on whether the step uses buttons or not.
      `,
    },
    position: { x: 0, y: 400 },
  },
  {
    id: "OC4",
    type: "verboseNode",
    data: {
      label: "OverviewContent: finalizeSubmission & PDF Upload",
      details: `
  • finalizeSubmission => the final action after confirmFinish.
     1) Upload PDF if present => uploadPDFWithMetadata => returns a downloadURL.
     2) Combine all formData + pdfLink => POST to /api/learnerpersona
     3) If success => setOnboardingComplete(true), add a "system" message "All set!"
  • uploadPDFWithMetadata => uses Firebase storageRef, tracks progress, resolves with the downloadURL.
  • This entire flow is triggered only at the final step.
      `,
    },
    position: { x: 0, y: 600 },
  },
  {
    id: "OC5",
    type: "verboseNode",
    data: {
      label: "OverviewContent: Edge Cases & Done State",
      details: `
  • onboardingComplete => once set to true, we disable further input.
  • If user says "No, go back" at confirmFinish => we revert stepIndex by 1 => re-ask the previous question.
  • If no file is selected, we skip PDF upload.
  • Chat log is appended each time with addMessage(role, text) => shows conversation to user.
  • So the component replicates a mini chat onboarding wizard.
      `,
    },
    position: { x: 0, y: 800 },
  },
  
  // LANE 2: PanelC (x=600)
  {
    id: "PC1",
    type: "verboseNode",
    data: {
      label: "PanelC: Book & Plan Fetching",
      details: `
  • On mount => fetch /api/books-user?userId=... => sets books in state
  • For each book => fetch /api/adaptive-plans?bookId => get the most recent plan, store in plansData[bookId]
  • plansData => { [bookId]: { loading, error, hasPlan, planId, readCount, quizCount, reviseCount, totalTime } }
  • This is how we know if a plan already exists for each book.
      `,
    },
    position: { x: 600, y: 0 },
  },
  {
    id: "PC2",
    type: "verboseNode",
    data: {
      label: "PanelC: Displaying Books + No. of Courses",
      details: `
  • We parse the array of books, decide how many to show.
     - if none => a "See All Courses" tile
     - if 1-3 => show them + "See All"
     - if > 3 => show first 3 + a tile with "X more courses"
  • Each tile shows book icon, name, plus plan info if available.
      `,
    },
    position: { x: 600, y: 200 },
  },
  {
    id: "PC3",
    type: "verboseNode",
    data: {
      label: "PanelC: Start Learning => Plan Dialog",
      details: `
  • If user clicks "Start Learning" => handleStartLearning(bookId)
     -> we check plansData[bookId].planId => store in currentPlanId => setShowPlanDialog(true)
  • Then we show a <Dialog> with <PlanFetcher planId={currentPlanId} userId={userId} />
  • If no plan => maybe a "Create Learning Plan" button or fallback message
      `,
    },
    position: { x: 600, y: 400 },
  },
  {
    id: "PC4",
    type: "verboseNode",
    data: {
      label: "PanelC: 'Upload New Material' + Onboarding",
      details: `
  • There's a button => onClick={onOpenOnboarding}
     -> This triggers the parent Dashboard or a modal to open the Onboarding flow for uploading new material.
  • So PanelC ties in with the entire user flow of retrieving courses, picking a plan, or starting the onboarding to create a new plan.
      `,
    },
    position: { x: 600, y: 600 },
  },
  
  // LANE 3: LibraryPanel (x=1200)
  {
    id: "LP1",
    type: "verboseNode",
    data: {
      label: "LibraryPanel: Books Overview & Upload",
      details: `
  • Props:
     - booksData => array of { id, title, author, coverUrl }
     - onUpload(file) => callback to handle actual upload logic
  
  • We show a "Upload Book" button => hidden <input type='file'> => handleFileChange => onUpload(file).
  • We display each book in a grid:
     - cover image or "No Cover"
     - title, author
     - fallback message if no books.
      `,
    },
    position: { x: 1200, y: 0 },
  },
  {
    id: "LP2",
    type: "verboseNode",
    data: {
      label: "LibraryPanel: Counting & Summaries",
      details: `
  • We show "You have X books in your library" at the top.
  • The user might see a row or grid of book cards.
  • No direct plan logic here => purely a library browsing panel.
  • The onUpload callback might be used by the parent to insert new entries or call the backend.
      `,
    },
    position: { x: 1200, y: 200 },
  },
  
  // LANE 4: PanelAdaptiveProcess (x=1800)
  {
    id: "PAP1",
    type: "verboseNode",
    data: {
      label: "PanelAdaptiveProcess: Explaining the Flow",
      details: `
  • Renders 6 steps with icons, describing the high-level adaptive learning steps:
     1) Upload Your Book
     2) We Break it Down
     3) Provide Requirements
     4) Generate Plan
     5) We Learn More About You
     6) Deliver & Iterate
  • It's a purely informational panel => no major logic or server calls.
      `,
    },
    position: { x: 1800, y: 0 },
  },
  {
    id: "PAP2",
    type: "verboseNode",
    data: {
      label: "PanelAdaptiveProcess: Step UI & Arrows",
      details: `
  • Each step is displayed in a vertical or column layout with a big icon + title + description + arrow "↓" to the next step.
  • This is just a visual "roadmap" for the user to understand the learning approach.
  • No user inputs => no complex state management.
      `,
    },
    position: { x: 1800, y: 200 },
  },
  
  // LANE 5: PanelE (x=2400)
  {
    id: "PE1",
    type: "verboseNode",
    data: {
      label: "PanelE: Auth + Plan Fetch from Server",
      details: `
  • We watch the Firebase auth => userId => GET /api/adaptive-plans?userId => set plans in state
  • The user picks a plan from a dropdown => selectedPlanId => we find the matching plan from the array => selectedPlan
  • If none => display "No plans found."
      `,
    },
    position: { x: 2400, y: 0 },
  },
  {
    id: "PE2",
    type: "verboseNode",
    data: {
      label: "PanelE: computeAggregation",
      details: `
  • For selectedPlan => we flatten all sessions/activities => sum readTime, quizTime, reviseTime, etc.
  • We group by book => group by chapter => gather subchapter counts, total times.
  • The result is displayed as a hierarchical summary with nested <div> blocks:
     Book -> Chapter -> Activities
  • This allows the user to see how many read/quiz/revise tasks are present, total time, etc.
      `,
    },
    position: { x: 2400, y: 200 },
  },
  {
    id: "PE3",
    type: "verboseNode",
    data: {
      label: "PanelE: UI Layout",
      details: `
  • Renders:
     1) "Plan Browser" heading
     2) If user not logged in => "No user is currently logged in."
     3) If user logged in => show a select box of all plans => onChange => setSelectedPlanId
     4) Once plan is selected => display plan details, plus aggregated stats. 
  • It's basically a direct "view" into the adaptive plans from the server.
      `,
    },
    position: { x: 2400, y: 400 },
  },
  
  // LANE 6: StatsPanel (x=3000)
  {
    id: "SP1",
    type: "verboseNode",
    data: {
      label: "StatsPanel: 4 Stat Cards",
      details: `
  • Renders a horizontal row of 4 small "cards":
     1) Today's Schedule => "1h 30m"
     2) Today's Progress => e.g. "60%" + progress bar
     3) Daily Average => "1h 20m"
     4) Active Courses => "4"
  
  • Each card has an icon (⏰, 📊, 🕒, 📚) and short text. 
  • It's purely presentational, no direct data fetch from server. 
    The parent might pass real stats if needed.
      `,
    },
    position: { x: 3000, y: 0 },
  },
  {
    id: "SP2",
    type: "verboseNode",
    data: {
      label: "StatsPanel: Layout & Style",
      details: `
  • We place them in a flex container => gap=20 => each card is a small box with backgroundColor=rgba(255,255,255,0.2).
  • The progress bar is a simple div with a fill width=some percentage. 
  • Potential expansions: hooking up real daily time or reading from plan data. 
  • For now, it’s a static or placeholder for demonstration.
      `,
    },
    position: { x: 3000, y: 200 },
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