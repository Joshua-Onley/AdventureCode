import React from 'react';
import type { Node, Edge } from 'reactflow';
import type { ProblemData, ProblemBase } from '../shared/types';

import ProblemForm from '../shared/ProblemForm';
import NodeEditPanel from './NodeEditPanel';
import EdgeEditPanel from './EdgeEditPanel';
import SidebarControls from './SidebarControls';
import SidebarInfoPanel from './SidebarInfoPanel';

interface SidebarContentProps {
  shouldBlockSave: boolean;
  showProblemForm: boolean;
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  newProblem: ProblemBase;
  onToggleProblemForm: () => void;
  onClearCanvas: () => void;
  onProblemChange: (problem: ProblemBase) => void;
  onAddProblem: () => void;
  onCancelProblemForm: () => void;
  onUpdateNode: (nodeId: string, data: Partial<ProblemData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onEdgeConditionChange: (condition: string) => void;
  onDeleteEdge: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  shouldBlockSave,
  showProblemForm,
  selectedNode,
  selectedEdge,
  newProblem,
  onToggleProblemForm,
  onClearCanvas,
  onProblemChange,
  onAddProblem,
  onCancelProblemForm,
  onUpdateNode,
  onDeleteNode,
  onEdgeConditionChange,
  onDeleteEdge,
}) => {
  return (
    <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <SidebarControls
          shouldBlockSave={shouldBlockSave}
          showProblemForm={showProblemForm}
          onToggleProblemForm={onToggleProblemForm}
          onClearCanvas={onClearCanvas}
        />

        {showProblemForm ? (
          <div className="bg-gray-50 rounded-lg mb-4">
            <ProblemForm
              problem={newProblem}
              onChange={onProblemChange}
              onSubmit={onAddProblem}
              onCancel={onCancelProblemForm}
              title="Add Problem to Adventure"
              submitText="Add to Canvas"
            />
          </div>
        ) : selectedNode ? (
          <NodeEditPanel
            node={selectedNode}
            onUpdate={onUpdateNode}
            onDelete={onDeleteNode}
          />
        ) : selectedEdge ? (
          <EdgeEditPanel
            edge={selectedEdge}
            onConditionChange={onEdgeConditionChange}
            onDelete={onDeleteEdge}
          />
        ) : (
          <SidebarInfoPanel />
        )}
      </div>
    </div>
  );
};

export default SidebarContent;