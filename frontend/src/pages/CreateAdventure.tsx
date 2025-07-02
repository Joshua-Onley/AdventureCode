import { useState, useEffect } from "react";
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
import ProblemForm from "../components/shared/ProblemForm"; 
import EdgeSettingsModal from "../components/adventure/EdgeSettingsModal";

import { useAdventureGraph } from "../hooks/useAdventureGraph";
import { useProblemForm } from "../hooks/useProblemForm";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { createAdventure } from "../api/adventure";

const nodeTypes = {
  problemNode: ProblemNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const CreateAdventure = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adventureTitle, setAdventureTitle] = useState("");
  const [adventureDescription, setAdventureDescription] = useState("");
  const [message, setMessage] = useState("");
  
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

  const handleEdgeConditionChange = (condition: string) => {
    if (!selectedEdge) return;

    setEdges(edges.map(edge => 
      edge.id === selectedEdge.id
        ? { ...edge, data: { ...edge.data, condition } }
        : edge
    ));
    setSelectedEdge(null);
  };

  const handleSaveAdventure = async () => {
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
      const adventureData = {
        title: adventureTitle,
        description: adventureDescription,
        problems: nodes.map(node => node.data),
        graph_data: {
          nodes: nodes.map(node => ({
            id: node.id,
            position: node.position,
          })),
          edges: edges.map(edge => ({
            source: edge.source,
            target: edge.target,
            condition: edge.data?.condition || "default",
          })),
        },
      };

      await createAdventure(adventureData);
      
      setMessage("Adventure created successfully!");
      setTimeout(() => {
        setAdventureTitle("");
        setAdventureDescription("");
        clearGraph();
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login', { replace: true });
        } else {
          setIsCheckingAuth(false);
        }
      }, [navigate]);
    
      if (isCheckingAuth) {
        return <div>Checking authentication...</div>;
      }

  const handleAddProblemToCanvas = () => {
    if (!newProblem.title.trim() || !newProblem.code_snippet.trim()) {
      setMessage("Title and code snippet are required");
      return;
    }
    
    const newNode = createNewNode(nodes, newProblem);
    setNodes([...nodes, newNode]);
    resetForm();
    setMessage("Problem added to canvas!");
  };

  return (
    <div className="create-adventure-container">
      <h2 className="text-2xl font-bold mb-4">Create Learning Adventure</h2>

      <div className="adventure-metadata">
        <input
          type="text"
          placeholder="Adventure Title"
          value={adventureTitle}
          onChange={(e) => setAdventureTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={adventureDescription}
          onChange={(e) => setAdventureDescription(e.target.value)}
          rows={2}
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
          >
            {showProblemForm ? "Hide Problem Form" : "Create New Problem"}
          </button>
          <button
            onClick={() => {
              clearGraph();
              setMessage("");
            }}
            className="button button-secondary"
          >
            Clear Canvas
          </button>
        </div>
        <button
          onClick={handleSaveAdventure}
          className="button button-primary"
        >
          Save Adventure
        </button>
      </div>

      {message && (
        <div className={`message ${
          message.includes("success") ? "message-success" : "message-error"
        }`}>
          {message}
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