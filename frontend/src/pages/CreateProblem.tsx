import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProblemForm from "../components/shared/ProblemForm";
import { useCreateProblem } from "../hooks/useCreateProblem";
import type { ProblemBase } from "../components/shared/types";
import { isTokenExpired, getStoredToken } from "../utils/authHelpers";
import useAutoSave from "../hooks/useAutosave";
import StatusMessages from "../components/adventure/StatusMessages";
import { useMessages } from "../hooks/useMessages"


type ProblemDraft = {
  problem: ProblemBase;
  isPublic: boolean;
  userId: string;
};

const CreateProblem = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showTokenExpired, setShowTokenExpired] = useState(false);
  const [shouldBlockSave, setShouldBlockSave] = useState(false); 
  const { message } = useMessages();

  const userId = localStorage.getItem('userId') || 'unknown';
  const STORAGE_KEY = `draft:CreateProblem:${userId}`;
  
  const [problem, setProblem] = useState<ProblemBase>({
    title: "",
    description: "",
    language: "python",
    code_snippet: "",
    expected_output: "",
  });
  
  const [isPublic, setIsPublic] = useState(true);
  const { submit, loading, error, success, reset } = useCreateProblem();
  
  const handleProblemChange = useCallback((newProblem: ProblemBase) => {
    if (!shouldBlockSave) setProblem(newProblem);
  }, [shouldBlockSave]);
  
  const { loadSavedData, clearSavedData } = useAutoSave(STORAGE_KEY, {
    problem,
    isPublic
  }, shouldBlockSave); 


  useEffect(() => {
    const token = getStoredToken();
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (isTokenExpired(token)) {
      setShowTokenExpired(true);
    }
    
    setIsCheckingAuth(false);
  }, [navigate]);

  const resetProblemState = useCallback(() => {
    setProblem({
      title: "",
      description: "",
      language: "python",
      code_snippet: "",
      expected_output: "",
    });
    setIsPublic(true);
    setShouldBlockSave(false);
  }, []);


  useEffect(() => {
    if (isCheckingAuth) return;
    
    const draft = loadSavedData() as ProblemDraft | null;
   
    const currentUserId = localStorage.getItem('userId') || 'unknown';
    
    if (draft) {

      if (draft.userId === currentUserId) {
        setProblem(draft.problem);
        setIsPublic(draft.isPublic);
      } else {
       
        clearSavedData();
        resetProblemState();
      }
    } else {
     
      resetProblemState();
    }
  }, [isCheckingAuth, loadSavedData, clearSavedData, resetProblemState]);




  const handleSubmit = async () => {
    const token = getStoredToken();
    
    if (!token || isTokenExpired(token)) {
      setShowTokenExpired(true);
      return;
    }
    
    try {
      await submit({
        ...problem,
        is_public: isPublic,
      });
    
      
      setShouldBlockSave(true);
      clearSavedData();
    } catch (error) {
      console.error("Submission failed:", error);
    }
  };

 
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlockSave && (problem.title || problem.description || problem.code_snippet)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [problem, shouldBlockSave]);

 
  useEffect(() => {
    if (success) {
      resetProblemState();
    }
  }, [success, resetProblemState]);

  if (isCheckingAuth) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Problem creation page</h1>
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
        showTokenExpired={showTokenExpired}
        message={message}
      />
      
       
      
      {success ? (
        <div className="success-message">
          {success} 

          <button 
            onClick={() => {
              reset()
              resetProblemState();
              setShouldBlockSave(false);
              clearSavedData();
              
              
            }}
            className="button button-primary"
          > 
          Create Another Problem
          </button>
        </div>
      ) : (
        <ProblemForm
          problem={problem}
          onChange={handleProblemChange}
          onSubmit={handleSubmit}
          onCancel={() => {
            clearSavedData();
            navigate(-1);
          }}
          title="Create Problem"
          submitText={loading ? "Creating..." : "Create Problem"}

        />
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default CreateProblem;