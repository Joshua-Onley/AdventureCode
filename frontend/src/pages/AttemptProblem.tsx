
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFetchProblem, useSubmitSolution } from "../hooks/useProblem";
import CodeEditor from '../components/shared/CodeEditor';

export default function AttemptProblem() {

  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  
  const [solution, setSolution] = useState("");
  const [problemLoaded, setProblemLoaded] = useState(false);
  const {
    problem,
    loading: loadingProblem,
    error: fetchError,
    load: loadProblem,
  } = useFetchProblem();

  const {
    loading: loadingSubmit,
    error: submitError,
    message: submitMessage,
    isCorrect,
    submit,
  } = useSubmitSolution();

  useEffect(() => {
    if (!code) {
      navigate("/", { replace: true });
      return;
    }
    setProblemLoaded(false);
    loadProblem(code.trim().toLowerCase());
  }, [code]);

  useEffect(() => {
    if (problem) {
      setSolution(problem.code_snippet || "");
      setProblemLoaded(true);
    }
  }, [problem]);

  const onSubmit = () => {
    if (!problem) return;
    submit({
      access_code: code!.trim().toLowerCase(),
      code: solution,
      language: problem.language,
    });
  };

  const onCancel = () => navigate("/");

  return (
    <div className="container min-w-screen">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Attempt Problem</h1>
        <div className="flex space-x-2">
            
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>
      <div className="p-6">

      {!problemLoaded ? (
        loadingProblem ? (
          <p>Loading problem…</p>
        ) : fetchError ? (
          <p className="text-red-600">{fetchError}</p>
        ) : null
      ) : problem ? (
        <>
          <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
          <p className="mb-4">Language: {problem.language}</p>
          <p className="mb-4">{problem.description}</p>

          <label className="block font-medium mb-1">Complete the code:</label>
          <pre className="bg-gray-100 p-2 rounded mb-2">
            {problem.code_snippet}
          </pre>
          <CodeEditor
              value={solution}
              onChange={(newCode: string) => setSolution(newCode)}
              language={problem.language}
              height="200px"
              placeholder="Enter your code here..."
              theme="vs-light"
            />

          <div className="flex space-x-2">
            <button
              onClick={onSubmit}
              disabled={loadingSubmit}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loadingSubmit ? "Submitting…" : "Submit Solution"}
            </button>
            <button
              onClick={onCancel}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </>
      ) : null}

      </div>

      {submitError && <p className="mt-4 text-red-600">{submitError}</p>}
      {submitMessage && (
        <p className={`mt-4 font-medium ${isCorrect ? "text-green-600" : "text-red-600"}`}>
          {submitMessage}
  </p>
)}

    </div>
  );
}
