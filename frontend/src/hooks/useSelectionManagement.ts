import { useCallback } from 'react';
import type { Node, Edge } from 'reactflow';

interface UseSelectionManagementProps {
  setSelectedNode: (node: Node | null) => void;
  setSelectedEdge: (edge: Edge | null) => void;
  setShowProblemForm: (show: boolean) => void;
}

export const useSelectionManagement = ({
  setSelectedNode,
  setSelectedEdge,
  setShowProblemForm,
}: UseSelectionManagementProps) => {
  
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setShowProblemForm(false);
  }, [setSelectedNode, setSelectedEdge, setShowProblemForm]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    setShowProblemForm(false);
  }, [setSelectedEdge, setSelectedNode, setShowProblemForm]);

  const clearSelection = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setSelectedNode, setSelectedEdge]);

  return {
    handleNodeClick,
    handleEdgeClick,
    clearSelection,
  };
};