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
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: "custom",
        data: { condition: "default" },
        animated: false,
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setSelectedEdge(newEdge as Edge);
    },
    [setEdges]
  );

  const validateGraph = (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return "Add at least one problem";
    const edgesByTarget = new Map<string, Edge[]>();
    const edgesBySource = new Map<string, Edge[]>();
    
    edges.forEach(edge => {
      if (!edgesByTarget.has(edge.target)) edgesByTarget.set(edge.target, []);
      edgesByTarget.get(edge.target)!.push(edge);
      
      if (!edgesBySource.has(edge.source)) edgesBySource.set(edge.source, []);
      edgesBySource.get(edge.source)!.push(edge);
    });
  
    const startingNodes = nodes.filter(node => 
      !edgesByTarget.has(node.id) || edgesByTarget.get(node.id)!.length === 0
    );
    
    const endingNodes = nodes.filter(node => 
      !edgesBySource.has(node.id) || edgesBySource.get(node.id)!.length === 0
    );
  
    if (startingNodes.length === 0) {
      return "Adventure must have a starting problem (with no incoming connections)";
    }
    
    if (startingNodes.length > 1) {
      return "Adventure can only have one starting problem. Currently has: " + 
             startingNodes.map(n => n.data.title).join(", ");
    }
    
    if (endingNodes.length === 0) {
      return "Adventure must have an ending problem (with no outgoing connections)";
    }
    
    if (endingNodes.length > 1) {
      return "Adventure can only have one ending problem. Currently has: " + 
             endingNodes.map(n => n.data.title).join(", ");
    }
    
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
    
    const middleNodes = nodes.filter(node => 
      node.id !== startNode.id && node.id !== endingNodes[0].id
    );
    
    const invalidNodes = middleNodes.filter(node => {
      const hasIncoming = edgesByTarget.has(node.id) && edgesByTarget.get(node.id)!.length > 0;
      const hasOutgoing = edgesBySource.has(node.id) && edgesBySource.get(node.id)!.length > 0;
      return !hasIncoming || !hasOutgoing;
    });
    
    if (invalidNodes.length > 0) {
      return `These problems must have both incoming and outgoing connections: ${invalidNodes.map(n => n.data.title).join(", ")}`;
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