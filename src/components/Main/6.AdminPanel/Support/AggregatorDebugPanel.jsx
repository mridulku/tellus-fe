// src/components/AggregatorDebugPanel.jsx
import React from "react";
import { useSelector } from "react-redux";

export default function AggregatorDebugPanel() {
  const { status, error, timeMap, subchapterMap } = useSelector(
    (s) => s.aggregator
  );

  if (status === "loading")
    return <p style={{ color: "#fff" }}>Aggregator loading…</p>;

  if (status === "failed")
    return <p style={{ color: "red" }}>Aggregator error: {error}</p>;

  return (
    <pre
      style={{
        color: "#0f0",
        background: "#111",
        padding: 12,
        maxHeight: 360,
        overflow: "auto",
        fontSize: 12,
      }}
    >
{JSON.stringify({ timeMap, subchapterMap }, null, 2)}
    </pre>
  );
}