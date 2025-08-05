import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import StatusMessages from "../components/adventure/StatusMessages";
import { useMessages } from "../hooks/useMessages"
import { isTokenExpired } from "../utils/authHelpers";

const FASTAPI_BACKEND_URL = import.meta.env.VITE_API_URL;

interface Problem {
    title: string;
    description: string;
    code_snippet: string;
    completions: number;
    is_public: boolean;
    approved_by?: string;
    created_at: string;
    language: string;
    access_code: string;
    id: number;
    expected_output: string;
    creator_id?: number;
    approval_status: string;
    approval_requested_at: string;
    approved_at?: string;

}

const MyProblems: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { message } = useMessages()
  const [tokenExpired, setTokenExpired] = useState<boolean>(false)

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        if (isTokenExpired(token)) {
          setTokenExpired(true)
          return
        }

        const response = await axios.get<Problem[]>(
          `${FASTAPI_BACKEND_URL}/api/problems`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
       
        setProblems(response.data);
      } catch (err) {
        setError("Failed to fetch problems");
        console.error("Error fetching problems:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [navigate]);

  

  const handleDeleteProblem = async (problemId: number) => {
    if (!window.confirm("Are you sure you want to delete this problem?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${FASTAPI_BACKEND_URL}/api/problems/${problemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

     
      setProblems(prev => prev.filter(a => a.id !== problemId));
    } catch (err) {
      console.error("Error deleting problem:", err);
      alert("Failed to delete problem");
    }
  };

  if (loading) {
    return <div className="p-4">Loading problems...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="container min-w-screen">

      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">My Problems</h1>
        <div className="flex space-x-2">
            
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>

      <StatusMessages
        showTokenExpired={tokenExpired}
        message={message}
      />

      
      {problems.length === 0 && tokenExpired === false ? (
        <div className="text-center py-12">
          <p className="text-lg mb-4">You haven't created any problems yet</p>
          <button
            onClick={() => navigate("/problems")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create New Problem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-5">
          {problems.map(problem => (
            <div
              key={problem.id}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2">{problem.title}</h2>
                {problem.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {problem.description}<br></br>
                  </p>
                )}

                {problem.access_code && (
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    Access Code: {problem.access_code}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {problem.completions || 0} completions
                  </span>
       
                </div>
                
                <div className="flex space-x-2 mt-4">
               
                  <button
                    onClick={() => handleDeleteProblem(problem.id)}
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

export default MyProblems;