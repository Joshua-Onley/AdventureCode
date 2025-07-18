import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdventureAccessBox = () => {


    const [AdventureAccessCode, setAdventureAccessCode] = useState("");
    const [codeError, setCodeError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleAdventureAccessCodeSubmit = () => {
        if (!AdventureAccessCode.trim()) {
          setCodeError("Please enter a 6‑digit code");
          return;
        }
        setCodeError(null);
        navigate(`/adventures/access/${AdventureAccessCode}`);
      };

  return (
    <div>
      
          <div className="p-4 bg-white rounded shadow mb-4">
            <h3 className="font-semibold mb-2">Enter Adventure Access Code</h3>
            <input
              type="text"
              maxLength={6}
              value={AdventureAccessCode}
              onChange={(e) => setAdventureAccessCode(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              placeholder="e.g. A1B2C3"
            />
            {codeError && (
              <p className="text-red-600 text-sm mb-2">{codeError}</p>
            )}
            <button
              onClick={handleAdventureAccessCodeSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Go
            </button>
          </div>
      
    </div>
  )
}

export default AdventureAccessBox
