import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  ConnectionLineType,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemNode from "../components/adventure/ProblemNode";
import CustomEdge from "../components/adventure/CustomEdge";
import EdgeLegend from "../components/adventure/EdgeLegend";
import CodeEditor from "../components/shared/CodeEditor";
import AttemptAdventureHeader from '../components/adventure/AttemptAdventureHeader';
import StatusMessages from "../components/adventure/StatusMessages";
import { useMessages } from "../hooks/useMessages";
import { useAttemptAdventure } from "../hooks/useAttemptAdventure";

const nodeTypes = {
  problemNode: ProblemNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const AttemptAdventure: React.FC = () => {
  const { code: accessCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { message } = useMessages();
  
  const {
    adventure,
    attempt,
    nodes,
    edges,
    code,
    loading,
    error,
    output,
    submissionStatus,
    tokenExpired,
    setCode,
    handleSubmit,
    currentNode,
    isGuestAttempt,
  } = useAttemptAdventure(accessCode);


  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md text-center">
          <strong>Error:</strong>
          <div className="mt-2">{error}</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (tokenExpired) {
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Adventure</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/")}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Home
            </button>
          </div>
        </div>
        <StatusMessages
          showTokenExpired={tokenExpired}
          message={message}
        />
      </div>
    );
  }

  if (loading || !adventure || !attempt) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const node = currentNode();
  if (!node) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-red-600">Node not found</div>
      </div>
    );
  }

  const currentId = attempt?.current_node_id;
  const isGuest = isGuestAttempt(attempt);

  return (
    <div className="flex flex-col h-screen">
      <AttemptAdventureHeader 
        adventureName={adventure.name}
        adventureDescription={adventure.description}
        isGuest={isGuest}
      />
      
      <StatusMessages
        showTokenExpired={tokenExpired}
        message={message}
      />

      {attempt.completed && (
        <div className={`px-4 py-3 rounded ${
          isGuest 
            ? "bg-yellow-100 border border-yellow-400 text-yellow-700"
            : "bg-green-100 border border-green-400 text-green-700"
        }`}>
          <strong>Congratulations!</strong>
          <div className="mt-2">
            You've completed the adventure!
            {isGuest && " (Guest mode - progress not saved)"}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={67} minSize={30} maxSize={80}>
            <div className="h-full">
              <ReactFlow
                nodes={nodes.map((n) => ({
                  ...n,
                  data: {
                    ...n.data,
                    isCurrent: n.id === currentId,
                  },
                }))}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                connectionLineType={ConnectionLineType.Bezier}
                connectionMode={ConnectionMode.Loose}
                nodesDraggable={false}
                nodesConnectable={false}
                connectionRadius={30}
              >
                <Controls />
                <MiniMap />
                <Background gap={12} size={1} />
              </ReactFlow>
            </div>
          </Panel>
          <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors cursor-col-resize" />
          <Panel defaultSize={33} minSize={20} maxSize={70}>
            <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">{node.data.title}</h2>
                  <p className="text-gray-700 mb-4">{node.data.description}</p>
                  {isGuest && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-yellow-800 text-sm">
                        <strong>Guest Mode: </strong> 
                        Your progress won't be saved if you leave or refresh the page.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Your Code ({node.data.language}):
                  </label>
                  <CodeEditor
                    placeholder="Write your code here..."
                    value={code}
                    onChange={(value) => setCode(value)}
                    language={node.data.language.toLowerCase()} 
                    height="200px" 
                    theme="vs-light"
                  />
                </div>
                
                <button 
                  onClick={() => handleSubmit(code, node.data.language)}
                  className={`w-full font-bold py-2 px-4 rounded mb-4 ${
                    isGuest 
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  Run & Submit
                </button>

                {output && (
                  <div className={`p-4 rounded-lg mb-4 ${
                    submissionStatus === 'correct'
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : submissionStatus === 'incorrect'
                    ? "bg-red-100 border border-red-400 text-red-700"
                    : "bg-blue-100 border border-blue-400 text-blue-700"
                  }`}>
                    <strong>Result:</strong>
                    <pre className="whitespace-pre-wrap mt-2 text-sm">{output}</pre>
                  </div>
                )}
                
                <EdgeLegend/>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default AttemptAdventure;