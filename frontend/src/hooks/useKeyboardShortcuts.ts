import { useEffect } from "react";
import type { Edge } from "reactflow";

export const useKeyboardShortcuts = (
  selectedEdge: Edge | null, 
  deleteSelectedEdge: () => void,
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedEdge) {
        deleteSelectedEdge();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedEdge, deleteSelectedEdge]);
};