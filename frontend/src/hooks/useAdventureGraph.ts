import { useState, useCallback } from "react";
import {
    useNodesState,
    useEdgesState,
    addEdge,
    type Node,
    type Edge,
    type Connection
} from "reactflow";

export const useAdventureGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: "custom",
        data: { condition: "correct" }, 
        animated: false,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setSelectedEdge(newEdge as Edge);
    },
    [setEdges]
  );

  const validateGraph = (nodes: Node[], edges: Edge[]) => {

    // every problem node must have all fields completed 
    for (const node of nodes) {
      if (!node.data.title || !node.data.description || !node.data.language || !node.data.code_snippet || !node.data.expected_output ) {
        return `One or more problem nodes are missing information - all fields must be completed for each node`
      }
    }

    // an adventure has to have at least 2 problems otherwise the single problem creation page is more appropriate
    if (nodes.length < 2) {
      return "Adventure must have at least 2 problems. Use the single problem creation for individual problems.";
    }

    const edgesByTarget = new Map<string, Edge[]>();
    const edgesBySource = new Map<string, Edge[]>();
    const nodeMap = new Map<string, Node>(nodes.map(node => [node.id, node]));

    // Check for missing nodes in edges
    for (const edge of edges) {
      if (!nodeMap.has(edge.source)) {
        return `Edge references missing source node: ${edge.source}`;
      }
      if (!nodeMap.has(edge.target)) {
        return `Edge references missing target node: ${edge.target}`;
      }

      const condition = edge.data?.condition;
      if (condition !== "correct" && condition !== "incorrect") {
        return `Invalid edge condition "${condition}". Only "correct" and "incorrect" edges are allowed.`;
      }

      // edge maps
      if (!edgesByTarget.has(edge.target)) edgesByTarget.set(edge.target, []);
      edgesByTarget.get(edge.target)!.push(edge);
      
      if (!edgesBySource.has(edge.source)) edgesBySource.set(edge.source, []);
      edgesBySource.get(edge.source)!.push(edge);
    }

    // Each adventure must have exactly one starting node and one ending node
    const startingNodes = nodes.filter(node => 
      !edgesByTarget.has(node.id) || edgesByTarget.get(node.id)!.length === 0
    );
    
    if (startingNodes.length === 0) {
      return "Adventure must have a starting problem (with no incoming connections)";
    }
    
    if (startingNodes.length > 1) {
      return "Adventure can only have one starting problem. Currently has: " + 
             startingNodes.map(n => n.data.title).join(", ");
    }
    
    const endingNodes = nodes.filter(node => 
        !edgesBySource.has(node.id) || edgesBySource.get(node.id)!.length === 0
      );
      
      if (endingNodes.length === 0) {
        return "Adventure must have an ending problem (with no outgoing connections)";
      }
      
      if (endingNodes.length > 1) {
        return `Adventure can only have one ending problem. Currently has ${endingNodes.length}: ` + endingNodes.map(n => n.data.title).join(", ");
      }
    
    // Each problem node must be reachable
    const startNode = startingNodes[0];
    const visited = new Set<string>();
    const stack = [startNode.id];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      visited.add(currentId);
      
      const outgoing = edgesBySource.get(currentId) || [];
      for (const edge of outgoing) {
        if (!visited.has(edge.target)) {
          stack.push(edge.target);
        }
      }
    }
    
    if (visited.size !== nodes.length) {
      const unreachable = nodes.filter(n => !visited.has(n.id));
      return `These problems are unreachable: ${unreachable.map(n => n.data.title).join(", ")}`;
    }
    
    // Any node that is not an ending node must have incoming edges (except start node)
    const middleNodes = nodes.filter(node => 
      node.id !== startNode.id && !endingNodes.some(end => end.id === node.id)
    );
    
    const nodesWithoutIncoming = middleNodes.filter(node => {
      const hasIncoming = edgesByTarget.has(node.id) && edgesByTarget.get(node.id)!.length > 0;
      return !hasIncoming;
    });
    
    if (nodesWithoutIncoming.length > 0) {
      return `These problems must have incoming connections: ${nodesWithoutIncoming.map(n => n.data.title).join(", ")}`;
    }
    
    // Edge condition validation
    const edgeConditionErrors: string[] = [];
  
    // Check start node and middle nodes for required correct edges
    const nonEndingNodes = nodes.filter(node => 
      !endingNodes.some(end => end.id === node.id)
    );
    
    nonEndingNodes.forEach(node => {
      const outgoingEdges = edgesBySource.get(node.id) || [];
      const correctEdges = outgoingEdges.filter(e => e.data?.condition === "correct");
      const incorrectEdges = outgoingEdges.filter(e => e.data?.condition === "incorrect");
      
      // Every non-ending node (start + middle) must have at least one correct edge
      if (correctEdges.length === 0) {
        edgeConditionErrors.push(
          `"${node.data.title}" must have at least one 'correct' outgoing edge`
        );
      }
      
      // No node should have multiple outgoing edges of the same type
      if (correctEdges.length > 1) {
        edgeConditionErrors.push(
          `"${node.data.title}" has multiple 'correct' outgoing edges (only one allowed)`
        );
      }
      
      if (incorrectEdges.length > 1) {
        edgeConditionErrors.push(
          `"${node.data.title}" has multiple 'incorrect' outgoing edges (only one allowed)`
        );
      }
    });
    
    if (edgeConditionErrors.length > 0) {
      return edgeConditionErrors.join("\n");
    }
    
    // No node can connect to itself
    const selfReferencing = edges.filter(edge => edge.source === edge.target);
    if (selfReferencing.length > 0) {
      return `Problems cannot connect to themselves: ${
        selfReferencing.map(e => nodeMap.get(e.source)?.data.title).join(", ")
      }`;
    }
    
    // No duplicate edges 
    const edgeKeys = new Set<string>();
    const duplicateEdges = edges.filter(edge => {
      const key = `${edge.source}-${edge.target}-${edge.data?.condition}`;
      if (edgeKeys.has(key)) return true;
      edgeKeys.add(key);
      return false;
    });
    
    if (duplicateEdges.length > 0) {
      return `Duplicate connections found: ${
        duplicateEdges.map(e => 
          `${nodeMap.get(e.source)?.data.title} → ${nodeMap.get(e.target)?.data.title} (${e.data?.condition})`
        ).join(", ")
      }`;
    }

    return null; 
  };

  const deleteSelectedEdge = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  };

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
  };

  return {
    nodes,
    edges,
    selectedEdge,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    validateGraph,
    deleteSelectedEdge,
    setSelectedEdge,
    clearGraph
  };
};