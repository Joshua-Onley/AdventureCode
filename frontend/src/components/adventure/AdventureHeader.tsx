import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AdventureHeaderProps {
  shouldBlockSave: boolean;
  adventureTitle: string;
  nodesLength: number;
  onSaveAdventure: () => void;
  onStartNewAdventure: () => void;
}

const AdventureHeader: React.FC<AdventureHeaderProps> = ({
  shouldBlockSave,
  adventureTitle,
  nodesLength,
  onSaveAdventure,
  onStartNewAdventure,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Create Learning Adventure</h1>
      <div className="flex space-x-2">
        <button
          onClick={shouldBlockSave ? onStartNewAdventure : onSaveAdventure}
          disabled={!adventureTitle.trim() || nodesLength === 0}
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
  );
};

export default AdventureHeader;