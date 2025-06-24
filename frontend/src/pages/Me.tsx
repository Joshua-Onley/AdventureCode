import React, { useEffect, useState } from 'react';

interface UserData {
  id: number;
  email: string;
  name: string;
}

const Me: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('https://adventurecode-bcekcrhpauffhzbn.uksouth-01.azurewebsites.net/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Ensure the data structure matches what your backend sends
        if (data.id && data.email) {
          setUser(data);
        } else {
          throw new Error('Invalid user data structure');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        // Clear invalid token
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) return <div>Loading user data...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Welcome, {user?.name || user?.email || 'Guest'}
      </h2>
      <div className="space-y-2">
        <p>User ID: {user?.id}</p>
        <p>Email: {user?.email}</p>
      </div>
    </div>
  );
};

export default Me;