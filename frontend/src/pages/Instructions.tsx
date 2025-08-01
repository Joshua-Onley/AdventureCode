import { useNavigate } from "react-router-dom";


export default function Instructions() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Instructions</h1>
        <div className="flex space-x-2">
            
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Home
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8 space-y-8">
     
        <section>
          <h1 className="text-3xl font-bold">How to Create an Adventure</h1>
          <p className="mt-2 text-gray-700">
            Follow these steps to build a valid adventure. Each rule must be satisfied before saving.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">1. Add Problem Nodes</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Click "Create Problem" to add a new node.</li>
            <li>Fill out <strong>all</strong> fields: <code>Title</code>, <code>Description</code>, <code>Language</code>, <code>Code Snippet</code>, and <code>Expected Output</code>.</li>
            <li>A valid adventure must contain at least <strong>2</strong>problem nodes</li>
          </ul>

          <h2 className="text-2xl font-semibold">2. Connect Nodes</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <p>Each problem node has two handles:</p>
            <li>The right handle is for outgoing edges i.e., it defines which problems can be reached from the current node</li>
            <li>The left handle is for incoming nodes i.e., it defines which problems lead to the current node</li>

            <li>Drag from a node handle to another node to create an edge.</li>
            <p>An adventure must have exactly one starting node and one ending node. These are defined implicitly as follows:</p>
            <li>A starting node is a problem node that has no incoming edges i.e., it is not reachable from any other problem node</li>
            <li>An ending node is a node that has no outgoing edges i.e., it is the last problem node because it has no outgoing edge leading to other problems</li>
            <p>Every problem node that is not a starting node or an ending node must have at least one incoming edge and one outgoing edge</p>
            <li>Problems that have no incoming edges would be unreachable</li>
            <li>Problems have no outgoing edges would be a dead end</li>
            <li>No node can connect to itself; duplicate edges are not allowed e.g., having two outgoing 'correct' edges leading to different problems is not allowed.</li>
          </ul>

          <h2 className="text-2xl font-semibold">3. Define Edge Conditions</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Hover over an edge and select it to set its <code>condition</code>.</li>
            <li>There are three available conditions:</li>
            <ul className="list-disc list-inside ml-6">
            <li>Correct: this is a green edge which is taken when the current node is answered correctly</li>
            <li>Incorrect: this is a red edge which is taken when the current tnode is answered incorrectly</li>
            <li>Default/Always: this is a grey edge which is taken no matter whether the current node is answered correctly or incorrectly</li>
            </ul>
            <li>Each branching node must cover all possible outcomes:</li>
            <ul className="list-disc list-inside ml-6">
              <li>For example: you cannot have a problem node which has only a correct outgoing edge. Because if that question is answered incorrectly, there is no incorrect edge specifying the next problem</li>
            </ul>
            <li>Only one <code>correct</code> and one <code>incorrect</code> edge per node; multiple <code>default</code> edges are allowed.</li>
          </ul>

          <h2 className="text-2xl font-semibold">4. Choose Start and End Nodes</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>The <strong>start node</strong> has no incoming edges.</li>
            <li>The <strong>end node</strong> has no outgoing edges.</li>
            <li>There must be exactly one start and one end node.</li>
          </ul>

          <h2 className="text-2xl font-semibold">5. Validate and Save</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Click "Save Adventure" to run the validation.</li>
            <li>Fix any error messages (e.g. missing fields, unreachable nodes).</li>
            <li>Once "Save" succeeds, your adventure is live and shareable via code.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Troubleshooting</h2>
          <p className="text-gray-700">
            If validation fails, review the message displayed at the top. Common issues include:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Missing required fields in a problem node.</li>
            <li>Unreachable nodes (ensure a continuous path from start to end).</li>
            <li>Incorrect edge conditions (see step 3).</li>
            <li>Self-links or duplicate connections.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
