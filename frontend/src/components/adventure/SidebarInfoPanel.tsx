import React from 'react';

const SidebarInfoPanel: React.FC = () => {
  return (
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
  );
};

export default SidebarInfoPanel;