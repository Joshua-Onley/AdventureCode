import React from 'react';
import { useNavigate } from 'react-router-dom';

interface StatusMessagesProps {
  showTokenExpired: boolean;
  message: string;
}

const StatusMessages: React.FC<StatusMessagesProps> = ({
  showTokenExpired,
  message,
}) => {
  const navigate = useNavigate();

  if (!showTokenExpired && !message) return null;

  return (
    <div className="space-y-2">
      {showTokenExpired && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Session Expired:</strong>
          <div className="mt-2">
            Your session has expired. Please re-authenticate.
            <button
              onClick={() => navigate('/login')}
              className="ml-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
            >
              Login Now
            </button>
          </div>
          <p className="mt-1 text-sm">Your progress will be saved automatically.</p>
        </div>
      )}
      
      {message && (
        <div
          className={`px-4 py-3 rounded ${
            message.includes("success")
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          }`}
        >
          <strong>{message.includes("success") ? "Success:" : "Error:"}</strong>
          <div className="mt-2">{message}</div>
          {message.includes("success") && (
            <p className="mt-2 text-sm">Your adventure was saved successfully!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusMessages;