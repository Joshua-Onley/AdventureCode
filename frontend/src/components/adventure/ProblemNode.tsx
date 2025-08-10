import { Handle, Position } from "reactflow";
import type { Problem } from "../shared/types";

interface ProblemNodeProps {
  data: Problem & { isCurrent?: boolean, label?: string };
  className?: string;
}

const ProblemNode = ({ data, className = "" }: ProblemNodeProps) => {
  const nodeStyle = {
    border: data.isCurrent ? "3px solid #3b82f6" : "2px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
    backgroundColor: data.isCurrent ? "#dbeafe" : "white",
    minWidth: "150px",
    boxShadow: data.isCurrent
      ? "0 0 0 4px rgba(59, 130, 246, 0.3), 0 8px 16px rgba(0,0,0,0.15)"
      : "0 2px 4px rgba(0,0,0,0.1)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    position: "relative" as const,
    transform: data.isCurrent ? "scale(1.05)" : "scale(1)",
    transition: "all 0.3s ease",
  };

  const titleStyle = {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "6px",
    color: data.isCurrent ? "#1e40af" : "#1f2937",
    lineHeight: "1.3",
  };

  const metaStyle = {
    fontSize: "12px",
    color: data.isCurrent ? "#3730a3" : "#6b7280",
    fontWeight: "400",
  };

  const handleStyle = {
    width: "12px",
    height: "12px",
    backgroundColor: data.isCurrent ? "#3b82f6" : "#6b7280",
    border: "2px solid white",
    borderRadius: "50%",
  };

  const currentNodeIndicator = data.isCurrent ? (
    <div style={{
      position: "absolute",
      top: "-8px",
      right: "-8px",
      width: "20px",
      height: "20px",
      backgroundColor: "#ef4444",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "12px",
      fontWeight: "bold",
      color: "white",
      zIndex: 10,
      boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    }}>
      ➤
    </div>
  ) : null;

  const displayTitle = data.label || data.title || "Untitled Problem";

  return (
    <div className={`problem-node ${className}`} style={nodeStyle}>
      {currentNodeIndicator}
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
        {data.language}
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

export default ProblemNode;