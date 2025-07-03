import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProblemForm from "../components/shared/ProblemForm";
import { useCreateProblem } from "../hooks/useCreateProblem";
import type { ProblemBase } from "../components/shared/types";
import { isTokenExpired, getStoredToken } from "../utils/authHelpers";
import useAutoSave from "../hooks/useAutosave";

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

  const userId = localStorage.getItem('userId') || 'unknown';
  const STORAGE_KEY = `draft:CreateProblem:${userId}`;
  
  const [problem, setProblem] = useState<ProblemBase>({
    title: "",
    description: "",
    language: "python",
    code_snippet: "",
    expected_output: "",
    difficulty: 3,
  });
  
  const [isPublic, setIsPublic] = useState(true);
  const { submit, loading, error, success } = useCreateProblem();
  
  const handleProblemChange = useCallback((newProblem: ProblemBase) => {
    if (!shouldBlockSave) setProblem(newProblem);
  }, [shouldBlockSave]);

  const handlePublicChange = useCallback((isPublic: boolean) => {
    if (!shouldBlockSave) setIsPublic(isPublic);
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
      difficulty: 3,
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
    <div className="create-problem-page">
      {showTokenExpired && (
        <div className="token-expired-banner">
          <p>Your session has expired. Please re-authenticate.</p>
          <button onClick={() => navigate('/login')}>Login Now</button>
          <p>Your progress will be saved automatically.</p>
        </div>
      )}
      
      <h1>Create New Problem</h1>
      
      {success ? (
        <div className="success-message">
          {success}
          <button 
            onClick={() => {
              setShouldBlockSave(false);
              resetProblemState();
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
          showPublicOption={true}
          isPublic={isPublic}
          onPublicChange={handlePublicChange}
        />
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default CreateProblem;