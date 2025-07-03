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
    
 
    const isEmpty = Object.values(data).every(
      value => value === "" || (Array.isArray(value) && value.length === 0)
    );
    
    if (!isEmpty) {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }
  }, [key, data, shouldBlockSave]);

  useEffect(() => {
    if (shouldBlockSave) return;
    
    timerRef.current = setTimeout(saveData, throttle);
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [saveData, throttle, shouldBlockSave]);
  

  const loadSavedData = useCallback((): T | null => {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
     
      if (Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }
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