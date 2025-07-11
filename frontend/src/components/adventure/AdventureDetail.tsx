import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { ProblemData } from "../shared/types";

interface GraphEdge {
  source: string;
  target: string;
  condition: string;
}

interface GraphNode {
  id: string;
  position: { x: number; y: number };
  data: ProblemData; 
}

interface AdventureDetailResponse {
  id: number;
  title: string;
  description: string;
  graph_data: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  creator_id: number;
}

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

const AdventureDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [adventure, setAdventure] = useState<AdventureDetailResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("No adventure ID provided");
      setLoading(false);
      return;
    }

    const fetchAdventure = async () => {
      try {
        setLoading(true);
        setError("");
        
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get<AdventureDetailResponse>(
          `${FASTAPI_BACKEND_URL}/adventures/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAdventure(response.data);
      } catch (err) {
        let errorMessage = "Failed to load adventure";
        
        if (axios.isAxiosError(err)) {
          if (err.response) {
            errorMessage = err.response.data?.detail || err.message;
          } else if (err.request) {
            errorMessage = "No response received from server";
          } else {
            errorMessage = err.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchAdventure();
  }, [id, navigate]);

  if (loading) return <div>Loading adventure...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!adventure) return <div>Adventure not found</div>;

  return (
    <div>
      <h1>{adventure.title}</h1>
      <p>{adventure.description}</p>

      <h2>Problems in this Adventure</h2>
      <ol>
        {adventure.graph_data.nodes.map((node) => (
          <li key={node.id}>
            <h3>{node.data.title}</h3>
            <p>{node.data.description}</p>
            <div>
              <pre>{node.data.code_snippet}</pre>
            </div>
            <div>
              <strong>Expected Output:</strong> {node.data.expected_output}
            </div>
            
          </li>
        ))}
      </ol>

      <h2>Graph Structure</h2>
      <div>
        <pre>{JSON.stringify(adventure.graph_data, null, 2)}</pre>
      </div>
    </div>
  );
};


export default AdventureDetail;