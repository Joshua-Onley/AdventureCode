import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: number;
  username: string;
  name: string;
}

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

const Me: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await fetch(`${FASTAPI_BACKEND_URL}/api/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.id && data.username) {
          setUser(data);
        } else {
          throw new Error('Invalid user data structure');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        console.log(error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, error]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200 text-center text-gray-700">
          Loading user data...
        </div>
      </div>
    );
  }

  return user ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Username: {user.name || user.username || 'Guest'}
        </h2>
        <div className="space-y-2 text-gray-700">
          <p>
            <span className="font-semibold">User ID:</span> {user.id}
          </p>
          <p>
            <span className="font-semibold">Username:</span> {user.username}
          </p>
          <p>
            <span>TODO: Add more user statistics here</span>
          </p>
        </div>
      </div>
    </div>
  ) : (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200 text-center text-gray-700">
        <p>Redirecting to login page...</p>
      </div>
    </div>
  );
};

export default Me;