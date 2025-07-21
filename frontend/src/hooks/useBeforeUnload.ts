import { useEffect } from 'react';
import type { Node, Edge } from 'reactflow';

interface UseBeforeUnloadProps {
  shouldBlockSave: boolean;
  adventureTitle: string;
  nodes: Node[];
  edges: Edge[];
}

export const useBeforeUnload = ({
  shouldBlockSave,
  adventureTitle,
  nodes,
  edges,
}: UseBeforeUnloadProps) => {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlockSave && (adventureTitle || nodes.length > 0 || edges.length > 0)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [adventureTitle, nodes, edges, shouldBlockSave]);
};