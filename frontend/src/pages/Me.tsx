import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: number;
  email: string;
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
        const response = await fetch(`${FASTAPI_BACKEND_URL}/me`, {
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
        
        if (data.id && data.email) {
          setUser(data);
        } else {
          throw new Error('Invalid user data structure');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        console.log(error)
        
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);  

  if (loading) return <div>Loading user data...</div>;
  

  return user ? (
    <div>
      <h2>
        Welcome, {user.name || user.email || 'Guest'}
      </h2>
      <div>
        <p>User ID: {user.id}</p>
        <p>Email: {user.email}</p>
      </div>
    </div>
  ) : (
    <div>
      <p>Redirecting to login page...</p>
    </div>
  );
};

export default Me;