import { useState, useEffect, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  ConnectionMode,
} from "reactflow";
import axios from "axios";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";

import ProblemNode from "../components/adventure/ProblemNode";
import CustomEdge from "../components/adventure/CustomEdge";
import ProblemForm from "../components/ProblemForm"; 
import EdgeSettingsModal from "../components/adventure/EdgeSettingsModal";

import { useAdventureGraph } from "../hooks/useAdventureGraph";
import { useProblemForm } from "../hooks/useProblemForm";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { createAdventure } from "../api/adventure";
import useAutoSave from "../hooks/useAutosave";
import { isTokenExpired, getStoredToken } from "../utils/authHelpers";

import type { Node, Edge } from "reactflow";

import type {
  AdventureCreate,
  NodeData as SharedNodeData,
  EdgeData as SharedEdgeData,
  ProblemBase,
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
        ? { ...edge, data: { ...edge.data, condition } }
        : edge
    ));
    setSelectedEdge(null);
  }, [edges, selectedEdge, setEdges, setSelectedEdge]);

 
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
  }, [setNodes, setEdges]);

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
      }, 2000);
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
      return;
    }
    
    const newNode = createNewNode(nodes, newProblem);
    setNodes([...nodes, newNode]);
    resetForm();
    setMessage("Problem added to canvas!");
  }, [newProblem, nodes, createNewNode, setNodes, resetForm]);

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
  }, [clearGraph]);

  if (isCheckingAuth) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="create-adventure-container">
      {showTokenExpired && (
        <div className="token-expired-banner">
          <p>Your session has expired. Please re-authenticate.</p>
          <button onClick={() => navigate('/login')}>Login Now</button>
          <p>Your progress will be saved automatically.</p>
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-4">Create Learning Adventure</h2>

      <div className="adventure-metadata">
        <input
          type="text"
          placeholder="Adventure Title"
          value={adventureTitle}
          onChange={handleTitleChange}
          required
          disabled={shouldBlockSave}
        />
        <textarea
          placeholder="Description"
          value={adventureDescription}
          onChange={handleDescChange}
          rows={2}
          disabled={shouldBlockSave}
        />
      </div>

      {showProblemForm && (
        <ProblemForm
          problem={newProblem}
          onChange={setNewProblem}
          onSubmit={handleAddProblemToCanvas} 
          onCancel={() => setShowProblemForm(false)}
          title="Add Problem to Adventure"
          submitText="Add to Canvas"
        />
      )}

      <div className="flow-container" style={{height: '500px' }}>
        {nodes.length === 0 ? (
          <div className="empty-canvas">
            <p className="mb-4">No problems added yet</p>
            <button
              onClick={() => setShowProblemForm(true)}
              className="button button-primary"
              disabled={shouldBlockSave}
            >
              Create First Problem
            </button>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={(_, edge) => setSelectedEdge(edge)}
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

      <EdgeSettingsModal
        edge={selectedEdge}
        onClose={() => setSelectedEdge(null)}
        onDelete={deleteSelectedEdge}
        onChangeCondition={handleEdgeConditionChange}
      />

      <div className="action-buttons">
        <div className="button-group">
          <button
            onClick={() => setShowProblemForm(!showProblemForm)}
            className="button button-primary"
            disabled={shouldBlockSave}
          >
            {showProblemForm ? "Hide Problem Form" : "Create New Problem"}
          </button>
          <button
            onClick={() => {
              clearGraph();
              setMessage("");
            }}
            className="button button-secondary"
            disabled={shouldBlockSave}
          >
            Clear Canvas
          </button>
        </div>
        <button
          onClick={shouldBlockSave ? startNewAdventure : handleSaveAdventure}
          className="button button-primary"
        >
          {shouldBlockSave ? "Create New Adventure" : "Save Adventure"}
        </button>
      </div>

      {message && (
        <div className={`message ${
          message.includes("success") ? "message-success" : "message-error"
        }`}>
          {message}
          {message.includes("success") && (
            <p className="mt-2">Your adventure was saved successfully!</p>
          )}
        </div>
      )}

      <div className="legend">
        <p className="font-bold">Transition Types:</p>
        <p>
          <span className="color-indicator bg-green-500"></span>
          <strong>Green:</strong> Correct path (solid) &nbsp;
          <span className="color-indicator bg-red-500"></span>
          <strong>Red:</strong> Incorrect path (solid) &nbsp;
          <span className="color-indicator bg-gray-400"></span>
          <strong>Grey:</strong> Default path (solid)
        </p>
      </div>
    </div>
  );
};

export default CreateAdventure;