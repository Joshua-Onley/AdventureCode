import React from 'react';

interface SidebarControlsProps {
  shouldBlockSave: boolean;
  showProblemForm: boolean;
  onToggleProblemForm: () => void;
  onClearCanvas: () => void;
}

const SidebarControls: React.FC<SidebarControlsProps> = ({
  shouldBlockSave,
  showProblemForm,
  onToggleProblemForm,
  onClearCanvas,
}) => {
  return (
    <div className="space-y-2 mb-4">
      <button
        onClick={onToggleProblemForm}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        disabled={shouldBlockSave}
      >
        {showProblemForm ? "Hide Problem Form" : "Create New Problem"}
      </button>
      <button
        onClick={onClearCanvas}
        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        disabled={shouldBlockSave}
      >
        Clear Canvas
      </button>
    </div>
  );
};

export default SidebarControls;