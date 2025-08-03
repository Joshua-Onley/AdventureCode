import React, { useState, useCallback, useMemo } from "react";
import type { Node } from "reactflow";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import AdventureHeader from "../components/adventure/CreateAdventureHeader";
import StatusMessages from "../components/adventure/StatusMessages";
import AdventureFormInputs from "../components/adventure/AdventureFormInputs";
import FlowCanvas from "../components/adventure/FlowCanvas";
import SidebarContent from "../components/adventure/SidebarContent";

import { useAdventureGraph } from "../hooks/useAdventureGraph";
import { useProblemForm } from "../hooks/useProblemForm";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useAdventureForm } from "../hooks/useAdventureForm";
import { useAdventureSave } from "../hooks/useAdventureSave";
import { useAdventureAuth } from "../hooks/useAdventureAuth";
import { useAdventureData } from "../hooks/useAdventureData";
import { useNodeManagement } from "../hooks/useNodeManagement";
import { useSelectionManagement } from "../hooks/useSelectionManagement";
import { useMessages } from "../hooks/useMessages";
import { useBeforeUnload } from "../hooks/useBeforeUnload";
import useAutoSave from "../hooks/useAutosave";

const CreateAdventure = () => {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { isCheckingAuth } = useAdventureAuth();
  const { message, showTokenExpired, showError, showSuccess, clearMessages, showTokenExpiredMessage } = useMessages();
  
  const {
    adventureTitle,
    adventureDescription,
    shouldBlockSave,
    setShouldBlockSave,
    handleTitleChange,
    handleDescChange,
  } = useAdventureForm();

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
    resetForm: resetProblemForm
  } = useProblemForm();

  const userId = localStorage.getItem('userId') || 'unknown';
  const STORAGE_KEY = `draft:CreateAdventure:${userId}`;
  
  const autoSaveData = useMemo(() => ({
    adventureTitle,
    adventureDescription,
    nodes,
    edges,
    userId
  }), [adventureTitle, adventureDescription, nodes, edges, userId]);

  const { loadSavedData, clearSavedData } = useAutoSave(STORAGE_KEY, autoSaveData, shouldBlockSave);

  const { handleSaveAdventure } = useAdventureSave({ 
    nodes, 
    edges, 
    validateGraph, 
    clearSavedData, 
    setShouldBlockSave,
    showError,
    showSuccess,
    showTokenExpiredMessage,
  });

  const { startNewAdventure } = useAdventureData({
    isCheckingAuth,
    loadSavedData,
    clearSavedData,
    setAdventureTitle: (title: string) => handleTitleChange({ target: { value: title } } as React.ChangeEvent<HTMLInputElement>),
    setAdventureDescription: (desc: string) => handleDescChange({ target: { value: desc } } as React.ChangeEvent<HTMLTextAreaElement>),
    setNodes,
    setEdges,
    clearGraph,
  });

  const { handleAddProblemToCanvas, updateNodeData, handleDeleteNode } = useNodeManagement({
    nodes,
    edges,
    selectedNode,
    setNodes,
    setEdges,
    setSelectedNode,
    createNewNode,
    resetProblemForm,
    setSelectedEdge,
    setShowProblemForm,
  });

  const { handleNodeClick, handleEdgeClick, clearSelection } = useSelectionManagement({
    setSelectedNode,
    setSelectedEdge,
    setShowProblemForm,
  });

  useKeyboardShortcuts(selectedEdge, deleteSelectedEdge);

  useBeforeUnload({ shouldBlockSave, adventureTitle, nodes, edges });

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

  const handleAddProblem = useCallback(() => {
    const result = handleAddProblemToCanvas(newProblem);
    if (result.success) {
      showSuccess(result.message);
    } else {
      showError(result.message, 500);
    }
  }, [handleAddProblemToCanvas, newProblem, showSuccess, showError]);

  const handleToggleProblemForm = useCallback(() => {
    setShowProblemForm(!showProblemForm);
    clearSelection();
  }, [showProblemForm, setShowProblemForm, clearSelection]);

  const handleClearCanvas = useCallback(() => {
    clearGraph();
    clearMessages();
    clearSelection();
  }, [clearGraph, clearMessages, clearSelection]);

  const handleStartNewAdventure = useCallback(() => {
    setShouldBlockSave(false);
    startNewAdventure();
    clearMessages();
    clearSelection();
  }, [setShouldBlockSave, startNewAdventure, clearMessages, clearSelection]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AdventureHeader
        shouldBlockSave={shouldBlockSave}
        adventureTitle={adventureTitle}
        nodesLength={nodes.length}
        onSaveAdventure={() => handleSaveAdventure(adventureTitle, adventureDescription)}
        onStartNewAdventure={handleStartNewAdventure}
      />

      <StatusMessages
        showTokenExpired={showTokenExpired}
        message={message}
      />

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={75} minSize={30} maxSize={80}>
            <div className="h-full flex flex-col">
              <AdventureFormInputs
                adventureTitle={adventureTitle}
                adventureDescription={adventureDescription}
                shouldBlockSave={shouldBlockSave}
                onTitleChange={handleTitleChange}
                onDescriptionChange={handleDescChange}
              />

              <div className="flex-1">
                <FlowCanvas
                  nodes={nodes}
                  edges={edges}
                  shouldBlockSave={shouldBlockSave}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  onShowProblemForm={() => setShowProblemForm(true)}
                />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />

          <Panel defaultSize={25} minSize={20} maxSize={70}>
            <SidebarContent
              shouldBlockSave={shouldBlockSave}
              showProblemForm={showProblemForm}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              newProblem={newProblem}
              onToggleProblemForm={handleToggleProblemForm}
              onClearCanvas={handleClearCanvas}
              onProblemChange={setNewProblem}
              onAddProblem={handleAddProblem}
              onCancelProblemForm={() => setShowProblemForm(false)}
              onUpdateNode={updateNodeData}
              onDeleteNode={handleDeleteNode}
              onEdgeConditionChange={handleEdgeConditionChange}
              onDeleteEdge={deleteSelectedEdge}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default CreateAdventure;