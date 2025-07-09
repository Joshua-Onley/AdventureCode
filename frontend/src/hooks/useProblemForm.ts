import { useState } from "react";
import { Position, type Node } from "reactflow";
import { v4 as uuidv4 } from "uuid";
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
        const nodeId = uuidv4();                      
    
        return {
          id: nodeId,
          type: "problemNode",
          position: {
            x: 100 + nodes.length * 100,
            y: 100 + nodes.length * 50,
          },
          data: {
            ...problem,                              
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        } as Node & { data: ProblemBase };          
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