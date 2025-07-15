import { useNavigate } from 'react-router-dom';
import React from 'react';

interface SidebarProps {
  currentUsername?: string | null;
  children?: React.ReactNode;
}

export const Sidebar = ({ currentUsername, children }: SidebarProps) => {
  const navigate = useNavigate();
  
  return (
    <aside className="w-1/4 bg-white p-4 border-l border-gray-200 overflow-y-auto">
      <div className="p-4">

      
        {currentUsername && (
          <>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate("/me")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
            >
              My Profile
            </button>
            </div>
            </>
          )}
        

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
          </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">Single Problems</h3>
        
        <div className="space-y-2">
          <button
            onClick={() => navigate("/problems")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            Create Problem
          </button>
          <button
            onClick={() => navigate("/attempt")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-left"
          >
            Attempt Problem
          </button>

          <h3 className="text-lg font-semibold text-gray-800 mb-4">Information</h3>
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
        {/* 
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Getting Started</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Browse public adventures above</li>
            <li>• Create your own learning paths</li>
            <li>• Share adventures with the community</li>
            <li>• Track your progress and achievements</li>
          </ul>
        </div>
        */}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Adventure Access Code: </h3>
      <div className="space-y-2">

      {children && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          {children}
        </div>
      )}
      </div>
    </aside>
 
  );
};
