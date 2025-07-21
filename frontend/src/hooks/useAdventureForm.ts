import { useState, useCallback } from 'react';

export const useAdventureForm = () => {
  const [adventureTitle, setAdventureTitle] = useState("");
  const [adventureDescription, setAdventureDescription] = useState("");
  const [shouldBlockSave, setShouldBlockSave] = useState(false);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!shouldBlockSave) setAdventureTitle(e.target.value);
  }, [shouldBlockSave]);
  
  const handleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!shouldBlockSave) setAdventureDescription(e.target.value);
  }, [shouldBlockSave]);

  const resetForm = useCallback(() => {
    setAdventureTitle("");
    setAdventureDescription("");
    setShouldBlockSave(false);
  }, []);

  return {
    adventureTitle,
    adventureDescription,
    shouldBlockSave,
    setAdventureTitle,
    setAdventureDescription,
    setShouldBlockSave,
    handleTitleChange,
    handleDescChange,
    resetForm,
  };
};