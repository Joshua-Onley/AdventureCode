import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPublicAdventures } from "../api/adventure";

interface Adventure {
  id: number;
  name: string;
  description: string;
  creator_id: number;
  created_at: string;
  is_public: boolean;
  approval_status: string;
  total_attempts: number;
  total_completions: number;
  access_code: string | null;
  start_node_id: string;
  end_node_id: string;
}

const Landing = () => {
  const navigate = useNavigate();
  const [publicAdventures, setPublicAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicAdventures = async () => {
      try {
        setLoading(true);
        const adventures = await getPublicAdventures();
        setPublicAdventures(adventures);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error("Error fetching public adventures:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicAdventures();
  }, []);

  return (
    <div>
      <h1>Welcome to the landing page</h1>
      
      {loading && <p>Loading adventures...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {!loading && !error && (
  <div>
    <h2>
      Public Adventures ({publicAdventures.length})
    </h2>
    
    {publicAdventures.length > 0 ? (
      <div>
        {publicAdventures.map((adventure) => (
          <div 
            key={adventure.id} 
        
          >
            <h3>
              {adventure.name}
            </h3>
            
            <div>
              <div>
                <span>Total Attempts:</span>
                <span>{adventure.total_attempts || "Unknown"}</span>
              </div>
              <div>
                <span>Completions:</span>
                <span>
                  {adventure.total_completions}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/adventure/attempt/${adventure.id}`)}>
              Start Adventure
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div >
        <p >No public adventures available yet</p>
        <button 
          onClick={() => navigate('/create-adventure')}
        >
          Create Your Own Adventure
        </button>
      </div>
    )}
  </div>
)}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        <button onClick={() => navigate("/signup")}>Signup</button>
        <button onClick={() => navigate("/login")}>Login</button>
        <button onClick={() => navigate("/about")}>About</button>
        <button onClick={() => navigate("/me")}>Me</button>
        <button onClick={() => navigate("/problems")}>Create Problem</button>
        <button onClick={() => navigate("/attempt")}>Attempt Problem</button>
        <button onClick={() => navigate("/create-adventure")}>Create an Adventure</button>
        <button onClick={() => navigate("/my-adventures")}>My Adventures</button>
    
      </div>
    </div>
  );
};

export default Landing;