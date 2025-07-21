import React from 'react';
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  ConnectionMode,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import ProblemNode from "./ProblemNode";
import CustomEdge from "./CustomEdge";

const nodeTypes = {
  problemNode: ProblemNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  shouldBlockSave: boolean;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
  onShowProblemForm: () => void;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  shouldBlockSave,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onEdgeClick,
  onShowProblemForm,
}) => {
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No problems added yet</p>
          <button
            onClick={onShowProblemForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={shouldBlockSave}
          >
            Create First Problem
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      connectionLineType={ConnectionLineType.Bezier}
      connectionMode={ConnectionMode.Loose}
      connectionRadius={30}
    >
      <Controls />
      <MiniMap />
      <Background gap={12} size={1} />
    </ReactFlow>
  );
};

export default FlowCanvas;