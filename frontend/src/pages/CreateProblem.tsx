import { useState, useEffect } from "react"; 
import { useNavigate } from "react-router-dom";
import ProblemForm from "../components/shared/ProblemForm";
import { useCreateProblem } from "../hooks/useCreateProblem";
import type { ProblemBase } from "../components/shared/types";

const CreateProblem = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      
      navigate('/login', { replace: true });
    } else {
      setIsCheckingAuth(false);
    }
  }, [navigate]);

  const handleSubmit = async () => {
    await submit({
      ...problem,
      is_public: isPublic,
    });
  };

  
  if (isCheckingAuth) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div className="create-problem-page">
      <h1>Create New Problem</h1>
      
      {success ? (
        <div className="success-message">{success}</div>
      ) : (
        <ProblemForm
          problem={problem}
          onChange={setProblem}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          title="Create Problem"
          submitText={loading ? "Creating..." : "Create Problem"}
          showPublicOption={true}
          isPublic={isPublic}
          onPublicChange={setIsPublic}
        />
      )}
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default CreateProblem;