import { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  ConnectionMode,
  type Node,
  type Edge,
} from "reactflow";
import axios from "axios";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";

import ProblemNode from "../components/adventure/ProblemNode";
import CustomEdge from "../components/adventure/CustomEdge";
import ProblemForm from "../components/ProblemForm"; 
import NodeEditPanel from "../components/adventure/NodeEditPanel"; 

import { useAdventureGraph } from "../hooks/useAdventureGraph";
import { useProblemForm } from "../hooks/useProblemForm";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { createAdventure } from "../api/adventure";
import useAutoSave from "../hooks/useAutosave";
import { isTokenExpired, getStoredToken } from "../utils/authHelpers";

import type {
  AdventureCreate,
  NodeData as SharedNodeData,
  EdgeData as SharedEdgeData,
  ProblemBase,
  ProblemData,
} from "../components/shared/types";

type AdventureDraft = {
  adventureTitle: string;
  adventureDescription: string;
  nodes: Node<SharedNodeData>[];
  edges: Edge<SharedEdgeData>[];
  userId: string;
};

const nodeTypes = {
  problemNode: ProblemNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const CreateAdventure = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showTokenExpired, setShowTokenExpired] = useState(false);
  const [shouldBlockSave, setShouldBlockSave] = useState(false); 
  const [adventureTitle, setAdventureTitle] = useState("");
  const [adventureDescription, setAdventureDescription] = useState("");
  const [message, setMessage] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node | null>(null); 

  const userId = localStorage.getItem('userId') || 'unknown';
  const STORAGE_KEY = `draft:CreateAdventure:${userId}`;

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
    deleteSelectedEdge,
    setSelectedEdge,
    clearGraph
  } = useAdventureGraph();
  
  const {
    showProblemForm,
    setShowProblemForm,
    newProblem,
    setNewProblem,
    createNewNode,
    resetForm
  } = useProblemForm();

  useKeyboardShortcuts(selectedEdge, deleteSelectedEdge);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!shouldBlockSave) setAdventureTitle(e.target.value);
  }, [shouldBlockSave]);
  
  const handleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!shouldBlockSave) setAdventureDescription(e.target.value);
  }, [shouldBlockSave]);
 
  const handleEdgeConditionChange = useCallback((condition: string) => {
    if (!selectedEdge) return;

    setEdges(edges.map(edge => 
      edge.id === selectedEdge.id
        ? { 
            ...edge, 
            data: { ...edge.data, condition },
            style: {
              stroke: condition === 'correct' 
                ? '#10B981' 
                : condition === 'incorrect' 
                  ? '#EF4444' 
                  : '#6B7280'
            }
          }
        : edge
    ));
  }, [edges, selectedEdge, setEdges]);

  const { loadSavedData, clearSavedData } = useAutoSave(STORAGE_KEY, {
    adventureTitle,
    adventureDescription,
    nodes,
    edges
  }, shouldBlockSave); 

  useEffect(() => {
    const token = getStoredToken();
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    setIsCheckingAuth(false);
  }, [navigate]);

  const resetAdventureState = useCallback(() => {
    setAdventureTitle("");
    setAdventureDescription("");
    setNodes([]);
    setEdges([]);
    setMessage("");
    setShouldBlockSave(false);
    setSelectedNode(null); 
    setSelectedEdge(null); 
  }, [setNodes, setEdges, setSelectedEdge]);

  useEffect(() => {
    if (isCheckingAuth) return;
    
    const draft = loadSavedData() as AdventureDraft | null;
    const currentUserId = localStorage.getItem('userId') || 'unknown';
    
    if (draft) {
      if (draft.userId === currentUserId) {
        setAdventureTitle(draft.adventureTitle);
        setAdventureDescription(draft.adventureDescription);
        setNodes(draft.nodes || []);
        setEdges(draft.edges || []);
      } else {
        clearSavedData();
        resetAdventureState();
      }
    } else {
      resetAdventureState();
      
    }
  }, [isCheckingAuth, loadSavedData, setNodes, setEdges, clearSavedData, resetAdventureState]); 

  const handleSaveAdventure = async () => {
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
    };

    const handleAddProblemToCanvas = useCallback(() => {
      if (!newProblem.title.trim() || !newProblem.code_snippet.trim()) {
        setMessage("Title and code snippet are required");
        
        setTimeout(() => {
          setMessage("");
        }, 500);
        return;
      }
      
      const newNode = createNewNode(nodes, newProblem);
      setNodes([...nodes, newNode]);
      resetForm();
      setMessage("Problem added to canvas successfully!");
     
   
      setSelectedNode(null); 
      setSelectedEdge(null);
      setShowProblemForm(false);
      
      setTimeout(() => {
        setMessage("");
      }, 500);
    }, [newProblem, nodes, createNewNode, setNodes, resetForm, setSelectedEdge, setShowProblemForm]);

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

  const startNewAdventure = useCallback(() => {
    setShouldBlockSave(false);
    setAdventureTitle("");
    setAdventureDescription("");
    clearGraph();
    setMessage("");
    setSelectedNode(null); 
    setSelectedEdge(null); 
  }, [clearGraph, setSelectedEdge]);

  const updateNodeData = useCallback((nodeId: string, data: Partial<ProblemData>) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({
        ...selectedNode,
        data: { ...selectedNode.data, ...data }
      });
    }
  }, [nodes, selectedNode, setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    setEdges(edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  }, [edges, nodes, selectedNode, setEdges, setNodes]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setShowProblemForm(false); 
  }, [setSelectedEdge, setShowProblemForm]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); 
    setShowProblemForm(false);
  }, [setSelectedEdge, setShowProblemForm]);

  if (isCheckingAuth) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Create Learning Adventure</h1>
        <div className="flex space-x-2">
          <button
            onClick={shouldBlockSave ? startNewAdventure : handleSaveAdventure}
            disabled={!adventureTitle.trim() || nodes.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {shouldBlockSave ? "Create New Adventure" : "Save Adventure"}
          </button>
          <button
            onClick={() => navigate("/my-adventures")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </div>

      {showTokenExpired && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Session Expired:</strong>
          <div className="mt-2">
            Your session has expired. Please re-authenticate.
            <button 
              onClick={() => navigate('/login')}
              className="ml-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Login Now
            </button>
          </div>
          <p className="mt-1 text-sm">Your progress will be saved automatically.</p>
        </div>
      )}
      {message && (
        <div className={`px-4 py-3 rounded ${
          message.includes("success") 
            ? "bg-green-100 border border-green-400 text-green-700" 
            : "bg-red-100 border border-red-400 text-red-700"
        }`}>
          <strong>{message.includes("success") ? "Success:" : "Error:"}</strong>
          <div className="mt-2">{message}</div>
          {message.includes("success") && (
            <p className="mt-2 text-sm">Your adventure was saved successfully!</p>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/4 h-full flex flex-col">
          <div className="bg-white p-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Adventure Title"
                value={adventureTitle}
                onChange={handleTitleChange}
                required
                disabled={shouldBlockSave}
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={adventureDescription}
                onChange={handleDescChange}
                rows={1}
                disabled={shouldBlockSave}
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex-1">
            {nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">No problems added yet</p>
                  <button
                    onClick={() => setShowProblemForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    disabled={shouldBlockSave}
                  >
                    Create First Problem
                  </button>
                </div>
              </div>
            ) : (
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
                connectionLineType={ConnectionLineType.SmoothStep}
                connectionMode={ConnectionMode.Loose}
                connectionRadius={30}
              >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
              </ReactFlow>
            )}
          </div>
        </div>

        <div className="w-1/4 bg-white border-l border-gray-200 overflow-y-auto">
  <div className="p-4">
    <div className="space-y-2 mb-4">
      <button
        onClick={() => {
          setShowProblemForm(!showProblemForm);
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={shouldBlockSave}
      >
        {showProblemForm ? "Hide Problem Form" : "Create New Problem"}
      </button>
      <button
        onClick={() => {
          clearGraph();
          setMessage("");
          setSelectedNode(null);
          setSelectedEdge(null);
        }}
        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        disabled={shouldBlockSave}
      >
        Clear Canvas
      </button>
    </div>

    {showProblemForm ? (
      <div className="bg-gray-50 rounded-lg mb-4">
        <ProblemForm
          problem={newProblem}
          onChange={setNewProblem}
          onSubmit={handleAddProblemToCanvas} 
          onCancel={() => setShowProblemForm(false)}
          title="Add Problem to Adventure"
          submitText="Add to Canvas"
        />
      </div>
    ) : selectedNode ? (
      <NodeEditPanel
        node={selectedNode}
        onUpdate={updateNodeData}
        onDelete={handleDeleteNode}
      />
    ) : selectedEdge ? (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-xl font-bold mb-4">Edit Connection</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Condition</label>
          <select
            value={selectedEdge.data?.condition || "default"}
            onChange={(e) => handleEdgeConditionChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="default">Default/Always</option>
            <option value="correct">Correct Solution</option>
            <option value="incorrect">Incorrect Solution</option>
          </select>
        </div>
        
        <button
          onClick={deleteSelectedEdge}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Delete Connection
        </button>
      </div>
    ) : (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Transition Types:</h3>
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
        </div>
      </div>
    )}
  </div>
</div>
      </div>
    </div>
  );
};

export default CreateAdventure;