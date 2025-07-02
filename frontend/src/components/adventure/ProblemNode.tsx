import { Handle, Position } from "reactflow";
import type { Problem } from "../shared/types";


interface ProblemNodeProps {
  data: Problem;
  className?: string;
}

const ProblemNode = ({ data, className = "" }: ProblemNodeProps) => (
  <div className={`problem-node ${className}`}>
    <Handle
      type="target"
      position={Position.Left}
      className="handle target-handle"
      isConnectable={true}
    />
    
    <div className="problem-title">{data.title}</div>
    <div className="problem-meta">
      {data.language} | Diff: {data.difficulty}
    </div>
    
    <Handle
      type="source"
      position={Position.Right}
      className="handle source-handle"
      isConnectable={true}
    />
  </div>
);

export default ProblemNode;