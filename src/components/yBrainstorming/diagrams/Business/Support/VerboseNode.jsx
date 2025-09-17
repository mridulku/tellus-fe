// VerboseNode.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { Tooltip } from "@mui/material";

export default function VerboseNode({ data }) {
  const { label, details } = data;

  return (
    <Tooltip
      title={<div style={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>{details}</div>}
      arrow
      placement="right"
    >
      <div style={nodeStyle}>
        <Handle type="target" position={Position.Top} style={{ background: "#555" }} />
        <div style={{ fontWeight: "bold", marginBottom: 4, textAlign: "center" }}>{label}</div>
        <Handle type="source" position={Position.Bottom} style={{ background: "#555" }} />
      </div>
    </Tooltip>
  );
}

const nodeStyle = {
  width: 240,
  minHeight: 60,
  background: "#222",
  color: "#fff",
  border: "1px solid #555",
  borderRadius: 4,
  padding: 8,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};