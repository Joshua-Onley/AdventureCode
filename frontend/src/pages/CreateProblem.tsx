import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ProblemForm from "../components/shared/ProblemForm";
import { useCreateProblem } from "../hooks/useCreateProblem";
import type { ProblemBase } from "../components/shared/types";
import { isTokenExpired, getStoredToken } from "../utils/authHelpers";
import useAutoSave from "../hooks/useAutosave";

const STORAGE_KEY = "draft:CreateProblem";

const CreateProblem = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showTokenExpired, setShowTokenExpired] = useState(false);
  const [shouldBlockSave, setShouldBlockSave] = useState(false); 
  
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

  
  useEffect(() => {
    if (isCheckingAuth) return;
    
    const draft = loadSavedData();
    if (draft) {
      setProblem(draft.problem);
      setIsPublic(draft.isPublic);
    }
  }, [isCheckingAuth, loadSavedData]);

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
      setProblem({
        title: "",
        description: "",
        language: "python",
        code_snippet: "",
        expected_output: "",
        difficulty: 3,
      });
      setIsPublic(true);
    }
  }, [success]);

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
              setProblem({
                title: "",
                description: "",
                language: "python",
                code_snippet: "",
                expected_output: "",
                difficulty: 3,
              });
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