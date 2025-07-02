
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

interface Adventure {
  id: number;
  title: string;
  description: string;
}

const MyAdventures = () => {
  const navigate = useNavigate();
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAdventures = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        
        const response = await axios.get(`${FASTAPI_BACKEND_URL}/adventures`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAdventures(response.data);
      } catch (err) {
        let errorMessage = "Failed to load adventures";
        
        if (axios.isAxiosError(err)) {
          errorMessage = err.response?.data?.detail || err.message;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAdventures();
  }, [navigate]);

  if (loading) return <div>Loading adventures...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h1>My Adventures</h1>
      <button 
        onClick={() => navigate("/create-adventure")}
      >
        Create New Adventure
      </button>

      {adventures.length === 0 ? (
        <div>
          <p>You haven't created any adventures yet</p>
        </div>
      ) : (
        <div>
          {adventures.map((adventure) => (
            <div 
              key={adventure.id} 
              onClick={() => navigate(`/adventures/${adventure.id}`)}
            >
              <h3>{adventure.title}</h3>
              <p>{adventure.description || "No description"}</p>
              <div>
                <span>ID: {adventure.id}</span>
                <button 
                  
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/adventures/${adventure.id}`);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAdventures;