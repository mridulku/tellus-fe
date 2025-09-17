import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import dagre from 'dagre';

/** 
 * A custom node to display an entity with a name/title and attributes in a box
 */
function EntityNode({ data }) {
  const { title, attributes } = data;

  return (
    <div
      style={{
        background: '#f7f7ff',
        border: '1px solid #333',
        borderRadius: '5px',
        padding: '10px',
        minWidth: '180px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '5px',
          borderBottom: '1px solid #999',
          paddingBottom: '5px',
        }}
      >
        {title}
      </div>
      {attributes.map((attr, idx) => (
        <div style={{ fontSize: '12px', margin: '2px 0' }} key={idx}>
          {attr}
        </div>
      ))}
    </div>
  );
}

/**
 * A small node used as a legend, e.g., explaining line styles, PK vs FK, etc.
 */
function LegendNode() {
  return (
    <div
      style={{
        background: '#fff3e6',
        border: '1px dashed #666',
        borderRadius: '8px',
        padding: '10px',
        width: '180px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h4 style={{ marginTop: 0, textAlign: 'center' }}>Legend</h4>
      <ul style={{ paddingInlineStart: '20px', margin: 0 }}>
        <li><strong>(PK)</strong>: Primary Key</li>
        <li><strong>(FK)</strong>: Foreign Key</li>
        <li><strong>1 - M</strong>: One-to-many relationship</li>
        <li><em>Arrows</em> = direction from parent (PK) to child (FK)</li>
      </ul>
    </div>
  );
}

/** 
 * Node types: We can define a custom node for "entity" and one for "legend."
 */
const nodeTypes = {
  entity: EntityNode,
  legend: LegendNode,
};

/** 
 * We'll define the Dagre layout function so we can arrange nodes automatically.
 */
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 200;
const nodeHeight = 140;
const nodeMarginX = 40;
const nodeMarginY = 40;

/**
 * layoutElements: 
 * Takes your array of nodes/edges, runs Dagre to compute a layered layout,
 * and returns new node positions so edges won't cross randomly.
 */
function layoutElements(nodes, edges, direction = 'LR') {
  // direction can be 'TB' (top-bottom) or 'LR' (left-right), etc.
  dagreGraph.setGraph({ rankdir: direction, ranksep: 150, edgesep: 100, nodesep: 80 });

  // 1) Add each node to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // 2) Add each edge to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // 3) Run the dagre layout
  dagre.layout(dagreGraph);

  // 4) Update node positions
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // We move the node's position slightly so edges look OK
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2 + nodeMarginX,
      y: nodeWithPosition.y - nodeHeight / 2 + nodeMarginY,
    };
    return node;
  });
}

export default function HospitalERDiagram() {
  /** 1) Define your nodes with 'type: entity' or 'legend' */
  const initialNodes = useMemo(() => [
    {
      id: 'legend',
      type: 'legend',
      data: {},
      position: { x: 0, y: 0 }, // positions are placeholders (dagre will override)
    },
    // DEPARTMENT
    {
      id: 'department',
      type: 'entity',
      data: {
        title: 'DEPARTMENT',
        attributes: [
          'dept_id (PK)',
          'dept_name',
          'location',
          'head_of_dept',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // WARD
    {
      id: 'ward',
      type: 'entity',
      data: {
        title: 'WARD',
        attributes: [
          'ward_id (PK)',
          'ward_name',
          'capacity',
          'dept_id (FK)',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // BED
    {
      id: 'bed',
      type: 'entity',
      data: {
        title: 'BED',
        attributes: [
          'bed_id (PK)',
          'ward_id (FK)',
          'current_status',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // DOCTOR
    {
      id: 'doctor',
      type: 'entity',
      data: {
        title: 'DOCTOR',
        attributes: [
          'doctor_id (PK)',
          'name',
          'specialty',
          'phone',
          'dept_id (FK)',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // NURSE
    {
      id: 'nurse',
      type: 'entity',
      data: {
        title: 'NURSE',
        attributes: [
          'nurse_id (PK)',
          'name',
          'shift',
          'phone',
          'dept_id (FK)',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // STAFF_ASSIGNMENT
    {
      id: 'staff_assignment',
      type: 'entity',
      data: {
        title: 'STAFF_ASSIGNMENT',
        attributes: [
          'staff_assign_id (PK)',
          'nurse_id (FK)',
          'ward_id (FK)',
          'start_date',
          'end_date',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // PATIENT
    {
      id: 'patient',
      type: 'entity',
      data: {
        title: 'PATIENT',
        attributes: [
          'patient_id (PK)',
          'name',
          'dob',
          'gender',
          'address',
          'phone',
          'insurance_info',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // APPOINTMENT
    {
      id: 'appointment',
      type: 'entity',
      data: {
        title: 'APPOINTMENT',
        attributes: [
          'appt_id (PK)',
          'patient_id (FK)',
          'doctor_id (FK)',
          'appt_date',
          'appt_time',
          'reason',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // MEDICAL_RECORD
    {
      id: 'medical_record',
      type: 'entity',
      data: {
        title: 'MEDICAL_RECORD',
        attributes: [
          'mr_id (PK)',
          'patient_id (FK)',
          'diagnosis',
          'prescribed_medication',
          'treatment_plan',
        ],
      },
      position: { x: 0, y: 0 },
    },
    // BILLING
    {
      id: 'billing',
      type: 'entity',
      data: {
        title: 'BILLING',
        attributes: [
          'bill_id (PK)',
          'patient_id (FK)',
          'total_amount',
          'payment_status',
          'date_issued',
        ],
      },
      position: { x: 0, y: 0 },
    },
  ], []);

  /** 2) Define edges for your relationships. We'll label them "1 - M". */
  const initialEdges = useMemo(() => [
    // Department -> Ward
    {
      id: 'dept-ward',
      source: 'department',
      target: 'ward',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Ward -> Bed
    {
      id: 'ward-bed',
      source: 'ward',
      target: 'bed',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Department -> Doctor
    {
      id: 'dept-doctor',
      source: 'department',
      target: 'doctor',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Department -> Nurse
    {
      id: 'dept-nurse',
      source: 'department',
      target: 'nurse',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Ward -> StaffAssignment
    {
      id: 'ward-staffassign',
      source: 'ward',
      target: 'staff_assignment',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Nurse -> StaffAssignment
    {
      id: 'nurse-staffassign',
      source: 'nurse',
      target: 'staff_assignment',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Patient -> Appointment
    {
      id: 'patient-appointment',
      source: 'patient',
      target: 'appointment',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Doctor -> Appointment
    {
      id: 'doctor-appointment',
      source: 'doctor',
      target: 'appointment',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Patient -> MedicalRecord
    {
      id: 'patient-mr',
      source: 'patient',
      target: 'medical_record',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
    // Patient -> Billing
    {
      id: 'patient-billing',
      source: 'patient',
      target: 'billing',
      label: '1 - M',
      markerEnd: { type: MarkerType.ArrowClosed },
    },
  ], []);

  /** 3) We'll store nodes/edges in React Flow state, then run layout. */
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  /** 4) We want to run Dagre layout once on mount, or any time. */
  React.useEffect(() => {
    const layouted = layoutElements([...nodes], [...edges], 'LR');
    setNodes(layouted);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 5) optional: onInit, fitView, etc. */
  const onInit = useCallback((instance) => {
    instance.fitView();
  }, []);

  return (
    <div style={{ width: '100%', height: '900px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={onInit}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnScroll
      >
        <MiniMap />
        <Controls />
        <Background color="#000" gap={16} />
      </ReactFlow>
    </div>
  );
}