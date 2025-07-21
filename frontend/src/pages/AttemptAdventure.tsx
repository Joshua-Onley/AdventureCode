import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  ConnectionMode,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemNode from "../components/adventure/ProblemNode";
import CustomEdge from "../components/adventure/CustomEdge";
import EdgeLegend from "../components/adventure/EdgeLegend";
import CodeEditor from "../components/shared/CodeEditor";
import type { ProblemData, GraphNode, GraphEdge, AdventureAttempt } from "../components/shared/types";

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

interface Adventure {
  id: number;
  name: string;
  access_code: string;
  description?: string;
  graph_data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  start_node_id: string;
  end_node_id: string;
  problems: ProblemData[];
}

const nodeTypes = {
  problemNode: ProblemNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const AttemptAdventure: React.FC = () => {
  const { code: accessCode } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [attempt, setAttempt] = useState<AdventureAttempt | null>(null);
  const [nodes, setNodes] = useState<Node<ProblemData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [output, setOutput] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<'incorrect' | 'correct' | 'info'| null>(null);
  
  
  const previousNodeId = useRef<string | null>(null);

  useEffect(() => {
    if (!accessCode) return;
    const token = localStorage.getItem("token");
  
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
  
    axios.get<Adventure>(
      `${FASTAPI_BACKEND_URL}/api/adventures/access/${accessCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => {
        setAdventure(res.data);
        setError(null); 
        
        const problemsMap = new Map<string, ProblemData>();
        if (res.data.problems) {
          res.data.problems.forEach(problem => {
            problemsMap.set(problem.id, problem);
          });
        }
  
        const newNodes = res.data.graph_data.nodes.map((n) => {
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
          res.data.graph_data.edges.map((e) => ({
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
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
  
    axios
      .get<AdventureAttempt>(`${FASTAPI_BACKEND_URL}/api/adventures/${adventure.id}/attempt`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        const attempt = response.data;
        setAttempt(attempt);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to get/start adventure attempt:", err);
        setLoading(false);
        setError("Failed to start adventure attempt. Please try again.");
      });
  }, [adventure?.id, navigate]);
  

  useEffect(() => {
    if (!attempt || !nodes.length) return;
    
    const currentNodeId = attempt.current_node_id;
    
    if (currentNodeId && (previousNodeId.current !== currentNodeId || previousNodeId.current === null)) {
      const nodeEntries = attempt.path_taken
        ?.filter(entry => entry.node_id === currentNodeId && entry.code) || [];

      if (nodeEntries.length > 0) {
        setCode(nodeEntries[nodeEntries.length - 1].code || "");
      } else {
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (currentNode && currentNode.data.code_snippet) {
          setCode(currentNode.data.code_snippet);
        }
      }
      
      previousNodeId.current = currentNodeId;
    }
  }, [attempt, nodes]);

  const currentNode = useCallback(() => {
    if (!nodes.length || !attempt) return null;
    return nodes.find((n) => n.id === attempt.current_node_id) || null;
  }, [nodes, attempt]);

  const handleSubmit = async (code: string, language: string) => {
    if (!attempt || !currentNode()) return;
    const node = currentNode()!;
    const token = localStorage.getItem("token")!;
  
    const form = new URLSearchParams();
    form.append("attempt_id", attempt.id.toString());
    form.append("node_id", node.id);
    form.append("code", code);
    form.append("language", language);
    
    try {
      const run = await axios.post(
        `${FASTAPI_BACKEND_URL}/api/adventure_submissions`,
        form,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const isCorrect = run.data.is_correct;
      setOutput(run.data.message);

      if (isCorrect) {
        setSubmissionStatus('correct');
      } else {
        setSubmissionStatus('incorrect')
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

      if (nextNodeId) {
        const progress = await axios.patch<AdventureAttempt>(
          `${FASTAPI_BACKEND_URL}/api/adventures/attempts/${attempt.id}/progress`,
          {
            current_node_id: nextNodeId,
            outcome: outcome,
            code: code,
            completed: adventureCompleted  
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      
        setAttempt(progress.data);
      
        
        if (isCorrect && nextNodeId !== node.id && !adventureCompleted) {
          const nextNode = nodes.find(n => n.id === nextNodeId);
          if (nextNode && nextNode.data.code_snippet) {
            setCode(nextNode.data.code_snippet);
          }
        }
      }
  
    } catch (err) {
      console.error("Submission failed:", err);
      setOutput("Failed to submit solution. Please try again.");
    }
  };

  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md text-center">
          <strong>Error:</strong>
          <div className="mt-2">{error}</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>

        </div>
      </div>
    );
  }

  if (loading || !adventure || !attempt) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const node = currentNode();
  if (!node) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Node not found</div>
      </div>
    );
  }

  const currentId = attempt?.current_node_id;

  return (
    <div className="flex flex-col h-screen">
      
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{adventure.name}</h1>
          {adventure.description && (
            <p className="text-gray-300 mt-1">{adventure.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>

      {attempt.completed && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Congratulations!</strong>
          <div className="mt-2">You've completed the adventure!</div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
         
          <Panel defaultSize={67} minSize={30} maxSize={80}>
            <div className="h-full">
              <ReactFlow
                nodes={nodes.map((n) => ({
                  ...n,
                  data: {
                    ...n.data,
                    isCurrent: n.id === currentId,
                  },
                }))}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                connectionLineType={ConnectionLineType.Bezier}
                connectionMode={ConnectionMode.Loose}
                nodesDraggable={false}
                nodesConnectable={false}
                connectionRadius={30}
              >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
              </ReactFlow>
            </div>
          </Panel>

          
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />

          
          <Panel defaultSize={33} minSize={20} maxSize={70}>
            <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">{node.data.title}</h2>
                  <p className="text-gray-700 mb-4">{node.data.description}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Your Code ({node.data.language}):
                  </label>
                  <CodeEditor
                    
                    placeholder="Write your code here..."
                    value={code}
                    onChange={(value) => setCode(value)}
                    language="text"
                    height="100px"
                    theme="vs-light"
                  />
                </div>
                

                <button 
                  onClick={() => handleSubmit(code, node.data.language)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                >
                  Run & Submit
                </button>

                {output && (
                    <div className={`p-4 rounded-lg mb-4 ${
                      submissionStatus === 'correct'
                      ? "bg-green-100 border border-green-400 text-green-700"
                      : submissionStatus === 'incorrect'
                      ? "bg-red-100 border border-red-400 text-red-700"
                      : "bg-blue-100 border border-blue-400 text-blue-700"
                    }`}>
                      <strong>Result:</strong>
                      <pre className="whitespace-pre-wrap mt-2 text-sm">{output}</pre>
                    </div>
                  )}
                
                <EdgeLegend/>
                </div>
                </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default AttemptAdventure;