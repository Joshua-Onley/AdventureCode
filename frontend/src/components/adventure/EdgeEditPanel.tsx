import React from 'react';
import type { Edge } from 'reactflow';

interface EdgeEditPanelProps {
  edge: Edge;
  onConditionChange: (condition: string) => void;
  onDelete: () => void;
}

const EdgeEditPanel: React.FC<EdgeEditPanelProps> = ({
  edge,
  onConditionChange,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-xl font-bold mb-4">Edit Connection</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Condition</label>
        <select
          value={edge.data?.condition || "default"}
          onChange={(e) => onConditionChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        >
          <option value="default">Default/Always</option>
          <option value="correct">Correct Solution</option>
          <option value="incorrect">Incorrect Solution</option>
        </select>
      </div>
      
      <button
        onClick={onDelete}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Delete Connection
      </button>
    </div>
  );
};

export default EdgeEditPanel;