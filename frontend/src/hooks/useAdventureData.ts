import { useEffect, useCallback, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import type { ProblemData } from '../components/shared/types';

type AdventureDraft = {
  adventureTitle: string;
  adventureDescription: string;
  nodes: Node[];
  edges: Edge[];
  userId: string;
};

interface UseAdventureDataProps {
  isCheckingAuth: boolean;
  loadSavedData: () => AdventureDraft | null;
  clearSavedData: () => void;
  setAdventureTitle: (title: string) => void;
  setAdventureDescription: (description: string) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  clearGraph: () => void;
}

export const useAdventureData = ({
  isCheckingAuth,
  loadSavedData,
  clearSavedData,
  setAdventureTitle,
  setAdventureDescription,
  setNodes,
  setEdges,
  clearGraph,
}: UseAdventureDataProps) => {
  const hasLoadedInitialData = useRef(false);

  const resetAdventureState = useCallback(() => {
    setAdventureTitle("");
    setAdventureDescription("");
    setNodes([]);
    setEdges([]);
  }, [setAdventureTitle, setAdventureDescription, setNodes, setEdges]);

  useEffect(() => {
    
    if (isCheckingAuth || hasLoadedInitialData.current) return;
    
    const draft = loadSavedData();
    const currentUserId = localStorage.getItem('userId') || 'unknown';
    
    if (draft) {
      if (draft.userId === currentUserId) {
        setAdventureTitle(draft.adventureTitle);
        setAdventureDescription(draft.adventureDescription);
        setNodes(draft.nodes || []);
        setEdges(draft.edges || []);
      } else {
        clearSavedData();
        setAdventureTitle("");
        setAdventureDescription("");
        setNodes([]);
        setEdges([]);
      }
    } else {
      setAdventureTitle("");
      setAdventureDescription("");
      setNodes([]);
      setEdges([]);
    }
    
    hasLoadedInitialData.current = true;
  }, [isCheckingAuth, loadSavedData, clearSavedData, setAdventureTitle, setAdventureDescription, setNodes, setEdges]); 

  const startNewAdventure = useCallback(() => {
    setAdventureTitle("");
    setAdventureDescription("");
    clearGraph();
  }, [clearGraph, setAdventureTitle, setAdventureDescription]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<ProblemData>, nodes: Node[], setNodes: (nodes: Node[]) => void, selectedNode: Node | null, setSelectedNode: (node: Node | null) => void) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, ...data }
      });
    }
  }, []);

  return {
    resetAdventureState,
    startNewAdventure,
    updateNodeData,
  };
};