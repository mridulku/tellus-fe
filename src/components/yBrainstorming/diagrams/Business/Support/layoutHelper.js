// layoutHelper.js
import dagre from "dagre";

export function getLayoutedElements(nodes, edges, direction = "TB") {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // rankdir=direction, plus bigger ranksep/nodesep to avoid overlap
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 200,  // vertical spacing between layers
    nodesep: 150,  // horizontal spacing between nodes
    edgesep: 100,  // spacing for edges
  });

  nodes.forEach((node) => {
    // approximate node width/height
    dagreGraph.setNode(node.id, { width: 320, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
}