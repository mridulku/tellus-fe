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

export default function FlowPreLogin() {
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // ----------------------------------------------------------------
  // 1) DEFINE NODES
  //    We'll manually position each lane's nodes at different X offsets.
  //    Each lane flows top -> down, so we increment the Y position for each step.
  // ----------------------------------------------------------------
  const initialNodes = useMemo(() => {
    const nodes = [
      //

      // LANE A: LandingPage (x=0)
// ========== LANE A: OnboardingModal (x=0) ==========
{
    id: "A1",
    type: "verboseNode",
    position: { x: 0, y: 0 },
    data: {
      label: "OnboardingModal: Props & Overall",
      details: `
  Props:
   - open (bool): controls visibility
   - onClose (fn): close overlay
   - onOpenPlanEditor(bookId): open plan editor after onboarding.
  
  Internally:
   - enableChat=false => by default shows OnboardingFormContent.
   - If enableChat=true, we'd toggle between <OnboardingChatContent> and <OnboardingFormContent>.
      `,
    },
  },
  {
    id: "A2",
    type: "verboseNode",
    position: { x: 0, y: 200 },
    data: {
      label: "OnboardingModal: handleOnboardingComplete(bookId)",
      details: `
  When the user finishes the flow:
   1) call onClose => hides the overlay
   2) call onOpenPlanEditor(bookId) => triggers plan editor
  Hence the parent can show a new modal or route to a wizard for plan creation.
      `,
    },
  },
  {
    id: "A3",
    type: "verboseNode",
    position: { x: 0, y: 400 },
    data: {
      label: "OnboardingModal: Rendering",
      details: `
  If !open => return null (nothing).
  Else => 
   <div> with an overlay => <button onClick={onClose}>X</button>
    - If enableChat => either <OnboardingChatContent/> or <OnboardingFormContent/>
    - Else => just <OnboardingFormContent/>
  Top-level CSS: 
   - overlayStyle => fixed position, dark background
   - modalStyle => center, background=rgba(0,0,0,0.8), etc.
      `,
    },
  },
  
  // ========== LANE B: OnboardingChatContent (x=600) ==========
  {
    id: "B1",
    type: "verboseNode",
    position: { x: 600, y: 0 },
    data: {
      label: "OnboardingChatContent: Chat-based Approach",
      details: `
  • A “chat UI” that guides the user:
     1) PDF upload => transitions to
     2) “Process Animation” steps => enumerating chapters, subchapters
     3) Basic “Plan creation wizard”
  
  • The user sees messages in a bubble-like interface, can type or click “upload” to proceed. 
      `,
    },
  },
  {
    id: "B2",
    type: "verboseNode",
    position: { x: 600, y: 200 },
    data: {
      label: "OnboardingChatContent: Step 0 => PDF Upload",
      details: `
  - If chatFlowStep===0 => user picks a PDF => handlePDFUpload => 
    => uploads to Firebase => triggers chatFlowStep=1 => fetchLatestBookAndProcess()
  - The logic calls /api/latest-book or /api/process-book-data to get chapters => sets processStep=0 => the “process animation” steps
      `,
    },
  },
  {
    id: "B3",
    type: "verboseNode",
    position: { x: 600, y: 400 },
    data: {
      label: "OnboardingChatContent: Step 1 => 'Process Animation' in Chat",
      details: `
  - We store processStep from 0..8 => each sub-step logs or typed out chapters/subchapters
  - typedChapters => typed out one by one, subchapterMap => expanded
  - after finishing => set chatFlowStep=2 => show a plan wizard
      `,
    },
  },
  {
    id: "B4",
    type: "verboseNode",
    position: { x: 600, y: 600 },
    data: {
      label: "OnboardingChatContent: Step 2 => Plan Wizard (Minimal)",
      details: `
  - planWizardStep => 0..3
    => 0 => select chapters
    => 1 => set schedule
    => 2 => confirm & create plan
    => 3 => done
  - handleCreatePlan => not fully implemented here => sets planWizardStep=3
  - We could show aggregator or finalize => “Plan Created!”
  
  Hence the user flows from PDF upload -> content animation -> plan wizard => done. 
      `,
    },
  },
  
  // ========== LANE C: OnboardingFormContent (x=1200) ==========
  {
    id: "C1",
    type: "verboseNode",
    position: { x: 1200, y: 0 },
    data: {
      label: "OnboardingFormContent: ParentStep",
      details: `
  Flow steps:
   0 => <OnboardingCarousel/>
   1 => <UploadBook/>
   2 => <ProcessAnimation/>
  When done => call onOnboardingComplete(bookId)
      `,
    },
  },
  {
    id: "C2",
    type: "verboseNode",
    position: { x: 1200, y: 200 },
    data: {
      label: "OnboardingFormContent: Check if user isOnboarded",
      details: `
  - On mount => check firebase auth => set userId
  - Then call GET /api/learner-personas?userId => if (isOnboarded) => skip carousel => setParentStep=1 
    else => parentStep=0 => show the carousel first
  - isLoading => show <CircularProgress> until we know user’s onboarding state
      `,
    },
  },
  {
    id: "C3",
    type: "verboseNode",
    position: { x: 1200, y: 400 },
    data: {
      label: "OnboardingFormContent: Steps UI",
      details: `
  Step 0 => <OnboardingCarousel onFinish => setParentStep(1)>
  Step 1 => <UploadBook onComplete => setParentStep(2)>
  Step 2 => <ProcessAnimation onShowPlanModal => handleAnalyzeComplete(bookId) => onOnboardingComplete(bookId)
  
  We also show a Stepper for steps 1 & 2 => (Upload, Analyze).
      `,
    },
  },
  
  // ========== LANE D: OnboardingCarousel (x=1800) ==========
  {
    id: "D1",
    type: "verboseNode",
    position: { x: 1800, y: 0 },
    data: {
      label: "OnboardingCarousel: Intro Slides",
      details: `
  - Uses react-slick <Slider> => slidesToShow=1, infinite=false, dots=true, etc.
  - 3 slides total:
     Slide 1 => "Upload Any Content"
     Slide 2 => "Smart Study Plans"
     Slide 3 => "Quizzes & Summaries" => final => onFinish()
  
  Hence it's a simple tutorial or welcome carousel. 
      `,
    },
  },
  {
    id: "D2",
    type: "verboseNode",
    position: { x: 1800, y: 200 },
    data: {
      label: "OnboardingCarousel: Next / Back Buttons",
      details: `
  - Each slide has a <Button onClick={goNext}> or onFinish
  - The sliderRef => calls slickNext() / slickPrev()
  - On the last slide => "Finish" => calls onFinish => typically setParentStep(1) in the parent
      `,
    },
  },
  
  // ========== LANE E: UploadBook (x=2400) ==========
  {
    id: "E1",
    type: "verboseNode",
    position: { x: 2400, y: 0 },
    data: {
      label: "UploadBook: PDF & Title",
      details: `
  Props:
    - userId
    - onComplete => after successful upload => next step
  UI:
    - user picks a PDF => store in pdfFile
    - optional pdfTitle => or autoGenerateTitle
    - click "Upload" => uploading => track progress => mark user onboarded => onComplete()
      `,
    },
  },
  {
    id: "E2",
    type: "verboseNode",
    position: { x: 2400, y: 200 },
    data: {
      label: "UploadBook: Firebase Upload",
      details: `
  uploadBytesResumable => listens for progress => setUploadProgress => up to 100%
  Once done => getDownloadURL => store in DB if needed
  Then markUserOnboarded => POST /api/learner-personas/onboard => { userId }
  Finally => setUploadDone(true), onComplete()
      `,
    },
  },
  
  // ========== LANE F: ProcessAnimation (x=3000) ==========
  {
    id: "F1",
    type: "verboseNode",
    position: { x: 3000, y: 0 },
    data: {
      label: "ProcessAnimation: 20s Pre-Load => Then fetch latestBook",
      details: `
  - On mount => set an interval for progress= +5% every second => after 20s => fetchLatestBook => handleStartProcessing(bookId).
  - This simulates a “wait while we do background tasks.”
      `,
    },
  },
  {
    id: "F2",
    type: "verboseNode",
    position: { x: 3000, y: 200 },
    data: {
      label: "ProcessAnimation: handleStartProcessing => /api/process-book-data",
      details: `
  1) GET /api/process-book-data?userId=...&bookId=...
  2) Clean + sort chapters by numeric prefix => store in chapters
  3) setCurrentStep(0) => triggers the step-based effect
      `,
    },
  },
  {
    id: "F3",
    type: "verboseNode",
    position: { x: 3000, y: 400 },
    data: {
      label: "ProcessAnimation: step-based effect (0..8)",
      details: `
  At each step:
  - step=0 => after 1s => step=1
  - step=1 => after 1s => step=2 ...
  - step=3 => “type out each chapter name”
  - step=5 => “detect sub-chapters” with a small delay
  - step=8 => show “Create Plan” => user can click => onShowPlanModal(bookId)
  Hence it visually reveals each stage of analyzing the book’s chapters/subchapters.
      `,
    },
  },
  {
    id: "F4",
    type: "verboseNode",
    position: { x: 3000, y: 600 },
    data: {
      label: "ProcessAnimation: Rendering + Final 'Create Adaptive Plan' Button",
      details: `
  We show a small label for each step + a spinner or check icon if completed.
  When we reach step=8 => display a <Button> => onClick => onShowPlanModal(bookId)
  Parent could show a plan wizard. 
  Hence the user sees a "fancy" step progress for content ingestion.
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