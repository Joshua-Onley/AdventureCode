import { useNavigate } from 'react-router-dom';
import AdventureAccessBox from '../adventure/AdventureAccessBox';
import ProblemAccessBox from '../problem/ProblemAccessBox';

export const Sidebar = () => {
  const navigate = useNavigate();
  
  return (
    <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Adventures</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate("/create-adventure")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            Create Adventure
          </button>
          <button
            onClick={() => navigate("/my-adventures")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            My Adventures
          </button>
          <AdventureAccessBox/>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6">Single Problems</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate("/problems")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            Create Problem
          </button>
          <button
            onClick={() => navigate("/my-problems")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            My Problems
          </button>
          <ProblemAccessBox/>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6">Information</h3>
        <div className="space-y-2">
          <button
            onClick={() => navigate("/about")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            About
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            Instructions
          </button>
        </div>
      </div>
    </div>
  );
};