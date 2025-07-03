import { useEffect, useRef, useCallback } from 'react';

const useAutoSave = <T extends object>(
  key: string, 
  data: T, 
  shouldBlockSave: boolean = false,
  throttle = 5000
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveData = useCallback(() => {
    if (shouldBlockSave) return;
    
    
    const currentUserId = localStorage.getItem('userId') || 'unknown';
 
    const draftData = {
      ...data,
      userId: currentUserId
    };
    
    localStorage.setItem(key, JSON.stringify({
      data: draftData,
      timestamp: Date.now()
    }));
  }, [key, data, shouldBlockSave]);

  useEffect(() => {
    if (shouldBlockSave) return;
    
    timerRef.current = setTimeout(saveData, throttle);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [saveData, throttle, shouldBlockSave]);
  
  const loadSavedData = useCallback((): (T & { userId: string }) | null => {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      return parsed.data;
    } catch {
      return null;
    }
  }, [key]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);
  
  return { loadSavedData, clearSavedData };
};

export default useAutoSave;