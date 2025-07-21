import React from 'react';

interface AdventureFormInputsProps {
  adventureTitle: string;
  adventureDescription: string;
  shouldBlockSave: boolean;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const AdventureFormInputs: React.FC<AdventureFormInputsProps> = ({
  adventureTitle,
  adventureDescription,
  shouldBlockSave,
  onTitleChange,
  onDescriptionChange,
}) => {
  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <div className="flex space-x-4">
        <input
          type="text"
          placeholder="Adventure Title"
          value={adventureTitle}
          onChange={onTitleChange}
          required
          disabled={shouldBlockSave}
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Description (optional)"
          value={adventureDescription}
          onChange={onDescriptionChange}
          rows={1}
          disabled={shouldBlockSave}
          className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  );
};

export default AdventureFormInputs;