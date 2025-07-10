import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from "../shared/types";

interface ProblemSolverProps {
  codeSnippet: string;
  language: string;
  onSubmit: (code: string, language: string) => void;
}

const ProblemSolver: React.FC<ProblemSolverProps> = ({ codeSnippet, language, onSubmit }) => {
  const [code, setCode] = useState(codeSnippet);
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code, selectedLanguage);
  };

  return (
    <div className="problem-solver">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-field">
          <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <select
            id="language"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-field">
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Your Solution
          </label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            placeholder="Complete the code to solve the problem..."
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit Solution
        </button>
      </form>
    </div>
  );
};

export default ProblemSolver;