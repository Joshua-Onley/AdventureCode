
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredToken } from '../utils/authHelpers';

export const useAdventureAuth = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    setIsCheckingAuth(false);
  }, [navigate]);

  return { isCheckingAuth };
};