import React from 'react';
import { useNavigate } from 'react-router-dom';

import ReactFlow, {
  Background,
  Controls,
  Position,
  ConnectionLineType,
  ConnectionMode,
  getBezierPath,
  Handle,
  type EdgeProps
} from 'reactflow';
import 'reactflow/dist/style.css';

import type {
  Problem,
  GraphEdge as GraphEdgeType,
  GraphNode
} from '../components/shared/types'

interface ProblemNodeProps {
  data: Problem;
  className?: string;
}

const ProblemNode: React.FC<ProblemNodeProps> = ({ data, className = "" }) => {
  const nodeStyle: React.CSSProperties = {
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    backgroundColor: "white",
    minWidth: "150px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative",
    transform: "scale(1)",
    transition: "all 0.3s ease",
  };

  const titleStyle: React.CSSProperties = {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "6px",
    color: "#1f2937",
    lineHeight: "1.3",
  };

  const metaStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "400",
  };

  const handleStyle: React.CSSProperties = {
    width: "12px",
    height: "12px",
    backgroundColor: "#6b7280",
    border: "2px solid white",
    borderRadius: "50%",
  };

  const displayTitle = data.label || data.title || "Untitled Problem";

  return (
    <div className={`problem-node ${className}`} style={nodeStyle}>
      <Handle
        type="target"
        position={Position.Left}
        className="handle target-handle"
        style={handleStyle}
        isConnectable={true}
      />
      <div className="problem-title" style={titleStyle}>
        {displayTitle}
      </div>
      <div className="problem-meta" style={metaStyle}>
        {data.language || 'JavaScript'}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="handle source-handle"
        style={handleStyle}
        isConnectable={true}
      />
    </div>
  );
};

const CustomEdge: React.FC<EdgeProps> = (props) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data,
  } = props;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeColor = data?.condition === "correct"
    ? "#10B981"
    : "#EF4444";

  const labelText = data?.condition === "correct" 
    ? "Correct"
    : "Incorrect";
    
  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={3}
        strokeLinecap="round"
        markerEnd={markerEnd}
      />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <text
        x={labelX}
        y={labelY - 5}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill={edgeColor}
        style={{ pointerEvents: 'none' }}
      >
        {labelText}
      </text>
    </>
  );
};

const nodeTypes = {
  problemNode: ProblemNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

// Valid example: Branching paths
const validNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Problem 1', 
      language: 'JavaScript',
      description: 'Sample problem 1',
      code_snippet: 'console.log("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 50 },
    data: { 
      id: '2',
      title: 'Problem 2', 
      language: 'Python',
      description: 'Sample problem 2',
      code_snippet: 'print("Hello")',
      expected_output: 'Hello'
    },
  },
  {
    id: '3',
    type: 'problemNode',
    position: { x: 300, y: 150 },
    data: { 
      id: '3',
      title: 'Problem 3', 
      language: 'Java',
      description: 'Sample problem 3',
      code_snippet: 'System.out.println("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '4',
    type: 'problemNode',
    position: { x: 550, y: 100 },
    data: { 
      id: '4',
      title: 'Final Problem', 
      language: 'C++',
      description: 'Final problem',
      code_snippet: 'cout << "Hello";',
      expected_output: 'Hello'
    },
  },
];

const validEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'custom',
    data: { condition: 'incorrect' },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'custom',
    data: { condition: 'correct' },
  },
];

// Valid example: Linear progression (correct only)
const linearNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Warm-up', 
      language: 'JavaScript',
      description: 'Easy starter problem',
      code_snippet: 'console.log("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 100 },
    data: { 
      id: '2',
      title: 'Intermediate', 
      language: 'JavaScript',
      description: 'Medium difficulty',
      code_snippet: 'console.log("World");',
      expected_output: 'World'
    },
  },
  {
    id: '3',
    type: 'problemNode',
    position: { x: 550, y: 100 },
    data: { 
      id: '3',
      title: 'Challenge', 
      language: 'JavaScript',
      description: 'Hard problem',
      code_snippet: 'console.log("Done!");',
      expected_output: 'Done!'
    },
  },
];

const linearEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'custom',
    data: { condition: 'correct' },
  },
];

