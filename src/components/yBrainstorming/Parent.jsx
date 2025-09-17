/**
 * File: ProductLifecycleFlow.jsx
 * Description:
 *   An example parent component that uses ReactFlow to display
 *   multiple "lanes" (columns). Each lane has a few steps, each
 *   represented by your custom `VerboseNode`. Edges connect
 *   them top to bottom in that lane.
 *
 *   This is a simplified approach – positions are hard-coded
 *   so it looks like swimlanes. You can adjust or add lanes
 *   as needed.
 */

import React, { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// Import your custom node
import VerboseNode from "./diagrams/Business/Support/VerboseNode";

/** A small helper for X positions of each lane: lane 0 => x=0, lane 1 => x=400, etc. */
const laneX = (laneIndex) => laneIndex * 400;

export default function ProductLifecycleFlow() {
  // 1) Register the custom node type
  const nodeTypes = useMemo(() => ({ verboseNode: VerboseNode }), []);

  // 2) Set up initial nodes (each "lane" = one major stage in your user lifecycle)
  //    We'll do 3 lanes for demonstration: "Attract Users", "Convert & Onboard", "Monetization".
  //    Each lane has multiple steps, each a verboseNode with label + details.
  const initialNodes = useMemo(() => {
    const nodes = [];

    // LANE A: "Attract & Inform" (laneIndex = 0)
    const lane0Steps = [
      {
        id: "A1",
        label: "Ad Campaigns & Persona",
        details: `• Define your user personas.\n• Create targeted ad sets & measure clickthrough.\n• Elevator pitch is crucial here.`,
      },
      {
        id: "A2",
        label: "Landing Page & 10s Pitch",
        details: `• Design a quick, compelling hero message.\n• Possibly a short 10s video or bullet list.\n• CTA: “Sign Up / Start Free Trial”.`,
      },
      {
        id: "A3",
        label: "Leads Tracking",
        details: `• Capture leads or sign-ups.\n• Possibly an email form or partial user profile.\n• Automatic transitions to next lane => sign-in.`,
      },
    ];
    // We'll place each step at an increasing Y offset, x=0.
    lane0Steps.forEach((step, i) => {
      nodes.push({
        id: step.id,
        type: "verboseNode",
        position: { x: laneX(0), y: i * 200 },
        data: {
          label: step.label,
          details: step.details,
        },
      });
    });

    // LANE B: "Convert & Onboard" (laneIndex = 1 => x=400)
    const lane1Steps = [
      {
        id: "B1",
        label: "Signup Flow",
        details: `• Email/password or social sign-in.\n• Minimal friction, immediate feedback.\n• Possibly add user persona after sign-up.`,
      },
      {
        id: "B2",
        label: "Onboarding (30-45s)",
        details: `• Quick tutorial or guided steps.\n• Show sample adaptive plan or small interactive quiz.\n• Let user see immediate value within 1 min.`,
      },
      {
        id: "B3",
        label: "Initial Data & Preferences",
        details: `• Ask user about goals, exam type, or interest areas.\n• This helps personalize the next lane’s adaptive plan.`,
      },
    ];
    lane1Steps.forEach((step, i) => {
      nodes.push({
        id: step.id,
        type: "verboseNode",
        position: { x: laneX(1), y: i * 200 },
        data: {
          label: step.label,
          details: step.details,
        },
      });
    });

    // LANE C: "Monetization & Payment" (laneIndex = 2 => x=800)
    const lane2Steps = [
      {
        id: "C1",
        label: "Adaptive Plan Usage",
        details: `• User sees quizzes, reading steps.\n• Stage-based approach.\n• Keep track if user is engaged.`,
      },
      {
        id: "C2",
        label: "Paywall & Nudges",
        details: `• Show pay triggers after X free chapters or Y days.\n• Possibly a discount for early pay.\n• Payment integration.`,
      },
      {
        id: "C3",
        label: "Retention & Reactivation",
        details: `• If user drops off, send reactivation emails.\n• Possibly remind them of the leftover free stage or upcoming exam.\n• Consolidate user feedback & success stories.`,
      },
    ];
    lane2Steps.forEach((step, i) => {
      nodes.push({
        id: step.id,
        type: "verboseNode",
        position: { x: laneX(2), y: i * 200 },
        data: {
          label: step.label,
          details: step.details,
        },
      });
    });

    return nodes;
  }, []);

  // 3) Edges within each lane (top->down), no cross-lane edges
  const initialEdges = useMemo(() => {
    const edges = [
      // Lane A edges
      { id: "A1->A2", source: "A1", target: "A2" },
      { id: "A2->A3", source: "A2", target: "A3" },

      // Lane B edges
      { id: "B1->B2", source: "B1", target: "B2" },
      { id: "B2->B3", source: "B2", target: "B3" },

      // Lane C edges
      { id: "C1->C2", source: "C1", target: "C2" },
      { id: "C2->C3", source: "C2", target: "C3" },
    ];
    return edges;
  }, []);

  // ReactFlow requires state for nodes/edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // If user drags & connects nodes, we can handle that here. We'll just keep it minimal.
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

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
      >
        <MiniMap />
        <Controls />
        <Background color="#999" gap={16} />
      </ReactFlow>
    </div>
  );
}