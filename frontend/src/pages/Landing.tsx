import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getPublicAdventures } from "../api/adventure";
import { MainContent } from "../components/landing/MainContent"
import { Sidebar } from "../components/landing/Sidebar";
import { ErrorMessage } from "../components/landing/ErrorMessage";
import { Header } from "../components/landing/Header"

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
  best_completion_time: number | null;
  best_completion_user: string | null;

   
}

const Landing = () => {
  const navigate = useNavigate();
  const [publicAdventures, setPublicAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem("userName");
    setCurrentUsername(currentUser);
  }, []);

  useEffect(() => {
    const fetchPublicAdventures = async () => {
      try {
        setLoading(true);
        const adventures = await getPublicAdventures();
        console.log(adventures)
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleAccessSubmit = () => {
    if (!accessCode.trim()) {
      setCodeError("Please enter a 6‑digit code");
      return;
    }
    setCodeError(null);
    navigate(`/adventures/access/${accessCode}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeInSeconds: number | null): string => {

    if (!timeInSeconds) {
      return "no attempts"
    }
    if (timeInSeconds < 60) {
      return `${Math.round(timeInSeconds)}s`;
    } else if (timeInSeconds < 3600) {
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.round(timeInSeconds % 60);
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const seconds = Math.round(timeInSeconds % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  };
  

  const calculateSuccessRate = (attempts: number, completions: number) => {
    if (attempts === 0) return 0;
    return Math.round((completions / attempts) * 100);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header currentUsername={currentUsername} handleLogout={handleLogout} />

      <ErrorMessage error={error} />

      <div className="flex flex-1 overflow-hidden">
        <div className="w-3/4 h-full overflow-y-auto">
          <MainContent
            loading={loading}
            publicAdventures={publicAdventures}
            calculateSuccessRate={calculateSuccessRate}
            formatTime={formatTime}
            formatDate={formatDate}
          />
        </div>

        <Sidebar>
        
          <>
          <div className="p-4 bg-white rounded shadow mb-4">
            <h3 className="font-semibold mb-2">Enter Access Code</h3>
            <input
              type="text"
              maxLength={6}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="e.g. A1B2C3"
            />
            {codeError && (
              <p className="text-red-600 text-sm mb-2">{codeError}</p>
            )}
            <button
              onClick={handleAccessSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Go
            </button>
          </div>

          </>
        </Sidebar>
      </div>
    </div>
  );
};


  

export default Landing;