import { useState, useCallback } from 'react';
import axios from 'axios';
import type { Node, Edge } from 'reactflow';
import type { AdventureCreate, NodeData as SharedNodeData, EdgeData as SharedEdgeData, ProblemBase } from '../components/shared/types';
import { createAdventure } from '../api/adventure';
import { getStoredToken, isTokenExpired } from '../utils/authHelpers';

interface UseAdventureSaveProps {
  nodes: Node[];
  edges: Edge[];
  validateGraph: (nodes: Node[], edges: Edge[]) => string | null;
  clearSavedData: () => void;
  setShouldBlockSave: (value: boolean) => void;

  showError: (msg: string, timeoutMs?: number) => void;
  showSuccess: (msg: string) => void;
  showTokenExpiredMessage: () => void;
}

export const useAdventureSave = ({ 
  nodes, 
  edges, 
  validateGraph, 
  clearSavedData, 
  setShouldBlockSave 
}: UseAdventureSaveProps) => {
  const [message, setMessage] = useState("");
  const [showTokenExpired, setShowTokenExpired] = useState(false);

  const handleSaveAdventure = useCallback(async (
    adventureTitle: string, 
    adventureDescription: string
  ) => {
    const token = getStoredToken();
    
    if (!token || isTokenExpired(token)) {
      setShowTokenExpired(true);
      return;
    }
    
    if (!adventureTitle.trim()) {
      setMessage("Adventure title is required");
      return;
    }

    if (nodes.length === 0) {
      setMessage("Add at least one problem to the adventure");
      return;
    }

    const graphError = validateGraph(nodes, edges);
    if (graphError) {
      setMessage(graphError);
      return;
    }

    try {
      const payload: AdventureCreate = {
        name: adventureTitle,
        description: adventureDescription,
        problems: nodes.map((n) => n.data as ProblemBase),
        graph_data: {
          nodes: nodes.map<SharedNodeData>((n) => ({
            id: n.id,
            position: n.position,
            data: n.data as ProblemBase,
            type: n.type,
          })),
          edges: edges.map<SharedEdgeData>((e) => ({
            id: e.id!,
            source: e.source,
            target: e.target,
            data: { condition: e.data.condition },
            type: e.type,
          })),
        },
        is_public: false,
        request_public: false,
      };
    
      await createAdventure(payload);

      setMessage("Adventure created successfully!");
      setShouldBlockSave(true);
      clearSavedData();
      
      setTimeout(() => {
        setMessage("");
      }, 500);

    } catch (error) {
      let errorMessage = "Something went wrong. Try again later.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        if (error.response) {
          errorMessage = error.response.data?.detail || error.message;
        } else if (error.request) {
          errorMessage = "No response received from server";
        } else {
          errorMessage = error.message;
        }
      }

      setMessage(errorMessage);
      console.error("Error creating adventure:", error);
    }
  }, [nodes, edges, validateGraph, clearSavedData, setShouldBlockSave]);

  const clearMessage = useCallback(() => {
    setMessage("");
  }, []);

  const clearMessages = useCallback(() => {
    setMessage("");
    setShowTokenExpired(false);
  }, []);

  return {
    message,
    showTokenExpired,
    handleSaveAdventure,
    clearMessage,
    clearMessages,
    setShowTokenExpired,
  };
};