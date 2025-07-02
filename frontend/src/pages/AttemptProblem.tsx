import { useState, useEffect } from "react";
import { useFetchProblem, useSubmitSolution } from "../hooks/useProblem";

export default function AttemptProblem() {
  const [accessCode, setAccessCode] = useState("");
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
    submit,
  } = useSubmitSolution();

  useEffect(() => {
    if (problem) {
      setSolution(problem.code_snippet || "");
      setProblemLoaded(true);
    }
  }, [problem]);

  const onLoad = () => {
    setProblemLoaded(false);
    loadProblem(accessCode.trim().toLowerCase());
  };

  const onSubmit = () => {
    if (!problem) return;
    submit({
      access_code: accessCode.trim().toLowerCase(),
      code: solution,
      language: problem.language,
    });
  };

  const onCancel = () => {
    setAccessCode("");
    setProblemLoaded(false);
  };

  return (
    <div>
      <h2>Attempt a Problem</h2>

      {!problemLoaded ? (
        <div>
          <div>
            <label htmlFor="accessCode">
              Enter Access Code:
            </label>
            <input
              id="accessCode"
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              
            />
          </div>
          
          <div>
            <button
              onClick={onLoad}
              disabled={loadingProblem || !accessCode.trim()}
            >
              {loadingProblem ? "Loading…" : "Load Problem"}
            </button>
          </div>
          
          {fetchError && <div className="error-message">{fetchError}</div>}
        </div>
      ) : problem ? (
        <div>
          <div>
            <h3>{problem.title}</h3>
            <p>Language: {problem.language}</p>
          </div>
          
          <div>
            <p>{problem.description}</p>
          </div>
          
          <div>
            <label>Complete the code:</label>
            <div>
              <pre>
                {problem.code_snippet}
              </pre>
            </div>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Add your solution code here..."
              rows={10}
            />
          </div>
          
          <div>
            <button
              onClick={onSubmit}
              disabled={loadingSubmit}
              
            >
              {loadingSubmit ? "Submitting…" : "Submit Solution"}
            </button>
            <button onClick={onCancel} >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {submitError && <div>{submitError}</div>}
      {submitMessage && <div>{submitMessage}</div>}
    </div>
  );
}