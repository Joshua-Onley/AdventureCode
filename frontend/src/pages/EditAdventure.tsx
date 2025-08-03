import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
 
  type Node,
  type Edge,
 
} from "reactflow";
import "reactflow/dist/style.css";
import ProblemNode from "../components/adventure/ProblemNode";
import CustomEdge from "../components/adventure/CustomEdge";
import NodeEditPanel from "../components/adventure/NodeEditPanel";
import { useAdventureGraph } from "../hooks/useAdventureGraph";
import type { ProblemData, GraphEdge, GraphNode, NodeData, EdgeData } from "../components/shared/types";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { isTokenExpired } from "../utils/authHelpers";
import StatusMessages from "../components/adventure/StatusMessages";
import { useMessages } from "../hooks/useMessages"

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

const EditAdventure: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showTokenExpired, setShowTokenExpired] = useState(false);
  const { message } = useMessages();
  
  const {
    nodes,
    edges,
    selectedEdge,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    validateGraph,
    setSelectedEdge,
  } = useAdventureGraph();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const fetchAdventure = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

         if (isTokenExpired(token)) {
              setShowTokenExpired(true);
            }

        const response = await axios.get(
          `${FASTAPI_BACKEND_URL}/api/adventures/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const adventureData = response.data;
        setAdventure(adventureData);

       
        const flowNodes = adventureData.graph_data.nodes.map((n: NodeData) => ({
          id: n.id,
          type: n.type || "problemNode",
          position: n.position,
          data: {
            ...n.data,
            label: n.data.title || `Node ${n.id}`
          }
        }));

        setNodes(flowNodes);

       
        const flowEdges = adventureData.graph_data.edges.map((e: EdgeData) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          data: {
            condition: e.data?.condition || "default"
          },
          type: e.type || "custom",
          style: {
            stroke: e.data?.condition === 'correct' 
              ? '#10B981' 
              : e.data?.condition === 'incorrect' 
                ? '#EF4444' 
                : '#6B7280'
          }
        }));

        setEdges(flowEdges);
      } catch (err) {
        console.error("Error fetching adventure:", err);
      }
    };

    if (id) {
      fetchAdventure();
    }
  }, [id, navigate, setNodes, setEdges]);

  if (!adventure) {
    return <div>Loading...</div>
  }

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null); 
  };

  const handleEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); 
  };

  const handleSaveAdventure = async () => {

    const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }
         if (isTokenExpired(token)) {
              setShowTokenExpired(true);
              return
            }

    const validationError = validateGraph(nodes, edges);
    if (validationError) {
      setValidationError(validationError);
      return;
    }
    setValidationError(null);
    setSaving(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const backendNodes = nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          title: node.data.title,
          description: node.data.description,
          language: node.data.language,
          code_snippet: node.data.code_snippet,
          expected_output: node.data.expected_output,
        }
      }));

      const backendEdges = edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        data: {
          condition: edge.data?.condition || "default"
        }
      }));

      if (!adventure) {
        return <div>Loading...</div>
      }

      const payload = {
        name: adventure.name,
        description: adventure.description,
        graph_data: {
          nodes: backendNodes,
          edges: backendEdges
        }
      };

      await axios.put(
        `${FASTAPI_BACKEND_URL}/api/adventures/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      navigate("/my-adventures");
    } catch (err) {
      console.error("Error saving adventure:", err);
      setValidationError("Failed to save adventure. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateNodeData = (nodeId: string, data: Partial<ProblemData>) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, ...data }
      });
    }
  };

  const handleAddNode = () => {
    const newNodeId = generateUUID(); 
    const newNode: Node = {
      id: newNodeId,
      type: "problemNode",
      position: { x: 100, y: 100 },
      data: {
        title: "New Problem",
        description: "",
        language: "python",
        code_snippet: "",
        expected_output: "",
        label: "New Problem"
      }
    };
    
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
    setSelectedEdge(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    
    setNodes(nodes.filter(node => node.id !== nodeId));
    
    setEdges(edges.filter(
      edge => edge.source !== nodeId && edge.target !== nodeId
    ));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges(edges.filter(edge => edge.id !== edgeId));
    setSelectedEdge(null);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editing: {adventure?.name}</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleSaveAdventure}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Adventure"}
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>
      <StatusMessages
        showTokenExpired={showTokenExpired}
        message={message}
      />

      {validationError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Validation Error:</strong>
          <div className="mt-2 whitespace-pre-wrap">{validationError}</div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={75} minSize={30} maxSize={80} className="h-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />

          <Panel defaultSize={25} minSize={20} maxSize={70} className="bg-white border-l border-gray-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4">
                <button
                  onClick={handleAddNode}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
                >
                  Add New Problem Node
                </button>
              </div>
              
              {selectedNode ? (
                <NodeEditPanel
                  node={selectedNode}
                  onUpdate={updateNodeData}
                  onDelete={handleDeleteNode}
                />
              ) : selectedEdge ? (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <h2 className="text-xl font-bold mb-4">Edit Connection</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
                      value={selectedEdge.data?.condition || "correct"}
                      onChange={(e) => {
                        const updatedEdges = edges.map(edge => 
                          edge.id === selectedEdge.id 
                            ? { 
                                ...edge, 
                                data: { ...edge.data, condition: e.target.value },
                                style: {
                                  stroke: e.target.value === 'correct' 
                                    ? '#10B981' 
                                    : e.target.value === 'incorrect' 
                                      ? '#EF4444' 
                                      : '#6B7280'
                                }
                              }
                            : edge
                        );
                        setEdges(updatedEdges);
                      }}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      
                      <option value="correct">Correct Solution</option>
                      <option value="incorrect">Incorrect Solution</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteEdge(selectedEdge.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Delete Connection
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {nodes.length === 0 
                    ? "Add your first node to start building" 
                    : "Select a node or connection to edit"}
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default EditAdventure;