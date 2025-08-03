import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  currentUsername?: string | null;
  handleLogout: () => void;
  tokenExpired: boolean
}

export function Header({ currentUsername, handleLogout, tokenExpired }: HeaderProps) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Coding Adventures</h1>
        {
          currentUsername && currentUsername !== "guest" ? (
            <p className="text-gray-300 text-sm">
              Welcome back, {currentUsername}!
            </p>
          ) : (
            <p className="text-gray-300 text-sm">
              Welcome, Guest!
            </p>
          )
        }

      </div>
      <div className="flex space-x-2">
        {currentUsername && !tokenExpired && currentUsername !== "guest" ? (
          <>

            <button
              onClick={() => navigate("/me")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
            >
              My Profile
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/signup")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600  hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
