import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  setShouldBlockSave,
  showError,
  showSuccess,
  showTokenExpiredMessage
}: UseAdventureSaveProps) => {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSaveAdventure = useCallback(async (
    adventureTitle: string,
    adventureDescription: string
  ) => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      showTokenExpiredMessage();
      return;
    }

    if (!adventureTitle.trim()) {
      showError("Adventure title is required");
      return;
    }

    if (nodes.length === 0) {
      showError("Add at least one problem to the adventure");
      return;
    }

    const graphError = validateGraph(nodes, edges);
    if (graphError) {
      showError(graphError);
      return;
    }

    setSaving(true);

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
      showSuccess("Adventure created successfully!");
      setShouldBlockSave(false);
      clearSavedData();
      navigate("/my-adventures");
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
      showError(errorMessage);
      console.error("Error creating adventure:", error);
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, validateGraph, clearSavedData, setShouldBlockSave, showError, showSuccess, showTokenExpiredMessage, navigate]);

  return {
    handleSaveAdventure,
    saving,
  };
};