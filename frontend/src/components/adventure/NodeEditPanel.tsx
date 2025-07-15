import React from 'react';
import CodeEditor from '../CodeEditor';
import type { Node } from 'reactflow';
import type { ProblemData } from '../shared/types';

interface NodeEditPanelProps {
  node: Node<ProblemData>;
  onUpdate: (nodeId: string, data: Partial<ProblemData>) => void;
  onDelete: (nodeId: string) => void;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  node,
  onUpdate,
  onDelete
}) => {
  const handleInputChange = (field: keyof ProblemData, value: string) => {
    onUpdate(node.id, { [field]: value });
  };

  const handleDeleteNode = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      onDelete(node.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Edit Problem Node</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Problem Title</label>
          <input
            type="text"
            value={node.data.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter problem title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={node.data.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe the problem and what needs to be solved"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Programming Language</label>
          <select
            value={node.data.language || 'python'}
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
            value={node.data.code_snippet || ''}
            onChange={(value) => handleInputChange('code_snippet', value)}
            language={node.data.language || 'python'}
            height="200px"
            placeholder={`Enter your ${node.data.language || 'python'} code here...`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expected Output</label>
          <CodeEditor
            value={node.data.expected_output || ''}
            onChange={(value) => handleInputChange('expected_output', value)}
            language="text"
            height="100px"
            theme="vs-light"
            placeholder="Enter the expected output..."
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <button
            onClick={handleDeleteNode}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Delete Node
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditPanel;