import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Node, Edge } from "reactflow";
import type { ProblemData, DetailedAdventure, AdventureAttempt, GuestAttempt } from "../components/shared/types";
import { isTokenExpired } from "../utils/authHelpers";
import { getAdventureAttempt, getAdventureByAccessCode, submitGuestCode, submitUserCode, updateProgress } from "../api/adventure";
import type { AxiosError } from "axios";

interface UseAttemptAdventureReturn {
  adventure: DetailedAdventure | null;
  attempt: AdventureAttempt | GuestAttempt | null;
  nodes: Node<ProblemData>[];
  edges: Edge[];
  code: string;
  loading: boolean;
  error: string | null;
  output: string;
  submissionStatus: 'incorrect' | 'correct' | 'info' | null;
  tokenExpired: boolean;
  
  setCode: (code: string) => void;
  handleSubmit: (code: string, language: string) => Promise<void>;
  
  currentNode: () => Node<ProblemData> | null;
  isGuestAttempt: (attempt: AdventureAttempt | GuestAttempt) => attempt is GuestAttempt;
}

export const useAttemptAdventure = (accessCode: string | undefined): UseAttemptAdventureReturn => {
  const navigate = useNavigate();
  
  const [adventure, setAdventure] = useState<DetailedAdventure | null>(null);
  const [attempt, setAttempt] = useState<AdventureAttempt | GuestAttempt | null>(null);
  const [nodes, setNodes] = useState<Node<ProblemData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<'incorrect' | 'correct' | 'info' | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  
  const previousNodeId = useRef<string | null>(null);

  const isGuestAttempt = useCallback((attempt: AdventureAttempt | GuestAttempt): attempt is GuestAttempt => {
    return 'isGuest' in attempt && attempt.isGuest === true;
  }, []);

  const currentNode = useCallback(() => {
    if (!nodes.length || !attempt) return null;
    return nodes.find((n) => n.id === attempt.current_node_id) || null;
  }, [nodes, attempt]);

  useEffect(() => {
    if (!accessCode) return;
    
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");
    
    if (!token && userName !== "guest") {
      localStorage.setItem("userName", "guest");
      return;
    }

    if (token && userName !== "guest" && isTokenExpired(token)) {
      setTokenExpired(true);
      setLoading(false);
      return;
    }

    const headers: Record<string, string> = {};
    if (token && userName !== "guest") {
      headers.Authorization = `Bearer ${token}`;
    }
  
    getAdventureByAccessCode(accessCode, headers)
      .then((adventure) => {
        setAdventure(adventure);
        setError(null);
        
        const problemsMap = new Map<string, ProblemData>();
        if (adventure.problems) {
          adventure.problems.forEach(problem => {
            problemsMap.set(problem.id, problem);
          });
        }
    
        const newNodes = adventure.graph_data.nodes.map((n) => {
          const problemData = problemsMap.get(n.id) || n.data;
          return {
            id: n.id,
            type: n.type || "problemNode",
            position: n.position,
            data: {
              ...problemData,
              label: problemData.title
            }
          };
        });
        
        setNodes(newNodes);
        setEdges(
          adventure.graph_data.edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            data: e.data,
            type: e.type || "custom",
          }))
        );
      })
      .catch((err) => {
        console.error("Failed to fetch adventure:", err);
        setAdventure(null);
        setLoading(false);
        
        if (err.response?.status === 404) {
          setError("Adventure not found. Please check the access code and try again.");
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          setError("Access denied. Please check your permissions.");
        } else {
          setError("Failed to load adventure. Please try again later.");
        }
      });
  }, [accessCode, navigate]);


  useEffect(() => {
    if (!adventure?.id) return;
    
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");
    
    if (userName === "guest") {
      const guestAttempt: GuestAttempt = {
        id: `guest-${adventure.id}-${Date.now()}`,
        adventure_id: adventure.id,
        current_node_id: adventure.start_node_id,
        completed: false,
        path_taken: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isGuest: true
      };
      setAttempt(guestAttempt);
      setLoading(false);
      return;
    }
  
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
  
    getAdventureAttempt(adventure.id, token)
      .then((attempt: AdventureAttempt) => {
        setAttempt(attempt);
        setLoading(false);
      })
      .catch((err: AxiosError) => {
        console.error("Failed to get/start adventure attempt:", err);
        setLoading(false);
        setError("Failed to start adventure attempt. Please try again.");
      });
  }, [adventure?.id, navigate, adventure?.start_node_id]);

  useEffect(() => {
    if (!attempt || !nodes.length) return;
    
    const currentNodeId = attempt.current_node_id;
    
    if (currentNodeId && (previousNodeId.current !== currentNodeId || previousNodeId.current === null)) {
      console.log('Loading code for node:', currentNodeId);
      
      const nodeEntries = attempt.path_taken
        ?.filter(entry => entry.node_id === currentNodeId && entry.code) || [];

      if (nodeEntries.length > 0) {
  
        const codeToLoad = nodeEntries[nodeEntries.length - 1].code || "";
        console.log('Loading previous submission:', codeToLoad);
        setCode(codeToLoad);
      } else {
       
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (currentNode && currentNode.data.code_snippet) {
          console.log('Loading fresh code snippet:', currentNode.data.code_snippet);
          setCode(currentNode.data.code_snippet);
        } else {
          console.log('No code snippet found, clearing code');
          setCode("");
        }
      }
      
      previousNodeId.current = currentNodeId;
    }
  }, [attempt, nodes]);

  const handleSubmit = useCallback(async (code: string, language: string) => {
    const token = localStorage.getItem("token");
    const userName = localStorage.getItem("userName");

    if (token && isTokenExpired(token)) {
        setTokenExpired(true)
        return
    }
  
    if (!attempt || !currentNode()) return;
    const node = currentNode()!;
  
    if (userName === "guest" || isGuestAttempt(attempt)) {
      try {
        const guestAttempt = attempt as GuestAttempt;
        
        const form = new URLSearchParams();
        form.append("adventure_id", guestAttempt.adventure_id.toString());
        form.append("node_id", node.id);
        form.append("code", code);
        form.append("language", language);
        form.append("guest_mode", "true");
        
        const response = await submitGuestCode(form);
        const isCorrect = response.is_correct;
        setOutput(response.message);
        
        if (isCorrect) {
          setSubmissionStatus('correct');
        } else {
          setSubmissionStatus('incorrect');
        }

        const outcome = isCorrect ? "correct" : "incorrect";
        const isEndNode = node.id === adventure?.end_node_id;
        const adventureCompleted = isEndNode && isCorrect;

        const outgoingEdges = edges.filter(e => e.source === node.id);
        let nextEdge = null;
        let nextNodeId = null;

        if (adventureCompleted) {
          nextNodeId = node.id;
          setOutput("Congratulations! You've completed the adventure! (Guest mode - progress not saved)");
          setAttempt({ ...guestAttempt, completed: true });
        } else {
          if (isCorrect) {
            nextEdge = outgoingEdges.find(e => e.data?.condition === 'correct');
          } else {
            nextEdge = outgoingEdges.find(e => e.data?.condition === 'incorrect');
          }
          if (!nextEdge) {
            nextEdge = outgoingEdges.find(
              e => e.data?.condition === 'default' || e.data?.condition === 'always'
            );
          }
          
          if (nextEdge) {
            nextNodeId = nextEdge.target;
          } else if (isEndNode) {
            nextNodeId = node.id;
          }
        }

        if (nextNodeId && !adventureCompleted) {
          const updatedAttempt: GuestAttempt = {
            ...guestAttempt,
            current_node_id: nextNodeId,
            path_taken: [
              ...(guestAttempt.path_taken || []),
              { node_id: node.id, code: code, outcome: outcome }
            ],
            updated_at: new Date().toISOString()
          };
          setAttempt(updatedAttempt);
        }
        
      } catch (err) {
        console.error("Guest submission failed:", err);
        setOutput("Failed to validate solution. Please try again.");
        setSubmissionStatus('incorrect');
      }
      
      return;
    }

    if (!token) {
      setError("Authentication required");
      return;
    }
    
    const authenticatedAttempt = attempt as AdventureAttempt;
    const form = new URLSearchParams();
    form.append("attempt_id", authenticatedAttempt.id.toString());
    form.append("node_id", node.id);
    form.append("code", code);
    form.append("language", language);

    try {
      const run = await submitUserCode(form, token);
      const isCorrect = run.is_correct;
      setOutput(run.message);
  
      if (isCorrect) {
        setSubmissionStatus('correct');
      } else {
        setSubmissionStatus('incorrect');
      }
  
      const outcome = isCorrect ? "correct" : "incorrect";
      const isEndNode = node.id === adventure?.end_node_id;
      const adventureCompleted = isEndNode && isCorrect;
  
      const outgoingEdges = edges.filter(e => e.source === node.id);
      let nextEdge = null;
      let nextNodeId = null;
  
      if (adventureCompleted) {
        nextNodeId = node.id;
        setOutput("Congratulations! You've completed the adventure!");
      } else {
        if (isCorrect) {
          nextEdge = outgoingEdges.find(e => e.data?.condition === 'correct');
        } else {
          nextEdge = outgoingEdges.find(e => e.data?.condition === 'incorrect');
        }
        
        if (nextEdge) {
          nextNodeId = nextEdge.target;
        } else if (isEndNode) {
          nextNodeId = node.id;
        }
      }
  
      if (nextNodeId) {
        const updatedProgress = await updateProgress(
          authenticatedAttempt.id, 
          nextNodeId, 
          outcome, 
          code, 
          adventureCompleted, 
          token
        );
        
        setAttempt(updatedProgress);
      }
  
    } catch (err) {
      console.error("Submission failed:", err);
      setOutput("Failed to submit solution. Please try again.");
    }
  }, [attempt, currentNode, adventure?.end_node_id, edges, isGuestAttempt]);

  return {
    adventure,
    attempt,
    nodes,
    edges,
    code,
    loading,
    error,
    output,
    submissionStatus,
    tokenExpired,
    
    setCode,
    handleSubmit,
    
    currentNode,
    isGuestAttempt,
  };
};