// Invalid: No correct edge from start
const noCorrectEdgeNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Problem 1', 
      language: 'JavaScript',
      description: 'Sample problem 1',
      code_snippet: 'console.log("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 100 },
    data: { 
      id: '2',
      title: 'Final Problem', 
      language: 'Python',
      description: 'Final problem',
      code_snippet: 'print("Hello")',
      expected_output: 'Hello'
    },
  },
];

const noCorrectEdgeEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'incorrect' },
  },
];

const unreachableNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Problem 1', 
      language: 'JavaScript',
      description: 'Sample problem 1',
      code_snippet: 'console.log("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 100 },
    data: { 
      id: '2',
      title: 'Problem 2', 
      language: 'Python',
      description: 'Sample problem 2',
      code_snippet: 'print("Hello")',
      expected_output: 'Hello'
    },
  },
  {
    id: '3',
    type: 'problemNode',
    position: { x: 150, y: 200 },
    data: { 
      id: '3',
      title: 'Unreachable!', 
      language: 'Java',
      description: 'Unreachable problem',
      code_snippet: 'System.out.println("Hello");',
      expected_output: 'Hello'
    },
  },
];

const unreachableEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'correct' },
  },
];

const multipleStartNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 50 },
    data: { 
      id: '1',
      title: 'Start A', 
      language: 'JavaScript',
      description: 'First starting point',
      code_snippet: 'console.log("A");',
      expected_output: 'A'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 50, y: 150 },
    data: { 
      id: '2',
      title: 'Start B', 
      language: 'Python',
      description: 'Second starting point',
      code_snippet: 'print("B")',
      expected_output: 'B'
    },
  },
  {
    id: '3',
    type: 'problemNode',
    position: { x: 300, y: 100 },
    data: { 
      id: '3',
      title: 'Final Problem', 
      language: 'Java',
      description: 'Final problem',
      code_snippet: 'System.out.println("Done");',
      expected_output: 'Done'
    },
  },
];

const multipleStartEdges: GraphEdgeType[] = [
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'custom',
    data: { condition: 'correct' },
  },
];

const multipleEndNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Start Problem', 
      language: 'JavaScript',
      description: 'Starting problem',
      code_snippet: 'console.log("Start");',
      expected_output: 'Start'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 50 },
    data: { 
      id: '2',
      title: 'End A', 
      language: 'Python',
      description: 'First ending',
      code_snippet: 'print("End A")',
      expected_output: 'End A'
    },
  },
  {
    id: '3',
    type: 'problemNode',
    position: { x: 300, y: 150 },
    data: { 
      id: '3',
      title: 'End B', 
      language: 'Java',
      description: 'Second ending',
      code_snippet: 'System.out.println("End B");',
      expected_output: 'End B'
    },
  },
];

const multipleEndEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'custom',
    data: { condition: 'incorrect' },
  },
];

// Invalid: Multiple correct edges
const multipleCorrectNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Problem 1', 
      language: 'JavaScript',
      description: 'Sample problem 1',
      code_snippet: 'console.log("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 50 },
    data: { 
      id: '2',
      title: 'Option A', 
      language: 'Python',
      description: 'First correct path',
      code_snippet: 'print("A")',
      expected_output: 'A'
    },
  },
  {
    id: '3',
    type: 'problemNode',
    position: { x: 300, y: 150 },
    data: { 
      id: '3',
      title: 'Option B', 
      language: 'Java',
      description: 'Second correct path',
      code_snippet: 'System.out.println("B");',
      expected_output: 'B'
    },
  },
];

const multipleCorrectEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'custom',
    data: { condition: 'correct' },
  },
];

// Invalid: Self-referencing loop
const selfLoopNodes: GraphNode[] = [
  {
    id: '1',
    type: 'problemNode',
    position: { x: 50, y: 100 },
    data: { 
      id: '1',
      title: 'Problem 1', 
      language: 'JavaScript',
      description: 'Sample problem 1',
      code_snippet: 'console.log("Hello");',
      expected_output: 'Hello'
    },
  },
  {
    id: '2',
    type: 'problemNode',
    position: { x: 300, y: 100 },
    data: { 
      id: '2',
      title: 'Self-Loop Problem', 
      language: 'Python',
      description: 'This connects to itself',
      code_snippet: 'print("Loop")',
      expected_output: 'Loop'
    },
  },
];

