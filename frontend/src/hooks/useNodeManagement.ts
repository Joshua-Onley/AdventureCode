import { useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import type { ProblemData, ProblemBase } from '../components/shared/types';

interface UseNodeManagementProps {
  nodes: Node[];
  edges: Edge[];
  selectedNode: Node | null;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNode: (node: Node | null) => void;
  createNewNode: (nodes: Node[], problem: ProblemBase) => Node;
  resetProblemForm: () => void;
  setSelectedEdge: (edge: Edge | null) => void;
  setShowProblemForm: (show: boolean) => void;
}

export const useNodeManagement = ({
  nodes,
  edges,
  selectedNode,
  setNodes,
  setEdges,
  setSelectedNode,
  createNewNode,
  resetProblemForm,
  setSelectedEdge,
  setShowProblemForm,
}: UseNodeManagementProps) => {
  const handleAddProblemToCanvas = useCallback((newProblem: ProblemBase) => {
    if (!newProblem.title.trim() || !newProblem.code_snippet.trim()) {
      return { success: false, message: "Title and code snippet are required" };
    }

    const newNode = createNewNode(nodes, newProblem);
    setNodes([...nodes, newNode]);
    resetProblemForm();
    setSelectedNode(null);
    setSelectedEdge(null);
    setShowProblemForm(false);
    return { success: true, message: "Problem added to canvas successfully!" };
  }, [nodes, createNewNode, setNodes, resetProblemForm, setSelectedNode, setSelectedEdge, setShowProblemForm]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<ProblemData>) => {
    setNodes(nodes.map(node =>
      node.id === nodeId ? { 
        ...node, 
        data: { 
          ...node.data, 
          ...data,
          label: data.title || node.data.title || node.data.label
        } 
      } : node
    ));

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { 
          ...selectedNode.data, 
          ...data,
          label: data.title || selectedNode.data.title || selectedNode.data.label
        }
      });
    }
  }, [nodes, selectedNode, setNodes, setSelectedNode]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [edges, nodes, selectedNode, setEdges, setNodes, setSelectedNode]);

  return {
    handleAddProblemToCanvas,
    updateNodeData,
    handleDeleteNode,
  };
};