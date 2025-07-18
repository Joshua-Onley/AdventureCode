import React, { useState, useEffect, useCallback } from "react";
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
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessCode) return;
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
    }

    axios.get<Adventure>(
      `${FASTAPI_BACKEND_URL}/adventures/access/${accessCode}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => {
        setAdventure(res.data);
        
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
        
      });
  }, [accessCode, navigate]);

  useEffect(() => {
    if (!adventure) return;
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }

   
    axios
      .get<AdventureAttempt[]>(`${FASTAPI_BACKEND_URL}/attempts?adventure_id=${adventure.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        const attempts = response.data;
        const inProgressAttempt = attempts.find(a => !a.completed);
        
        if (inProgressAttempt) {
          setAttempt(inProgressAttempt);
          setLoading(false);

          if (inProgressAttempt.current_node_id) {
            const nodeEntries = inProgressAttempt.path_taken
              .filter(entry => entry.node_id === inProgressAttempt.current_node_id && entry.code);

            if (nodeEntries.length > 0) {
              setCode(nodeEntries[nodeEntries.length - 1].code || "");
            } else {
              const currentNode = nodes.find(n => n.id === inProgressAttempt.current_node_id);
              if (currentNode) {
                setCode(currentNode.data.code_snippet);
              }
            }
          }
        } else {
          
          axios
            .post<AdventureAttempt>(
              `${FASTAPI_BACKEND_URL}/adventures/${adventure.id}/attempt`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )
            .then((res) => {
              setAttempt(res.data);
              const startNode = nodes.find(n => n.id === res.data.current_node_id);
              if (startNode) {
                setCode(startNode.data.code_snippet);
              }
            })
            .finally(() => setLoading(false));
        }
      })
      .catch(() => setLoading(false));
  }, [adventure, nodes, navigate]);

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
        `${FASTAPI_BACKEND_URL}/adventure_submissions`,
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
          `${FASTAPI_BACKEND_URL}/attempts/${attempt.id}/progress`,
          {
            current_node_id: nextNodeId,
            outcome: outcome,
            code: code,
            completed: adventureCompleted  
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setAttempt(progress.data);
    
        if (nextNodeId !== node.id && !adventureCompleted) {
          const nextNode = nodes.find(n => n.id === nextNodeId);
          if (nextNode) {
            setCode(nextNode.data.code_snippet);
          }
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
      setOutput("Failed to submit solution. Please try again.");
    }
  };

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
                connectionLineType={ConnectionLineType.SmoothStep}
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
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your code here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={12}
                    style={{ resize: 'vertical' }}
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
                    output.includes("Congratulations") || output.includes("correct") || output.includes("success") 
                      ? "bg-green-100 border border-green-400 text-green-700" 
                      : output.includes("Failed") || output.includes("error") || output.includes("incorrect")
                      ? "bg-red-100 border border-red-400 text-red-700"
                      : "bg-blue-100 border border-blue-400 text-blue-700"
                  }`}>
                    <strong>Result:</strong>
                    <pre className="whitespace-pre-wrap mt-2 text-sm">{output}</pre>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold mb-2">Legend:</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-1 bg-green-500 mr-2"></div>
                      <span><strong>Green:</strong> Correct path</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-1 bg-red-500 mr-2"></div>
                      <span><strong>Red:</strong> Incorrect path</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-1 bg-gray-400 mr-2"></div>
                      <span><strong>Grey:</strong> Default path</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span><strong>Blue Node:</strong> Current problem</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default AttemptAdventure;