const selfLoopEdges: GraphEdgeType[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'custom',
    data: { condition: 'correct' },
  },
  {
    id: 'e2-2',
    source: '2',
    target: '2',
    type: 'custom',
    data: { condition: 'incorrect' },
  },
];

interface ExampleGraphProps {
  nodes: GraphNode[];
  edges: GraphEdgeType[];
  title: string;
  description: string;
  isValid?: boolean;
}

const ExampleGraph: React.FC<ExampleGraphProps> = ({ nodes, edges, title, description, isValid = true }) => {
  return (
    <div className="mb-8">
      <h4 className={`text-lg font-semibold mb-2 ${isValid ? 'text-green-700' : 'text-red-700'}`}>
        {isValid ? '✓' : '✗'} {title}
      </h4>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="border-2 border-gray-200 rounded-lg" style={{ height: '400px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          connectionLineType={ConnectionLineType.Bezier}
          connectionMode={ConnectionMode.Loose}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={12} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};

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
      
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg p-8 space-y-8">
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
            <li>A valid adventure must contain at least <strong>2</strong> problem nodes.</li>
          </ul>

          <h2 className="text-2xl font-semibold">2. Connect Nodes</h2>
          <div className="text-gray-700 space-y-3">
            <p>Each problem node has two handles:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>The <strong>right handle</strong> is for outgoing edges (defines which problems can be reached from the current node)</li>
              <li>The <strong>left handle</strong> is for incoming edges (defines which problems lead to the current node)</li>
            </ul>
            <p>To create connections:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Drag from a node's right handle to another node's left handle to create an edge.</li>
            </ul>
            <p>Adventure structure requirements:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Must have exactly <strong>one starting node</strong> (no incoming edges)</li>
              <li>Must have exactly <strong>one ending node</strong> (no outgoing edges)</li>
              <li>All nodes must be reachable from the start node</li>
              <li>No node can connect to itself</li>
              <li>No duplicate edges between the same nodes</li>
            </ul>
          </div>

          <h2 className="text-2xl font-semibold">3. Define Edge Conditions</h2>
          <div className="text-gray-700 space-y-3">
            <p>Hover over an edge and select it to set its condition. There are two types:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><span className="inline-block w-4 h-1 bg-green-500 mr-2"></span><strong>Correct (Green):</strong> Taken when the current problem is answered correctly</li>
              <li><span className="inline-block w-4 h-1 bg-red-500 mr-2"></span><strong>Incorrect (Red):</strong> Taken when the current problem is answered incorrectly</li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
              <h4 className="font-semibold text-blue-800">Edge Rules:</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-1 mt-2">
                <li>Every problem node other than the ending node must have at least one <strong>correct</strong> edge</li>
                <li>Nodes can have <strong>only a correct edge</strong> - users will be stuck on that problem until they answer correctly</li>
                <li>Only one <strong>correct</strong> and one <strong>incorrect</strong> outgoing edge per node</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold">4. Validate and Save</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Click "Save Adventure" to run validation.</li>
            <li>Fix any error messages (e.g., missing fields, unreachable nodes).</li>
            <li>Once "Save" succeeds, your adventure is live and shareable via code.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Examples</h2>
          <p className="text-gray-700 mb-6">
            Here are visual examples of valid and invalid adventure structures:
          </p>

          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-green-700">✓ Valid Adventure Examples</h3>

            <ExampleGraph
              nodes={validNodes}
              edges={validEdges}
              title="Branching Adventure with Incorrect Path"
              description="Problem 1 branches based on correctness. Both Problem 2 and 3 require correct answers to proceed to the final problem. This allows adventure creators to design adventures with adaptive difficulty - increasing the difficulty when users answer correctly and decreasing difficulty when users answrer incorrectly."
              isValid={true}
            />

            <ExampleGraph
              nodes={linearNodes}
              edges={linearEdges}
              title="Linear Progression Adventure"
              description="A simple sequence where students must answer each problem correctly to advance. This is perfect for building up concepts step-by-step."
              isValid={true}
            />

            <h3 className="text-xl font-semibold text-red-700 mt-12">✗ Invalid Adventure Examples</h3>

            <ExampleGraph
              nodes={noCorrectEdgeNodes}
              edges={noCorrectEdgeEdges}
              title="No Correct Path from Start"
              description="Problem 1 only has an 'incorrect' edge, meaning students must answer wrong to progress. Every non-ending node needs at least one 'correct' edge."
              isValid={false}
            />

            <ExampleGraph
              nodes={unreachableNodes}
              edges={unreachableEdges}
              title="Unreachable Node"
              description="Problem 3 cannot be reached from the start node, making it invalid. All nodes must be reachable from the starting node."
              isValid={false}
            />

            <ExampleGraph
              nodes={multipleStartNodes}
              edges={multipleStartEdges}
              title="Multiple Starting Points"
              description="Both 'Start A' and 'Start B' have no incoming edges, creating ambiguity about where the adventure begins. Adventures must have exactly one starting node. Starting nodes are implicitly defined as nodes with no incoming edges."
              isValid={false}
            />

            <ExampleGraph
              nodes={multipleEndNodes}
              edges={multipleEndEdges}
              title="Multiple Ending Points"
              description="Both 'End A' and 'End B' have no outgoing edges, creating multiple possible endings. Adventures must have exactly one ending node. Ending nodes are implicitly defined as nodes with no outgoing edges"
              isValid={false}
            />

            <ExampleGraph
              nodes={multipleCorrectNodes}
              edges={multipleCorrectEdges}
              title="Multiple Correct Edges"
              description="Problem 1 has two 'correct' edges leading to different problems. This creates ambiguity - each node can only have one correct path and optionally one incorrect path."
              isValid={false}
            />

            <ExampleGraph
              nodes={selfLoopNodes}
              edges={selfLoopEdges}
              title="Self-Referencing Loop"
              description="The 'Self-Loop Problem' connects back to itself on incorrect answers, creating an infinite loop. Nodes cannot connect to themselves."
              isValid={false}
            />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Troubleshooting</h2>
          <p className="text-gray-700 mb-4">
            If validation fails, review the error message carefully. Here are the most common issues and how to fix them:
          </p>
          
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <h4 className="font-semibold text-red-800">Missing Problem Information</h4>
              <p className="text-red-700">Error: "One or more problem nodes are missing information"</p>
              <p className="text-red-600 text-sm mt-1">Solution: Ensure every problem node has Title, Description, Language, Code Snippet, and Expected Output filled in.</p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <h4 className="font-semibold text-red-800">Unreachable Nodes</h4>
              <p className="text-red-700">Error: "These problems are unreachable: [Problem Names]"</p>
              <p className="text-red-600 text-sm mt-1">Solution: Connect these nodes to the main path by adding edges from reachable nodes.</p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <h4 className="font-semibold text-red-800">Missing Correct Edges</h4>
              <p className="text-red-700">Error: "[Problem] must have at least one 'correct' outgoing edge"</p>
              <p className="text-red-600 text-sm mt-1">Solution: Add a 'correct' edge from this problem to another node (except for the final problem).</p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <h4 className="font-semibold text-red-800">Structure Issues</h4>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                <li>Multiple start/end nodes: Remove extra connections to have exactly one start and one end</li>
                <li>Self-loops: Remove edges that connect a node to itself</li>
                <li>Multiple edges of same type: Keep only one 'correct' and optionally one 'incorrect' edge per node</li>
                <li>Duplicate connections: Remove redundant edges between the same nodes</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
            <h4 className="font-semibold text-blue-800">Tips</h4>
            <ul className="list-disc list-inside text-blue-700 space-y-1 mt-2">
              <li>Start simple: Create a linear path first, then add branching</li>
              <li>Test your logic: Follow the correct and incorrect paths mentally</li>
              <li>Use meaningful titles: Make it clear what each problem teaches</li>
              <li>Save frequently: Use "Save Adventure" to save your work as you build</li>
            </ul>
          </div>
          </section>

          </div>
          </div>
        
  )}