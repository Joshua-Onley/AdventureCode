import { useState } from "react";
import { Position, type Node } from "reactflow";
import type { ProblemBase } from "../components/shared/types";

export const useProblemForm = () => {
  const [showProblemForm, setShowProblemForm] = useState(false);
  const [newProblem, setNewProblem] = useState<ProblemBase>({
    title: "",
    description: "",
    language: "python",
    code_snippet: "",
    expected_output: "",
    difficulty: 3,
  });

  const createNewNode = (nodes: Node[], problem: ProblemBase) => {
    const problemId = `node-${Date.now()}`;
    
    return {
      id: problemId,
      type: "problemNode",
      position: { 
        x: 100 + nodes.length * 100, 
        y: 100 + nodes.length * 50 
      },
      data: {
        ...problem,
        id: problemId,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    } as Node;
  };

  const resetForm = () => {
    setNewProblem({
      title: "",
      description: "",
      language: "python",
      code_snippet: "",
      expected_output: "",
      difficulty: 3,
    });
    setShowProblemForm(false);
  };

  return {
    showProblemForm,
    setShowProblemForm,
    newProblem,
    setNewProblem,
    createNewNode,
    resetForm
  };
};