import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { Adventure } from "../components/shared/types";

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

const MyAdventures: React.FC = () => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdventures = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await axios.get<Adventure[]>(
          `${FASTAPI_BACKEND_URL}/api/adventures/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(response.data)
        setAdventures(response.data);
      } catch (err) {
        setError("Failed to fetch adventures");
        console.error("Error fetching adventures:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdventures();
  }, [navigate]);

  const handleEditAdventure = (adventureId: number) => {
    navigate(`/adventures/edit/${adventureId}`);
  };

  const handleDeleteAdventure = async (adventureId: number) => {
    if (!window.confirm("Are you sure you want to delete this adventure?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${FASTAPI_BACKEND_URL}/api/adventures/${adventureId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

     
      setAdventures(prev => prev.filter(a => a.id !== adventureId));
    } catch (err) {
      console.error("Error deleting adventure:", err);
      alert("Failed to delete adventure");
    }
  };

  if (loading) {
    return <div className="p-4">Loading adventures...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container min-w-screen">
      
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">My Adventures</h1>
       
        <div className="flex space-x-2">
          
            
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>
      
      {adventures.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg mb-4">You haven't created any adventures yet</p>
          <button
            onClick={() => navigate("/create-adventure")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create New Adventure
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 m-5 p-5">
          {adventures.map(adventure => (
            <div
              key={adventure.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2">{adventure.name}</h2>
                {adventure.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {adventure.description}<br></br>
                  </p>
                )}

                {adventure.access_code && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    Access Code: {adventure.access_code}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {adventure.total_attempts || 0} attempts
                  </span>
                  <span className="text-sm text-gray-500">
                    {adventure.total_completions || 0} completions
                  </span>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEditAdventure(adventure.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAdventure(adventure.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAdventures;