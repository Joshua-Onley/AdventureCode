import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
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
 
  useEffect(() => {
    const currentUser = localStorage.getItem("userName");
    setCurrentUsername(currentUser);
  }, []);

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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
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
        <PanelGroup direction="horizontal">
          <Panel 
            defaultSize={75} 
            minSize={50} 
            maxSize={85}
            className="h-full"
          >
            <div className="h-full overflow-y-auto">
              <MainContent
                loading={loading}
                publicAdventures={publicAdventures}
                calculateSuccessRate={calculateSuccessRate}
                formatTime={formatTime}
                formatDate={formatDate}
              />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-2 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex items-center justify-center">
            <div className="w-0.5 h-8 bg-gray-500 rounded-full" />
          </PanelResizeHandle>
          
          <Panel 
            defaultSize={25} 
            minSize={15} 
            maxSize={50}
            className="h-full"
          >
            <Sidebar />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};
  
export default Landing;