import React from 'react';
import CodeEditor from './CodeEditor';
import type { ProblemBase } from './types';

interface ProblemFormProps {
  problem: ProblemBase;
  onChange: (problem: ProblemBase) => void;
  onSubmit: () => void;
  onCancel: () => void;
  title: string;
  submitText: string;
}

const ProblemForm: React.FC<ProblemFormProps> = ({
  problem,
  onChange,
  onSubmit,
  onCancel,
  title,
  submitText
}) => {
  const handleInputChange = (field: keyof ProblemBase, value: string) => {
    onChange({ ...problem, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Problem Title</label>
          <input
            type="text"
            value={problem.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter problem title"
            required
          />
        </div>

       
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={problem.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe the problem and what needs to be solved"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Programming Language</label>
          <select
            value={problem.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="php">PHP</option>
            <option value="ruby">Ruby</option>
            <option value="swift">Swift</option>
            <option value="kotlin">Kotlin</option>
            <option value="bash">Bash</option>
          

   
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Code Snippet</label>
          <CodeEditor
            value={problem.code_snippet}
            onChange={(value) => handleInputChange('code_snippet', value)}
            language={problem.language}
            height="200px"
            placeholder={`Enter your ${problem.language} code here...`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expected Output</label>
          <CodeEditor
            value={problem.expected_output}
            onChange={(value) => handleInputChange('expected_output', value)}
            language="text"
            height="100px"
            theme="vs-light"
            placeholder="Enter the expected output..."
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {submitText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProblemForm;