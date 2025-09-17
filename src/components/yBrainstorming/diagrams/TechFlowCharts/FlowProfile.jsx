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
// ========== LANE A: UserProfileAnalytics (x=0) ==========
{
    id: "A1",
    type: "verboseNode",
    position: { x: 0, y: 0 },
    data: {
      label: "UserProfileAnalytics: Basic Overview",
      details: `
  Props:
   - colorScheme (object) => custom styling (background, text colors)
  
  State:
   - userId, authLoading => track Firebase auth status
   - We use onAuthStateChanged => set userId or null
   - If user logs out => userId=null => navigate("/")
   
  Renders:
   - A logout button => calls handleLogout => signOut + remove localStorage tokens => navigate("/")
   - A "Global User Profile" card with userId
   - <UserHistory userId=.../>
      `,
    },
  },
  {
    id: "A2",
    type: "verboseNode",
    position: { x: 0, y: 200 },
    data: {
      label: "UserProfileAnalytics: onAuthStateChanged & authLoading",
      details: `
  • useEffect => auth.onAuthStateChanged
     => if user => user.uid => setUserId
     => else => setUserId(null)
     => set authLoading=false once done
  • Another effect => if (!authLoading && !userId) => navigate("/")
   => forcibly redirect if not logged in
      `,
    },
  },
  {
    id: "A3",
    type: "verboseNode",
    position: { x: 0, y: 400 },
    data: {
      label: "UserProfileAnalytics: handleLogout",
      details: `
  • signOut(auth) => localStorage.removeItem("token"), "userData"
  • console logs => "Sign-out succeeded"
  • navigate("/") => immediate redirect
  Hence user is fully signed out from the app (Firebase + local token).
      `,
    },
  },
  {
    id: "A4",
    type: "verboseNode",
    position: { x: 0, y: 600 },
    data: {
      label: "UserProfileAnalytics: Rendering Layout",
      details: `
  • A container <div style={{ background: colorScheme.mainBg }}>
  • If authLoading => "Checking sign-in status..."
  • If !authLoading && !userId => "No user is currently logged in."
  • If user => show:
     <Box> "Global User Profile" => userId 
     <UserHistory userId={userId}/>
      `,
    },
  },
  
  // ========== LANE B: UserHistory (x=600) ==========
  {
    id: "B1",
    type: "verboseNode",
    position: { x: 600, y: 0 },
    data: {
      label: "UserHistory: Basic Structure",
      details: `
  Props:
   - userId
   - colorScheme => styling
  State:
   - activityLog => array of user activity items
   - loadingActivities, error => track fetch from /api/user-activities
      `,
    },
  },
  {
    id: "B2",
    type: "verboseNode",
    position: { x: 600, y: 200 },
    data: {
      label: "UserHistory: useEffect => fetch user activities",
      details: `
  1) If no userId => set activityLog=[]
  2) Else => GET /api/user-activities?userId=...
     => if success => setActivityLog(response.data.data)
     => else => setError("some error msg")
     => catch => setError(err.message)
  Hence we get a chronological list of events: e.g. { eventType: "startReading", subChapterId, timestamp }
      `,
    },
  },
  {
    id: "B3",
    type: "verboseNode",
    position: { x: 600, y: 400 },
    data: {
      label: "UserHistory: Rendering",
      details: `
  - if loadingActivities => "Loading user activities..."
  - if error => show error message
  - if no logs => "No recent activity found."
  - else => map activityLog => each item => li
     - item.timestamp => format date
     - item.eventType => e.g. "startReading"
     - item.subChapterId => if present => "on subChapter x"
  Styling:
   - a small bullet or border-left, display date + short event text
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