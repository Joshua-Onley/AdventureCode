import { useState, useCallback } from 'react';

export const useMessages = () => {
  const [message, setMessage] = useState("");
  const [showTokenExpired, setShowTokenExpired] = useState(false);

  const showMessage = useCallback((msg: string, timeout: number = 3000) => {
    setMessage(msg);
    if (timeout > 0) {
      setTimeout(() => {
        setMessage("");
      }, timeout);
    }
  }, []);

  const showError = useCallback((error: string, timeout: number = 0) => {
    showMessage(error, timeout);
  }, [showMessage]);

  const showSuccess = useCallback((successMsg: string, timeout: number = 500) => {
    showMessage(successMsg, timeout);
  }, [showMessage]);

  const clearMessage = useCallback(() => {
    setMessage("");
  }, []);

  const clearMessages = useCallback(() => {
    setMessage("");
    setShowTokenExpired(false);
  }, []);

  const showTokenExpiredMessage = useCallback(() => {
    setShowTokenExpired(true);
  }, []);

  return {
    message,
    showTokenExpired,
    showMessage,
    showError,
    showSuccess,
    clearMessage,
    clearMessages,
    showTokenExpiredMessage,
  };
};