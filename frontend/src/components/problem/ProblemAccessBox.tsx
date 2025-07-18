import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdventureAccessBox = () => {


    const [ProblemAccessCode, setProblemAccessCode] = useState("");
    const [codeError, setCodeError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleProblemAccessCodeSubmit = () => {
        if (!ProblemAccessCode.trim()) {
          setCodeError("Please enter a 6‑digit code");
          return;
        }
        setCodeError(null);
        navigate(`/problems/access/${ProblemAccessCode}`);
      };

  return (
    <div>
      
          <div className="p-4 bg-white rounded shadow mb-4">
            <h3 className="font-semibold mb-2">Enter Problem Access Code</h3>
            <input
              type="text"
              maxLength={6}
              value={ProblemAccessCode}
              onChange={(e) => setProblemAccessCode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="e.g. A1B2C3"
            />
            {codeError && (
              <p className="text-red-600 text-sm mb-2">{codeError}</p>
            )}
            <button
              onClick={handleProblemAccessCodeSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Go
            </button>
          </div>
      
    </div>
  )
}

export default AdventureAccessBox
