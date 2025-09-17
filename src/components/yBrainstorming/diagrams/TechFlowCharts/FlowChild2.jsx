// FlowChild2.jsx
import React, { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";

import VerboseNode from "../Business/Support/VerboseNode";       // custom node with MUI Tooltips
import { getLayoutedElements } from "../Business/Support/layoutHelper"; // your Dagre-based layout helper

const nodeTypes = { verboseNode: VerboseNode };

export default function FlowChild2() {
  /**
   * We'll define ~8 nodes describing the main logic blocks of Child2.jsx.
   * Then let Dagre layout them top->bottom, and connect them linearly.
   */

  // 1) Define the nodes with short `label` and a verbose `details` tooltip
  const initialNodes = useMemo(() => [
    {
      id: "1",
      type: "verboseNode",
      data: {
        label: "Step 1: localPlanIds State",
        details: `We store 'localPlanIds' in React state, initially from (planIds) prop.
When planIds changes, we set localPlanIds = planIds. This is how we keep a local copy of plan IDs in the component.`
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "2",
      type: "verboseNode",
      data: {
        label: "Step 2: Fetch Plan IDs on (bookId) change",
        details: `Whenever userId or bookId changes, we call fetchPlansForBook():
  if (!userId || !bookId):
    localPlanIds=[]
    selectedPlanId=""
    plan=null
    return

  else => do an axios GET => "/api/adaptive-plan-id" with {userId, bookId}
   if res.data.planIds => set localPlanIds
   else => localPlanIds=[]

This populates localPlanIds[] with plan IDs relevant for that user/book combination.`
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "3",
      type: "verboseNode",
      data: {
        label: "Step 3: setSelectedPlanId + handle 'plan' state",
        details: `After we fetch plan IDs, if localPlanIds.length>0 => pick the first as "selectedPlanId". 
If none => selectedPlanId="", plan=null.

Then we watch selectedPlanId in useEffect => fetchPlanDoc():
  axios GET => "/api/adaptive-plan?planId=selectedPlanId"
   if res.data.planDoc => setPlan(res.data.planDoc)
   else => setPlan(null)`,
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "4",
      type: "verboseNode",
      data: {
        label: "Step 4: activeSessionIndex + expandedChapters",
        details: `We keep track of which session tab is active => "activeSessionIndex" state.
We also keep an array "expandedChapters" to expand/collapse each chapter.
When plan changes => we reset activeSessionIndex=0 and expandedChapters=[] so user sees the default view.`
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "5",
      type: "verboseNode",
      data: {
        label: "Step 5: PlanFetcher Dialog Setup",
        details: `We store showPlanDialog, dialogPlanId, dialogInitialActivity for a <Dialog>.
If user clicks an activity => handleOpenPlanFetcher(...) => sets showPlanDialog=true, sets dialogPlanId=the current plan, and optional initialActivityContext={ subChapterId, type, stage }. Then we show <PlanFetcher/> inside the Dialog.`
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "6",
      type: "verboseNode",
      data: {
        label: "Step 6: Handling No Plans vs. Multiple Plans",
        details: `If localPlanIds.length===0 && plan===null => we show "No plan IDs found".
If multiple plan IDs exist => we show a <select> for user to pick which plan ID => updates selectedPlanId => triggers refetch of planDoc.

Hence we can handle:
 - zero plan IDs => message
 - 1 or more => user picks from dropdown
 - or show "Loading plan data..." if plan is being fetched.`
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "7",
      type: "verboseNode",
      data: {
        label: "Step 7: Rendering the Plan UI + Sessions",
        details: `Once 'plan' is loaded => we call renderLocalPlan(plan). 
Inside that:
 - we get planObj.sessions => array of session objects
 - if sessions.length===0 => "No sessions found in this plan."
 - else => we display a row of tabs:
   * "History" tab => index=0
   * each session => "Day X" or "Today" or "Tomorrow" => index=1..n

We track activeSessionIndex => if 0 => <HistoryTab/> else => renderSessionContent(sessions[activeSessionIndex-1])`
      },
      position: { x: 0, y: 0 }
    },
    {
      id: "8",
      type: "verboseNode",
      data: {
        label: "Step 8: Session Content (chapters, subCh, timeline)",
        details: `renderSessionContent(...) => group session.activities by chapterId => 
 for each chapter => show chapterName, sumTime => expand/collapse => 
   for each subCh => show subName => each activity => a row with timeNeeded + timeline of stages

We define STAGE_ORDER=["Reading","Remember","Understand","Apply","Analyze"] => 
The current "active" stage is a button => user can open PlanFetcher dialog => passing that activity => 
Hence we get a mini timeline bar for each activity. The rest are just labels with reduced opacity.`
      },
      position: { x: 0, y: 0 }
    },
  ], []);

  // 2) A linear top->bottom set of edges
  const initialEdges = useMemo(() => [
    { id: "1->2", source: "1", target: "2" },
    { id: "2->3", source: "2", target: "3" },
    { id: "3->4", source: "3", target: "4" },
    { id: "4->5", source: "4", target: "5" },
    { id: "5->6", source: "5", target: "6" },
    { id: "6->7", source: "6", target: "7" },
    { id: "7->8", source: "7", target: "8" },
  ], []);

  // 3) Manage them in React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 4) On mount => auto layout with Dagre (top->bottom)
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, "TB");
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // run once
    // eslint-disable-next-line
  }, []);

  // 5) If user draws a new edge
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  return (
    <div style={styles.wrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        style={{ background: "#1c1c1c" }}
      >
        <MiniMap />
        <Controls />
        <Background color="#999" gap={16} />
      </ReactFlow>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    background: "#222",
  },
};